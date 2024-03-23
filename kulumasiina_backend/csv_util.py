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

class CsvInfo(TypedDict):
    entry_id: int
    name: str
    IBAN: str
    HETU: str | None
    Pvm: datetime.datetime
    rows: list[Row]
    pdf: tuple[str, bytes] | None

def isExpense(row: Row) -> bool:
    return not row["matkalasku"]

def isMileage(row: Row) -> bool:
    return row["matkalasku"]

def hasExpenses(rows: list[Row]) -> bool:
    return any(filter(isExpense, rows))

def hasMileages(rows: list[Row]) -> bool:
    return any(filter(isMileage, rows))

def substring80AndRemoveNewlines(string: str) -> str:
  return string[:80].replace("\n", " ")

def generate_csv(csv_infos: list[CsvInfo]) -> tuple[str, bytes]:

  f = StringIO()

  writer = csv.writer(f, delimiter=";")

  #Info about the CSV form is found here https://support.procountor.fi/hc/fi/articles/360000256417-Laskuaineiston-siirtotiedosto

  for csv_info in csv_infos:
    entry_id = csv_info["entry_id"]
    name = csv_info["name"]
    IBAN = csv_info["IBAN"]
    HETU = csv_info["HETU"]
    Pvm = csv_info["Pvm"]
    rows = csv_info["rows"]
    pdf = csv_info["pdf"]

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
        writer.writerow(["", substring80AndRemoveNewlines(row["selite"]), "", row["maara"], "kpl", row["yksikkohinta"], 0, 0])
    
    #Mileages
    if hasMileages(rows):
      #Indeksi 34 on liitetiedoston nimi
      writer.writerow(["T", "EUR", "", IBAN, HETU, "Tilisiirto", name, "", 0, "t", "t", 0, Pvm.strftime("%d.%m.%Y"), "", Pvm.strftime("%d.%m.%Y"), "", "", "", "", "", "", "", "", "", "", 6, "", "", "t", "", "", "", "", pdf_name])
      for row in filter(isMileage, rows):
        #TYHJÄ, tuotteen kuvaus, tuotteen koodi, määrä (1 tai kilometrien määrä), yksikkö	(kpl tai km), yksikköhinta euroissa,	rivin alennusprosentti, rivin ALV, rivikommentti, TYHJÄ, TYHJÄ, TYHJÄ, TYHJÄ, kirjanpitotili
        writer.writerow(["", substring80AndRemoveNewlines(row["selite"]), os.environ["MILEAGE_PROCOUNTOR_PRODUCT_ID"], row["maara"], "km", row["yksikkohinta"], 0, 0])
  
  sanitized_name = pathvalidate.sanitize_filename(name)
  date = Pvm.strftime("%d-%m-%Y")
  document_name = f"{sanitized_name}-{date}-{entry_id}"

  if not pdf:
    return f"{document_name}.csv", f.getvalue().encode("cp1252")
  
  archive = BytesIO()

  entry_ids = "-".join(map(lambda csv_info: str(csv_info["entry_id"]), csv_infos))

  archive_name = f"{date}-entries-{entry_ids}"

  if len(csv_infos) == 1:
    archive_name = document_name
  
  #Paid invoices are zipped
  with ZipFile(archive, "w") as zip:
    zip.writestr(f"{archive_name}.csv", f.getvalue().encode("cp1252"))

    #Add PDFs
    for pdf_name, pdf_data in map(lambda csv_info: csv_info["pdf"], csv_infos):
      zip.writestr(pdf_name, pdf_data)

  return f"{archive_name}.zip", archive.getvalue()
