import csv
import datetime
import os
from io import BytesIO, StringIO
from typing import Literal, TypedDict
import pathvalidate
from zipfile import ZipFile

class Row(TypedDict):
    yksikkohinta: int
    selite: str
    maara: int
    matkalasku: bool

def isExpense(row: Row) -> bool:
    return not row["matkalasku"]

def isMileage(row: Row) -> bool:
    return row["matkalasku"]

def hasExpenses(rows: list[Row]) -> bool:
    return any(filter(isExpense, rows))

def hasMileages(rows: list[Row]) -> bool:
    return any(filter(isMileage, rows))

def generate_csv(
    entry_id: int,
    name: str,
    IBAN: str,
    HETU: str | None,
    Pvm: datetime.datetime,
    rows: list[Row],
    pdf: tuple[str, bytes],
) -> tuple[str, bytes]:

  f = StringIO()

  writer = csv.writer(f, delimiter=";")

  #Info about the CSV form is found here https://support.procountor.fi/hc/fi/articles/360000256417-Laskuaineiston-siirtotiedosto

  pdf_name = ""
  pdf_data = b""
  if pdf:
    pdf_name, pdf_data = pdf

  #Expenses
  if hasExpenses(rows):
    #Indeksi 34 on liitetiedoston nimi
    writer.writerow(["K", "EUR", "", IBAN, "", "Tilisiirto", name, "", 0, "t", "t", 0, Pvm.strftime("%d.%m.%Y"), "", Pvm.strftime("%d.%m.%Y"), "", "", "", "", "", "", "", "", "", "", 6, "", "", "t", "", "", "", "", pdf_name])
    for row in filter(isExpense, rows):
      #TYHJÄ, tuotteen kuvaus, tuotteen koodi, määrä (1 tai kilometrien määrä), yksikkö	(kpl tai km), yksikköhinta euroissa,	rivin alennusprosentti, rivin ALV, rivikommentti, TYHJÄ, TYHJÄ, TYHJÄ, TYHJÄ, kirjanpitotili
      writer.writerow(["", row["selite"], "", row["maara"], "kpl", row["yksikkohinta"], 0, 0])
  
  #Mileages
  if hasMileages(rows):
    #Indeksi 34 on liitetiedoston nimi
    writer.writerow(["M", "EUR", "", IBAN, HETU, "Tilisiirto", name, "", 0, "t", "t", 0, Pvm.strftime("%d.%m.%Y"), "", Pvm.strftime("%d.%m.%Y"), "", "", "", "", "", "", "", "", "", "", 6, "", "", "t", "", "", "", "", pdf_name])
    for row in filter(isMileage, rows):
      #TYHJÄ, tuotteen kuvaus, tuotteen koodi, määrä (1 tai kilometrien määrä), yksikkö	(kpl tai km), yksikköhinta euroissa,	rivin alennusprosentti, rivin ALV, rivikommentti, TYHJÄ, TYHJÄ, TYHJÄ, TYHJÄ, kirjanpitotili
      writer.writerow(["", row["selite"], os.environ("MILEAGE_PROCOUNTOR_PRODUCT_ID"), row["maara"], "km", row["yksikkohinta"], 0, 0])
  
  sanitized_name = pathvalidate.sanitize_filename(name)
  date = Pvm.strftime("%d-%m-%Y")
  document_name = f"{sanitized_name}-{date}-{entry_id}.csv"

  if not pdf:
    return document_name, f.getvalue().encode("cp1252")
  
  archive = BytesIO()
  
  #Paid invoices are zipped
  with ZipFile(archive, "w") as zip:
    zip.writestr(document_name, f.getvalue().encode("cp1252"))
    #Add PDF
    zip.writestr(pdf_name, pdf_data)

  return f"{sanitized_name}-{date}-{entry_id}.zip", archive.getvalue()
