from datetime import date, datetime, timedelta
from kulumasiina_backend.pdf_util import is_file_acceptable
from . import models, schemas
from sqlalchemy.orm import Session, defer


# def create_entry(author: str, entry: schemas.EntryCreate, db: Session) -> models.Entry:
#     db_entry = models.Entry(
#         name=entry.name,
#         title=entry.title,
#         iban=entry.iban,
#         state='submitted',  # TODO: enum tms.
#         author=author,
#         items=[],
#         mileages=[],
#     )
#     db.add(db_entry)
#     db.commit()
#     db.refresh(db_entry)
#     return db_entry


def _get_attachments(
    attachments: list[schemas.AttachmentUpdate], db: Session
) -> list[models.Attachment]:
    return (
        db.query(models.Attachment)
        .where(models.Attachment.id.in_(attachment.id for attachment in attachments))
        .all()
    )


def create_entry_full(entry: schemas.EntryCreate, db: Session) -> schemas.Entry:
    mileages = [models.Mileage(**mileage.dict()) for mileage in entry.mileages]
    items = [
        models.Item(
            **item.dict()
            | dict(
                # TODO: raise error for invalid attachment ids?
                attachments=_get_attachments(item.attachments, db=db)
            )
        )
        for item in entry.items
    ]
    db_entry = models.Entry(
        **entry.model_dump()
        | {
            "mileages": mileages,
            "items": items,
        },
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)

    # Collect attachment updates
    attachment_updates = []
    for item in entry.items:
        for attachment in item.attachments:
            attachment_updates.append(
                {
                    "id": attachment.id,
                    "value_cents": attachment.value_cents,
                    "is_not_receipt": attachment.is_not_receipt,
                }
            )

    # Perform bulk update for attachments
    if attachment_updates:
        db.bulk_update_mappings(models.Attachment, attachment_updates)
        db.commit()

    return schemas.Entry.from_orm(db_entry)


def get_entries(db: Session) -> list[models.Entry]:
    return db.query(models.Entry).options(defer(models.Entry.gov_id)).all()


def get_item_attachments(item_id: int, db: Session):
    attachments = (
        db.query(
            models.Attachment.filename, models.Attachment.item_id, models.Attachment.id
        )
        .where(models.Attachment.item_id == item_id)
        .all()
    )
    return attachments


def get_entry_by_id(id: int, db: Session) -> models.Entry | None:
    return db.query(models.Entry).filter(models.Entry.id == id).first()


def get_entries_by_ids(ids: list[int], db: Session) -> list[models.Entry]:
    return db.query(models.Entry).where(models.Entry.id.in_(ids)).all()


def get_item_by_id(id: int, db: Session) -> schemas.Item | None:
    db_item = db.query(models.Item).filter(models.Item.id == id).first()
    return schemas.Item.model_validate(db_item)


class UnknownFileFormatError(Exception):
    """Raised when the file format is not supported"""


def create_attachment(
    attachment: schemas.AttachmentCreate, db: Session
) -> schemas.AttachmentResponse:
    # Verify that the attachment file is acceptable
    file_type = is_file_acceptable(attachment.data)
    if file_type is None:
        raise UnknownFileFormatError("File type not supported")

    db_attachment = models.Attachment(**attachment.dict())
    db.add(db_attachment)
    db.commit()
    db.refresh(db_attachment)
    return schemas.AttachmentResponse.model_validate(db_attachment)


def delete_attachment(id: int, db: Session):
    to_del = db.query(models.Attachment).filter(models.Attachment.id == id).first()
    db.delete(to_del)
    db.commit()


def get_attachment_data(id, db: Session):
    return (
        db.query(models.Attachment.data).filter(models.Attachment.id == id).first()[0]
    )


def delete_entry(id, db: Session):
    to_del = db.query(models.Entry).filter(models.Entry.id == id).first()
    db.delete(to_del)
    db.commit()


def delete_archived_old_entries(age_limit: int, db: Session):
    # Delete entries that have been paid and archived and are older than age_limit
    archived_entries = db.query(models.Entry).filter(models.Entry.archived == True)
    to_del = archived_entries.filter(
        models.Entry.paid_date < datetime.now() - timedelta(days=age_limit)
    ).all()
    for entry in to_del:
        db.delete(entry)
    # Delete entries that have been denied and archived and are older than age_limit
    to_del = archived_entries.filter(
        models.Entry.rejection_date < datetime.now() - timedelta(days=age_limit)
    ).all()
    for entry in to_del:
        db.delete(entry)
    db.commit()


def approve_entry(id: int, approval_date: date, approval_note: str, db: Session):
    db.query(models.Entry).filter(models.Entry.id == id).update(
        {
            models.Entry.status: "approved",
            models.Entry.approval_date: approval_date,
            models.Entry.approval_note: approval_note,
            models.Entry.rejection_date: None,
            models.Entry.paid_date: None,
        }
    )
    db.commit()


def deny_entry(id: int, db: Session):
    db.query(models.Entry).filter(models.Entry.id == id).update(
        {
            models.Entry.status: "denied",
            models.Entry.approval_date: None,
            models.Entry.approval_note: None,
            models.Entry.rejection_date: date.today(),
        }
    )
    db.commit()


def pay_entry(id: int, date: date, db: Session):
    db.query(models.Entry).filter(models.Entry.id == id).update(
        {
            models.Entry.status: "paid",
            models.Entry.paid_date: date,
            models.Entry.rejection_date: None,
            # Keep approval date
        }
    )
    db.commit()


def archive_entry(id: int, db: Session):
    db.query(models.Entry).filter(models.Entry.id == id).update(
        {
            models.Entry.archived: True,
        }
    )
    db.commit()


def reset_entry_status(id: int, db: Session):
    db.query(models.Entry).filter(models.Entry.id == id).update(
        {
            models.Entry.status: "submitted",
            models.Entry.approval_date: None,
            models.Entry.approval_note: None,
            models.Entry.rejection_date: None,
            models.Entry.paid_date: None,
        }
    )
    db.commit()


def update_item(id: int, item: schemas.ItemUpdate, db: Session):
    db.query(models.Item).filter(models.Item.id == id).update(
        {
            models.Item.description: item.description,
            models.Item.date: item.date,
        }
    )
    db.query(models.Attachment).filter(
        models.Attachment.id.in_(attachment.id for attachment in item.attachments)
    ).update(
        {
            models.Attachment.item_id: id,
        }
    )

    db.commit()

    # Collect attachment updates
    attachment_updates = []
    for attachment in item.attachments:
        attachment_updates.append(
            {
                "id": attachment.id,
                "value_cents": attachment.value_cents,
                "is_not_receipt": attachment.is_not_receipt,
            }
        )

    # Perform bulk update for attachments
    if attachment_updates:
        db.bulk_update_mappings(models.Attachment, attachment_updates)
        db.commit()


def update_mileage(id: int, mileage: schemas.MileageUpdate, db: Session):
    db.query(models.Mileage).filter(models.Mileage.id == id).update(
        {
            models.Mileage.description: mileage.description,
            models.Mileage.date: mileage.date,
            models.Mileage.route: mileage.route,
            models.Mileage.distance: mileage.distance,
            models.Mileage.plate_no: mileage.plate_no,
        }
    )
    db.commit()


def update_mileage_bookkeeping(id: int, account: str, db: Session):
    db.query(models.Mileage).filter(models.Mileage.id == id).update(
        {
            models.Mileage.account: account,
        }
    )
    db.commit()


def update_item_bookkeeping(id: int, account: str, db: Session):
    db.query(models.Item).filter(models.Item.id == id).update(
        {
            models.Item.account: account,
        }
    )
    db.commit()
