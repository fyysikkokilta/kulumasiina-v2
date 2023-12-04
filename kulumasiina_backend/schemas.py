import datetime
from pydantic import BaseModel, ConfigDict
from datetime import date


class ReceiptResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    filename: str | None


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
    model_config = ConfigDict(from_attributes=True)
    id: int
    receipts: list[ReceiptResponse]


# NOTE: This is not exposed to the frontend yet due to the data privacy concerns.
class MileageCreate(BaseModel):
    gov_id: str  # TODO: GDPR
    description: str
    date: date
    route: str
    plate_no: str  # TODO: GDPR
    distance: float


class Mileage(MileageCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    gov_id: str  # TODO: GDPR


class _EntryBase(BaseModel):
    name: str
    iban: str
    title: str


class EntryCreate(_EntryBase):
    items: list[ItemCreate]
    mileages: list[MileageCreate]


class Entry(_EntryBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: str
    items: list[Item]
    mileages: list[Mileage]
    submission_date: datetime.datetime
