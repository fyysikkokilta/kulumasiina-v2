import csv
import datetime
from io import StringIO
from typing import Literal, TypedDict

import pathvalidate

from kulumasiina_backend.pdf_util import Part

class Row(TypedDict):
    yksikkohinta: int
    selite: str
    maara: int
    liitteet: list[bytes]

def generate_csv(
    entry_id: int,
    name: str,
    IBAN: str,
    Pvm: datetime.datetime,
    rows: list[Row],
) -> tuple[str, bytes]:

  f = StringIO()

  writer = csv.writer(f)

  #Info about the CSV form is found here https://support.procountor.fi/hc/fi/articles/360000256417-Laskuaineiston-siirtotiedosto
  writer.writerow(["K", "EUR", "", IBAN, "", "Tilisiirto", name, "", 0, "t", "t", 0, Pvm.strftime("%d.%m.%Y"), "", Pvm.strftime("%d.%m.%Y"), "", "", "", "", "Muistiinpanot", "Sähköposti", "", "", "", "", 6, "", "", "t", "", "", "", "", "liite.pdf"])
  for row in rows:
    writer.writerow(["", row["selite"], row["maara"], "kpl", row["yksikkohinta"], 0, 0, "Rivikommentti", "", "", "", "", "Kirjanpitotili"])
  
  sanitized_name = pathvalidate.sanitize_filename(name)
  date = Pvm.strftime("%d-%m-%Y")
  document_name = f"{sanitized_name}-{date}-{entry_id}.csv"
  
  return document_name, f.getvalue().encode("utf-8")