import datetime
from pydantic import BaseModel, ConfigDict
from datetime import date


class AttachmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    filename: str | None


class Attachment(AttachmentResponse):
    data: bytes
    value_cents: int | None
    is_not_receipt: bool


class AttachmentCreate(BaseModel):
    filename: str | None
    data: bytes


class AttachmentUpdate(BaseModel):
    id: int
    value_cents: int | None
    is_not_receipt: bool


class ItemCreate(BaseModel):
    description: str
    date: date
    attachments: list[AttachmentUpdate]


class Item(ItemCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    attachments: list[AttachmentResponse]


class ItemUpdate(BaseModel):
    description: str
    date: date
    attachments: list[AttachmentUpdate]


class MileageCreate(BaseModel):
    description: str
    date: date
    route: str
    plate_no: str
    distance: float


class Mileage(MileageCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int


class MileageUpdate(MileageCreate):
    date: date
    description: str
    route: str
    plate_no: str
    distance: float


class _EntryBase(BaseModel):
    name: str
    contact: str
    iban: str
    title: str
    gov_id: str | None


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
