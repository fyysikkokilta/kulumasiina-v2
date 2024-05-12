import csv
import datetime
import os
from io import BytesIO, StringIO
from typing import Literal, TypedDict
import zipfile
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

def removeAllWhitespace(string: str) -> str:
  return "".join(string.split())

def merge_csv_infos(csv_infos: list[CsvInfo]) -> list[CsvInfo]:
  merged_csv_infos: list[CsvInfo] = []

  for csv_info in csv_infos:
    found = False
    for merged_csv_info in merged_csv_infos:
      same_iban = removeAllWhitespace(merged_csv_info["IBAN"]) == removeAllWhitespace(csv_info["IBAN"])
      same_hetu = removeAllWhitespace(merged_csv_info["HETU"] or "") == removeAllWhitespace(csv_info["HETU"] or "")
      if same_iban and same_hetu:
        merged_csv_info["rows"] += csv_info["rows"]
        #Remove pdf from merged_csv_info, zip can have only one pdf per entry :(
        merged_csv_info["pdf"] = None
        merged_csv_info["Pvm"] = min(merged_csv_info["Pvm"], csv_info["Pvm"])
        merged_csv_info["entry_id"] = f"{merged_csv_info['entry_id']}-{csv_info['entry_id']}"
        found = True
        break
    if not found:
      merged_csv_infos.append(csv_info.copy())
  
  return merged_csv_infos

def generate_csv(csv_infos: list[CsvInfo]) -> tuple[str, bytes]:

  f = StringIO()

  writer = csv.writer(f, delimiter=";")

  #Info about the CSV form is found here https://support.procountor.fi/hc/fi/articles/360000256417-Laskuaineiston-siirtotiedosto

  #Merge CSV infos with the same IBAN and HETU
  merged_csv_infos = merge_csv_infos(csv_infos)

  for csv_info in merged_csv_infos:
    entry_id = csv_info["entry_id"]
    name = removeAllWhitespace(csv_info["name"])
    IBAN = removeAllWhitespace(csv_info["IBAN"])
    HETU = removeAllWhitespace(csv_info["HETU"] or "")
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
      notes = ""
      if not pdf:
        notes = f"Muista lisätä PDFt liitetiedostoina: {entry_id}"
      writer.writerow(["K", "EUR", "", IBAN, "", "Tilisiirto", name, "", 0, "t", "t", 0, Pvm.strftime("%d.%m.%Y"), "", Pvm.strftime("%d.%m.%Y"), "", "", "", "", notes, "", "", "", "", "", 6, "", "", "t", "", "", "", "", pdf_name])
      for row in filter(isExpense, rows):
        #TYHJÄ, tuotteen kuvaus, tuotteen koodi, määrä (1 tai kilometrien määrä), yksikkö	(kpl tai km), yksikköhinta euroissa,	rivin alennusprosentti, rivin ALV, rivikommentti, TYHJÄ, TYHJÄ, TYHJÄ, TYHJÄ, kirjanpitotili
        writer.writerow(["", substring80AndRemoveNewlines(row["selite"]), "", row["maara"], "kpl", row["yksikkohinta"], 0, 0])
    
    #Mileages
    if hasMileages(rows):
      #Indeksi 34 on liitetiedoston nimi
      notes = ""
      if not pdf:
        notes = f"Muista lisätä PDFt liitetiedostoina: {entry_id}"
      writer.writerow(["T", "EUR", "", IBAN, HETU, "Tilisiirto", name, "", 0, "t", "t", 0, Pvm.strftime("%d.%m.%Y"), "", Pvm.strftime("%d.%m.%Y"), "", "", "", "", notes, "", "", "", "", "", 6, "", "", "t", "", "", "", "", pdf_name])
      for row in filter(isMileage, rows):
        #TYHJÄ, tuotteen kuvaus, tuotteen koodi, määrä (1 tai kilometrien määrä), yksikkö	(kpl tai km), yksikköhinta euroissa,	rivin alennusprosentti, rivin ALV, rivikommentti, TYHJÄ, TYHJÄ, TYHJÄ, TYHJÄ, kirjanpitotili
        writer.writerow(["", substring80AndRemoveNewlines(row["selite"]), os.environ["MILEAGE_PROCOUNTOR_PRODUCT_ID"], row["maara"], "km", row["yksikkohinta"], 0, 0])
  
  sanitized_name = pathvalidate.sanitize_filename(name)
  date = Pvm.strftime("%d-%m-%Y")
  document_name = f"{sanitized_name}-{date}-{entry_id}"

  csv_info_length = len(csv_infos)
  has_pdf = any(map(lambda csv_info: csv_info["pdf"], merged_csv_infos))

  #If there is only one csv info and it doesn't have a pdf, we can return the csv as is
  if not has_pdf and csv_info_length == 1:
    return f"{document_name}.csv", f.getvalue().encode("cp1252")

  entry_ids = "-".join(map(lambda csv_info: str(csv_info["entry_id"]), csv_infos))
  multi_name = f"{date}-entries-{entry_ids}"

  # If merged csv infos don't have pdfs, we can return the csv as is
  if not has_pdf:
    return f"{multi_name}.csv", f.getvalue().encode("cp1252")
  
  archive_name = multi_name
  #If there is only one csv info, we can use the document name
  if len(csv_infos) == 1:
    archive_name = document_name

  archive = BytesIO()
  
  #Paid invoices are zipped
  with ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as zip:
    zip.writestr(f"{multi_name}.csv", f.getvalue().encode("cp1252"))

    #Add PDFs
    pdfs = filter(lambda csv_info: csv_info["pdf"], merged_csv_infos)
    for pdf_name, pdf_data in map(lambda csv_info: csv_info["pdf"], pdfs):
      zip.writestr(pdf_name, pdf_data)

  return f"{archive_name}.zip", archive.getvalue()
