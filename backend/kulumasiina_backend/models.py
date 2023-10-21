from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, LargeBinary, Date
from sqlalchemy.orm import relationship, declared_attr, mapped_column, Mapped, DeclarativeBase
from datetime import date

from sqlalchemy.orm import as_declarative

# @as_declarative()
# class Base():
#     @declared_attr
#     def __tablename__(cls):
#         return cls.__name__.lower()
#     id: Mapped[int] = mapped_column(primary_key=True)


# # from db import Base

# class Receipt(Base):
#     # id = Column(Integer, primary_key=True, index=True)
#     item_id: Mapped[int] = mapped_column(ForeignKey('item.id'))
#     filename: Mapped[str] = mapped_column()
#     data: Mapped[bytes] = mapped_column()


# class Item(Base):
#     # id = Column(Integer, primary_key=True, index=True)
#     # description = Column(String),
#     description: Mapped[str] = mapped_column()
#     # date: Mapped[date] = mapped_column()
#     date = Column(Date)
#     value_cents: Mapped[int] = mapped_column()  # in cents
#     entry_id: Mapped[int] = mapped_column(ForeignKey('entry.id'))
#     author: Mapped[str] = mapped_column()
#     receipts: Mapped[list[Receipt]] = relationship()

# class Mileage(Base):
#     description: Mapped[str] = mapped_column()
#     # date: Mapped[date] = mapped_column()
#     date = Column(Date)
#     distance_km: Mapped[int] = mapped_column()
#     entry_id: Mapped[int] = mapped_column(ForeignKey('entry.id'))
#     # todo: social security, plate number

# class Entry(Base):
#     # id: Column(Integer, primary_key=True, index=True)
#     name: Mapped[str] = mapped_column()
#     title: Mapped[str] = mapped_column()
#     iban: Mapped[str] = mapped_column()
#     state: Mapped[str] = mapped_column()
#     author: Mapped[str] = mapped_column()
#     # items: Mapped[list[Item | Mileage]] = relationship(back_populates='owner')
#     items: Mapped[list[Item]] = relationship()
#     mileages: Mapped[list[Mileage]] = relationship()


class Base(DeclarativeBase):
    id: Mapped[int] = mapped_column(primary_key=True)


class Mileage(Base):
    __tablename__ = 'mileage'
    entry_id = mapped_column(ForeignKey('entry.id'))
    # gov_id: Mapped[str]  # TODO: GDPR
    date: Mapped[date]
    description: Mapped[str]
    route: Mapped[str]
    distance: Mapped[float]
    plate_no: Mapped[str]  # TODO: GDPR


class Receipt(Base):
    __tablename__ = 'receipt'
    item_id: Mapped[int | None] = mapped_column(ForeignKey('item.id'))
    filename: Mapped[str]
    data: Mapped[bytes]


class Item(Base):
    __tablename__ = 'item'
    entry_id: Mapped[int] = mapped_column(ForeignKey('entry.id'))
    description: Mapped[str]
    date: Mapped[date]
    value_cents: Mapped[int]
    receipts: Mapped[list[Receipt]] = relationship()

    # @property
    # def receipt_ids(self) -> list[int]:
    #     return [receipt.id for receipt in self.receipts]


class Entry(Base):
    __tablename__ = 'entry'
    name: Mapped[str]
    iban: Mapped[str]
    title: Mapped[str]
    gov_id : Mapped[str]
    # TODO: status enum tms?
    status: Mapped[str] = mapped_column(default='submitted')
    items: Mapped[list[Item]] = relationship()
    mileages: Mapped[list[Mileage]] = relationship()
