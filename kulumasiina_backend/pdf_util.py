import datetime
from io import BytesIO
import sys
import os
import fpdf  # pip3 intall fpdf
from pathlib import Path
import pypdf
import pathvalidate

from typing import Literal, TypedDict

from PIL import Image, ImageOps


class Part(TypedDict):
    paivamaara: datetime.date
    selite: str
    hinta: float
    liitteet: list[bytes]


def is_file_acceptable(file: bytes) -> Literal["PDF", "PNG", "GIF", "JPG"] | None:
    # Check format from magic bytes
    # https://en.wikipedia.org/wiki/List_of_file_signatures
    if file.startswith(b"%PDF"):
        return "PDF"
    elif file.startswith(b"\x89PNG"):
        return "PNG"
    elif file.startswith(b"\x47\x49\x46\x38"):
        return "GIF"
    elif file.startswith(b"\xff\xd8\xff"):
        return "JPG"
    else:
        return None


def watermark(
    text: str,
    content: BytesIO,
) -> BytesIO:
    waterstamp_pdf = fpdf.FPDF(format="A4")
    waterstamp_pdf.add_font(
        "Lora", fname="./kulumasiina_backend/assets/Lora-Regular.ttf"
    )
    waterstamp_pdf.add_page()
    waterstamp_pdf.set_font("Lora", size=20)
    waterstamp_pdf.cell(text=text)
    waterpdf = BytesIO(waterstamp_pdf.output())

    stamp_page = pypdf.PdfReader(waterpdf).pages[0]

    writer = pypdf.PdfWriter()
    writer.append(content)

    for content_page in writer.pages:
        content_page.merge_transformed_page(
            stamp_page,
            pypdf.Transformation().scale(1),
        )
    io = BytesIO()
    status, _io = writer.write(io)
    return io


def generate_combined_pdf(
    entry_id: int,
    status: Literal["approved", "paid", "submitted", "denied"],
    name: str,
    IBAN: str,
    HETU: str | None,
    Pvm: datetime.datetime,
    reason: str,
    parts: list[Part],
    accepted_note: str | None,
    accepted_date: datetime.date | None,
    paid: datetime.date | None,
    rejection_date: datetime.date | None,
) -> tuple[str, bytes]:
    pdf = fpdf.FPDF(format="A4")  # pdf format
    pdf.add_font(
        "Lora", fname="./kulumasiina_backend/assets/Lora-Regular.ttf", uni=True
    )
    pdf.add_font(
        "Sourcesanspro",
        fname="./kulumasiina_backend/assets/SourceSansPro-Regular.ttf",
        uni=True,
    )
    pdf.add_font(
        "Sourcesanspro",
        fname="./kulumasiina_backend/assets/SourceSansPro-Bold.ttf",
        style="B",
        uni=True,
    )
    pdf.add_page()  # create new page

    piipath = "./kulumasiina_backend/assets/fii_2.svg"

    # convert the "liitteet" to numbers and add them to list
    attachements = [liite for part in parts for liite in part["liitteet"]]
    i = 1
    for part in parts:
        liitteet = []
        for liite in part["liitteet"]:
            liitteet.append(str(i))
            i += 1
        part["liitteet"] = liitteet

    # The units are in millimetres :DD
    width = 170
    height = width
    a4_width_mm = 210
    a4_height_mm = 297
    x_loc = (a4_width_mm - width) / 2
    y_loc = (a4_height_mm - height) / 2

    pdf.set_font("Lora", size=20)  # font and textsize
    if HETU is not None: # HETU is included only in travel expenses
        pdf.cell(text="FYYSIKKOKILTA RY - Matkakorvauslomake")
    else:
        pdf.cell(text="FYYSIKKOKILTA RY - Kulukorvauslomake")
    pdf.ln(20)
    pdf.set_font("Sourcesanspro", size=14)

    is_mileage = HETU is not None

    pdf.cell(text="Nimi: " + name)
    pdf.ln(6)
    pdf.cell(text="IBAN: " + IBAN)
    pdf.ln(6)
    if is_mileage:
        pdf.cell(text="Henkilötunnus: " + HETU)
        pdf.ln(6)
    date = Pvm.strftime("%d.%m.%Y")
    pdf.cell(text=f"Päivämäärä: {date}")
    pdf.ln(16)

    nowstr = datetime.datetime.utcnow().strftime("%d.%m.%Y")
    if status == "approved":
        assert accepted_date is not None and accepted_note is not None
        assert paid is None
        accepted_datestr = accepted_date.strftime("%d.%m.%Y")
        pdf.cell(text=f"Hyväksytty {accepted_datestr}, peruste: {accepted_note}")
        pdf.ln(6)
        nowstr = datetime.datetime.utcnow().strftime("%d.%m.%Y")
        pdf.cell(text=f"Ei maksettu (as of {nowstr})")
        pdf.ln(6)
    elif status == "paid":
        assert accepted_date is not None and accepted_note is not None
        assert paid is not None
        accepted_datestr = accepted_date.strftime("%d.%m.%Y")
        paid_datestr = paid.strftime("%d.%m.%Y")
        pdf.cell(text=f"Hyväksytty {accepted_datestr}, peruste: {accepted_note}")
        pdf.ln(6)
        pdf.cell(text=f"Maksettu {paid_datestr}")
        pdf.ln(6)
    elif status == "submitted":
        assert accepted_date is None and accepted_note is None
        assert paid is None
        pdf.cell(text=f"Odottaa hyväksyntää (as of {nowstr})")
        pdf.ln(6)
    elif status == "denied":
        assert accepted_date is None and accepted_note is None
        assert paid is None
        assert rejection_date is not None
        pdf.cell(text=f"Hylätty ({rejection_date.strftime('%d.%m.%Y')})")
        pdf.ln(6)

    pdf.ln(16)
    pdf.multi_cell(w=0, h=6, align="L", text="Korvauksen peruste: " + reason)
    pdf.ln(20)

    # Generate table data from the data dict
    table_data: list[tuple[str, str, str, str]] = [("Pvm","Selite", "Liitteet", "Hinta")]
    if is_mileage:
        table_data = [("Pvm", "Selite", "Kilometrikorvaus", "Hinta")]
    for part in parts:
        if is_mileage:
            table_data.append(
                (
                    part["paivamaara"].strftime("%d.%m.%Y"),
                    part["selite"],
                    f"{os.environ['MILEAGE_REIMBURSEMENT_RATE']} €/km",
                    f"{part['hinta']} €",
                )
            )
        else:
            table_data.append(
                (
                    part["paivamaara"].strftime("%d.%m.%Y"),
                    part["selite"],
                    ", ".join(part["liitteet"]),
                    f"{part['hinta']} €",
                )
            )

    # Total row
    total = sum(part["hinta"] for part in parts)
    table_data.append(("Yhteensä", "", "", f"{total} €"))

    pdf.set_font("Sourcesanspro", size=12)
    pdf.set_draw_color(50)  # very dark grey
    pdf.set_line_width(0.5)
    table_margin = 15
    alternate_bg_color = 220
    with pdf.table(
        borders_layout="SINGLE_TOP_LINE",
        cell_fill_mode="ROWS",
        cell_fill_color=(alternate_bg_color, alternate_bg_color, alternate_bg_color),
        first_row_as_headings=True,
        width=a4_width_mm - 2 * table_margin,
        text_align=("LEFT", "LEFT", "LEFT", "RIGHT"),
        col_widths=(3, 9, 4, 3),
    ) as table:
        for data_row in table_data:
            row = table.row()
            for datum in data_row:
                row.cell(datum)

    with pdf.local_context(fill_opacity=0.3):
        pdf.image(piipath, x=x_loc, y=y_loc, w=width)

    # Now we're just adding the attachements to the end.
    writer = pypdf.PdfWriter()
    # pypdf_pdf = pypdf.PdfReader(BytesIO(pdf.output()))
    writer.append(BytesIO(pdf.output()))

    # writer.appendpages(pypdf_pdf.pages)

    width = pypdf.PaperSize.A4.width
    height = pypdf.PaperSize.A4.height

    TOO_BIG_ATTACHMENT = 512 * 1024  # 512 KB
    MIN_WIDTH = 720

    for i, attachment in enumerate(attachements):
        # Check format from magic bytes
        # https://en.wikipedia.org/wiki/List_of_file_signatures
        fileformat = is_file_acceptable(attachment)
        if fileformat is None:
            raise ValueError("File format not supported")

        # Create PDF if needed

        if fileformat in {"JPG", "PNG", "GIF"}:
            new_pdf = fpdf.FPDF(format="A4")
            new_pdf.add_page()
            if sys.getsizeof(attachment) > TOO_BIG_ATTACHMENT:
                image = Image.open(BytesIO(attachment))
                ImageOps.exif_transpose(image, in_place=True)
                with BytesIO() as img_io:
                    im_width, im_height = image.size
                    ratio = im_width / im_height
                    resized_width = round(width*ratio)
                    resized_height = height
                    if resized_width < MIN_WIDTH:
                        resized_width = MIN_WIDTH
                        resized_height = round(MIN_WIDTH/ratio)
                    resized_image = image.resize((resized_width, resized_height), Image.Resampling.LANCZOS)
                    resized_image.save(img_io, format=image.format, quality=100)
                    attachment = img_io.getvalue()
            new_pdf.image(
                attachment,
                x=0,
                y=0,
                w=210,
                h=297,
                alt_text=f"Liite {i+1}",
                keep_aspect_ratio=True,
            )
            attachment = new_pdf.output()
        elif fileformat == "PDF":
            if sys.getsizeof(attachment) > TOO_BIG_ATTACHMENT:
                old_attachment = pypdf.PdfReader(BytesIO(attachment))
                new_attachment = pypdf.PdfWriter()
                for page in old_attachment.pages:
                    new_attachment.add_page(page)
                for page in new_attachment.pages:
                    for img in page.images:
                        im_width, im_height = img.image.size
                        ratio = im_width / im_height
                        resized_width = round(width*ratio)
                        resized_height = height
                        if resized_width < MIN_WIDTH:
                            resized_width = MIN_WIDTH
                            resized_height = round(MIN_WIDTH/ratio)
                        new_img = img.image.resize((resized_width, resized_height), Image.Resampling.LANCZOS)
                        img.replace(new_img)
                    page.scale_to(width=width, height=height)
                io = BytesIO()
                new_attachment.write(io)
                attachment = io.getvalue()
            else:
                pass
        else:
            raise ValueError("File format not supported")

        old_pdf = attachment
        attachment = watermark(f"Liite {i+1}", BytesIO(attachment)).getvalue()

        writer.append(BytesIO(attachment))
        # pypdf_pdf.pages.extend(pypdf.PdfReader(attachement).pages)

    sanitized_name = pathvalidate.sanitize_filename(name)
    date = Pvm.strftime("%d-%m-%Y")
    document_name = f"{sanitized_name}-{date}-{entry_id}.pdf"
    now_pdf = datetime.datetime.utcnow().strftime("D\072%Y%m%d%H%M%S")
    # Set the document title
    writer.add_metadata(
        {
            "/Author": "Martin",
            "/Producer": "Fyysikkokilta ry - Kulumasiina",
            "/Title": document_name,
            "/Subject": reason,
            # "/Keywords": "",
            "/CreationDate": now_pdf,
            "/ModDate": now_pdf,
            "/Creator": "Fyysikkokilta ry - Kulumasiina",
            # "/CustomField": "CustomField",
        }
    )

    io = BytesIO()
    status, _io = writer.write(io)
    return document_name, io.getvalue()
