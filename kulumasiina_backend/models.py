from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship, mapped_column, Mapped, DeclarativeBase
from datetime import date, datetime

class Base(DeclarativeBase):
    id: Mapped[int] = mapped_column(primary_key=True)


class Mileage(Base):
    __tablename__ = "mileage"
    entry_id = mapped_column(ForeignKey("entry.id"))
    date: Mapped[date]
    description: Mapped[str]
    route: Mapped[str]
    distance: Mapped[float]
    plate_no: Mapped[str]
    account: Mapped[str | None] = mapped_column(default=None)


class Attachment(Base):
    __tablename__ = "attachment"
    item_id: Mapped[int | None] = mapped_column(ForeignKey("item.id"))
    filename: Mapped[str]
    data: Mapped[bytes] = mapped_column(deferred=True)
    value_cents: Mapped[int | None] = mapped_column(default=None)
    is_not_receipt: Mapped[bool] = mapped_column(default=False)


class Item(Base):
    __tablename__ = "item"
    entry_id: Mapped[int] = mapped_column(ForeignKey("entry.id"))
    description: Mapped[str]
    date: Mapped[date]
    attachments: Mapped[list[Attachment]] = relationship(lazy="immediate", cascade="all, delete")
    account: Mapped[str | None] = mapped_column(default=None)


class Entry(Base):
    __tablename__ = "entry"
    name: Mapped[str]
    iban: Mapped[str]
    title: Mapped[str]
    contact: Mapped[str]

    submission_date: Mapped[datetime] = mapped_column(default=datetime.now)
    approval_date: Mapped[datetime | None] = mapped_column(default=None)
    paid_date: Mapped[datetime | None] = mapped_column(default=None)
    rejection_date: Mapped[datetime | None] = mapped_column(default=None)

    # Meeting number or other info identifying where the reimbursement was approved (signature/meeting)
    approval_note: Mapped[str | None] = mapped_column(default=None)

    archived: Mapped[bool] = mapped_column(default=False)

    gov_id: Mapped[str | None] = mapped_column(default=None)
    # TODO: status enum tms?
    status: Mapped[str] = mapped_column(
        default="submitted"
    )  # "approved", "paid", "submitted", "denied"
    items: Mapped[list[Item]] = relationship(lazy="immediate", cascade="all, delete")
    mileages: Mapped[list[Mileage]] = relationship(
        lazy="immediate", cascade="all, delete"
    )
