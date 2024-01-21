from datetime import date, datetime
from kulumasiina_backend.pdf_util import is_file_acceptable
from . import models, schemas
from sqlalchemy.orm import Session


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


def _get_receipts(ids: list[int], db: Session) -> list[models.Receipt]:
    return db.query(models.Receipt).where(models.Receipt.id.in_(ids)).all()


def create_entry_full(entry: schemas.EntryCreate, db: Session) -> schemas.Entry:
    mileages = [models.Mileage(**mileage.dict()) for mileage in entry.mileages]
    items = [
        models.Item(
            **item.dict()
            | dict(
                # TODO: raise error for invalid receipt ids?
                receipts=_get_receipts(item.receipts, db=db)
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
    return schemas.Entry.from_orm(db_entry)


def get_entries(db: Session) -> list[models.Entry]:
    return db.query(models.Entry).all()


def get_item_receipts(item_id: int, db: Session):
    receipts = (
        db.query(models.Receipt.filename, models.Receipt.item_id, models.Receipt.id)
        .where(models.Receipt.item_id == item_id)
        .all()
    )
    return receipts


def get_entry_by_id(id: int, db: Session) -> models.Entry | None:
    return db.query(models.Entry).filter(models.Entry.id == id).first()


def get_item_by_id(id: int, db: Session) -> schemas.Item | None:
    db_item = db.query(models.Item).filter(models.Item.id == id).first()
    return schemas.Item.model_validate(db_item)


class UnknownFileFormatError(Exception):
    """Raised when the file format is not supported"""


def create_receipt(
    receipt: schemas.ReceiptCreate, db: Session
) -> schemas.ReceiptResponse:
    # Verify that the receipt file is acceptable
    file_type = is_file_acceptable(receipt.data)
    if file_type is None:
        raise UnknownFileFormatError("File type not supported")

    db_receipt = models.Receipt(**receipt.dict())
    db.add(db_receipt)
    db.commit()
    db.refresh(db_receipt)
    return schemas.ReceiptResponse.model_validate(db_receipt)


def get_receipt_data(id, db: Session):
    return db.query(models.Receipt.data).filter(models.Receipt.id == id).first()[0]


def delete_entry(id, db: Session):
    to_del = db.query(models.Entry).filter(models.Entry.id == id).first()
    db.delete(to_del)
    db.commit()

    # db.commit()


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


def pay_entry(id: int, date: datetime, db: Session):
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
            models.Item.value_cents: item.value_cents,
        }
    )
    db.commit()
