from kulumasiina_backend import models, schemas
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
    return (
        db.query(models.Receipt)
        .where(models.Receipt.id.in_(ids))
        .all()
    )


def create_entry_full(entry: schemas.EntryCreate, db: Session) -> schemas.Entry:
    mileages = [
        models.Mileage(
            **mileage.dict()
        ) for mileage in entry.mileages
    ]
    items = [
        models.Item(
            **item.dict() | dict(
                # TODO: raise error for invalid receipt ids?
                receipts=_get_receipts(item.receipts, db=db)
            )
        ) for item in entry.items
    ]
    db_entry = models.Entry(
        **entry.dict() | dict(  # update keys from entry    
            items=items,
            mileages=mileages,
        ),
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return schemas.Entry.from_orm(db_entry)


def get_entries(db: Session) -> list[models.Entry]:
    return db.query(models.Entry).all()

def get_item_reciepts(item_id: int, db: Session):
    reciepts = db.query(models.Receipt.filename,models.Receipt.item_id, models.Receipt.id).where(models.Receipt.item_id == item_id).all()
    return reciepts

def get_entry_by_id(id: int, db: Session) -> models.Entry | None:
    return db.query(models.Entry).filter(models.Entry.id == id).first()

# def create_mileage(mileage: schemas.MileageCreate, db: Session) -> models.Mileage:
#     db_mileage = models.Mileage(
#         description=mileage.description,
#         date=mileage.date,
#         distance_km=mileage.distance_km,
#         entry_id=mileage.entry_id,
#     )
#     db.add(db_mileage)
#     db.commit()
#     db.refresh(db_mileage)
#     return db_mileage

# def get_mileage_by_id(id: int, db: Session) -> models.Mileage | None:
#     return db.query(models.Mileage).filter(models.Mileage.id == id).first()


# def create_item(author: str, item: schemas.ItemCreate, db: Session) -> models.Item:
#     db_item = models.Item(
#         description=item.description,
#         date=item.date,
#         value_cents=item.value_cents,
#         entry_id=item.entry_id,
#         author=author,
#         receipts=[],
#     )
#     db.add(db_item)
#     db.commit()
#     db.refresh(db_item)
#     return db_item

def get_item_by_id(id: int, db: Session) -> schemas.Item | None:
    db_item = db.query(models.Item).filter(models.Item.id == id).first()
    return schemas.Item.from_orm(db_item)


def create_receipt(receipt: schemas.ReceiptCreate, db: Session) -> schemas.ReceiptResponse:
    db_receipt = models.Receipt(**receipt.dict())
    db.add(db_receipt)
    db.commit()
    db.refresh(db_receipt)
    return schemas.ReceiptResponse.from_orm(db_receipt)

def get_reciept_data(id, db: Session):
    return db.query(models.Receipt.data).filter(models.Receipt.id == id).first()[0]

def delete_item(id, db: Session):
    return db.query(models.Item).filter(models.Item.id == id).delete()