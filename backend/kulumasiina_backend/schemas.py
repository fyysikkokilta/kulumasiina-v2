from pydantic import BaseModel
from datetime import date

# def id_decorator(Base: BaseModel) -> BaseModel:
#     class Wrapper(Base):
#         id: int

#     return Wrapper

# class ReceiptBase(BaseModel):
#     data: bytes


# class ReceiptCreate(ReceiptBase):
#     filename: str


# class Receipt(ReceiptCreate):
#     id: int
#     filename: str


# class MileageCreate(BaseModel):
#     description: str
#     date: date
#     distance_km: int
#     entry_id: int
#     # todo: social security, plate number

# class Mileage(MileageCreate):
#     id: int

#     class Config:
#         orm_mode = True

# class ItemCreate(BaseModel):
#     entry_id: int
#     description: str
#     date: date
#     value_cents: int


# class Item(ItemCreate):
#     id: int
#     receipt_filenames: list[str]


# class EntryCreate(BaseModel):
#     name: str
#     title: str
#     iban: str

# class Entry(EntryCreate):
#     id: int
#     state: str
#     items: list[Item]
#     mileages: list[Mileage]

#     class Config:
#         orm_mode = True



# class ReceiptCreate(BaseModel):
#     data: bytes
#     filename: str


class ReceiptResponse(BaseModel):
    id: int
    filename: str | None

    class Config:
        orm_mode = True


class Receipt(ReceiptResponse):
    data: bytes

class ReceiptCreate(BaseModel):
    filename: str | None
    data: bytes

class ItemCreate(BaseModel):
    description: str
    date: date
    value_cents: int
    receipts: list[int]
    # receipts: list[int] = Field(alias='receipt_ids')  # alias for orm more
    # receipts: list[ReceiptResponse]


class Item(ItemCreate):
    id: int
    receipts: list[ReceiptResponse]

    class Config:
        orm_mode = True


class MileageCreate(BaseModel):
    gov_id: str  # TODO: GDPR
    description: str
    date: date
    route: str
    plate_no: str  # TODO: GDPR
    distance: float


class Mileage(MileageCreate):
    id: int
    gov_id: str  # TODO: GDPR
    class Config:
        orm_mode = True


class _EntryBase(BaseModel):
    name: str
    iban: str
    title: str


class EntryCreate(_EntryBase):
    items: list[ItemCreate]
    mileages: list[MileageCreate]


class Entry(_EntryBase):
    id: int
    status: str
    items: list[Item]
    mileages: list[Mileage]

    class Config:
        orm_mode = True
