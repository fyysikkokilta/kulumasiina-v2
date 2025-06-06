from datetime import timedelta, datetime, date
import io
import os

from fastapi import (
    BackgroundTasks,
    Cookie,
    Depends,
    FastAPI,
    HTTPException,
    File,
    Request,
    Response,
    UploadFile,
    APIRouter,
)
from fastapi.middleware.cors import CORSMiddleware

from typing import Optional, TypedDict
from pydantic import BaseModel
from sqlalchemy.orm import Session

from kulumasiina_backend import (
    crud,
    models,
    schemas,
    pdf_util,
    csv_util,
    bookkeeping_accounts,
)
from kulumasiina_backend.db import SessionLocal, engine
from fastapi.security import HTTPBearer
from fastapi_sso.sso.google import GoogleSSO

from jose import jwt
import httpx

models.Base.metadata.create_all(bind=engine)


app = FastAPI()
if "OAUTH_CLIENT_ID" not in os.environ:
    raise Exception("OAUTH_CLIENT_ID not set. Please set it in .env")
if "OAUTH_CLIENT_SECRET" not in os.environ:
    raise Exception("OAUTH_CLIENT_SECRET not set. Please set it in .env")
if "OAUTH_REDIR_URL" not in os.environ:
    raise Exception("OAUTH_REDIR_URL not set. Please set it in .env")
if "JWT_SECRET" not in os.environ:
    raise Exception("JWT_SECRET not set. Please set it in .env")
if "ADMIN_EMAILS" not in os.environ:
    raise Exception("ADMIN_EMAILS not set. Please set it in .env")
if "OAUTH_ALLOW_INSECURE_HTTP" not in os.environ:
    raise Exception("OAUTH_ALLOW_INSECURE_HTTP not set. Please set it in .env")
if "JWT_EXPIRY_MINUTES" not in os.environ:
    raise Exception("JWT_EXPIRY_MINUTES not set. Please set it in .env")
if "CORS_ALLOWED_ORIGINS" not in os.environ:
    raise Exception("CORS_ALLOWED_ORIGINS not set. Please set it in .env")
if "MILEAGE_REIMBURSEMENT_RATE" not in os.environ:
    raise Exception("MILEAGE_REIMBURSEMENT_RATE not set. Please set it in .env")
if "MILEAGE_PROCOUNTOR_PRODUCT_ID" not in os.environ:
    raise Exception("MILEAGE_PROCOUNTOR_PRODUCT_ID not set. Please set it in .env")
if "DELETE_ARCHIVED_AGE_LIMIT" not in os.environ:
    raise Exception("DELETE_ARCHIVED_AGE_LIMIT not set. Please set it in .env")

HOSTER_OVER_HTTP = os.environ["OAUTH_REDIR_URL"].startswith("http://")
if HOSTER_OVER_HTTP and not bool(int(os.environ["OAUTH_ALLOW_INSECURE_HTTP"])):
    raise Exception(
        "OAUTH_REDIR_URL is over http, but OAUTH_ALLOW_INSECURE_HTTP is not set to 1. Please set it in .env"
    )
if not HOSTER_OVER_HTTP and bool(int(os.environ["OAUTH_ALLOW_INSECURE_HTTP"])):
    raise Exception(
        "OAUTH_REDIR_URL is over https, but OAUTH_ALLOW_INSECURE_HTTP is set to 1. Please fix .env"
    )

ADMINS = set(os.environ["ADMIN_EMAILS"].split(","))

sso = GoogleSSO(
    client_id=os.environ["OAUTH_CLIENT_ID"],
    client_secret=os.environ["OAUTH_CLIENT_SECRET"],
    scope=["email"],
    redirect_uri=os.environ["OAUTH_REDIR_URL"],
    allow_insecure_http=bool(int(os.environ["OAUTH_ALLOW_INSECURE_HTTP"])),
)

origins = [origin for origin in os.environ["CORS_ALLOWED_ORIGINS"].split(" ")]
# TODO: make more secure
app.add_middleware(
    CORSMiddleware, allow_origins=origins, allow_methods=["*"], allow_credentials=True
)

api_router = APIRouter(prefix="/api")


def sanitise_filename(filename: str) -> str:
    keep = [" ", ".", "_", "-"]
    return "".join([c for c in filename if c.isalpha() or c.isdigit() or c in keep])


# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


bearer_scheme = HTTPBearer()


class JWTData(TypedDict):
    sub: str  # Email


def get_user(token: Optional[str] = Cookie(default=None)) -> JWTData:
    if token is None:
        raise HTTPException(401, "Invalid auth")
    try:
        return JWTData(
            **jwt.decode(
                token,
                key=os.environ["JWT_SECRET"],
            )
        )
    except Exception as e:
        print(e)
        raise HTTPException(401, "Invalid auth")


def create_access_token(username: str, expires_delta: timedelta):
    data = {"sub": username, "exp": datetime.utcnow() + expires_delta}
    return jwt.encode(data, os.environ["JWT_SECRET"])


@api_router.post("/entry")
async def create_entry(
    entry: schemas.EntryCreate, db: Session = Depends(get_db)
) -> list[schemas.Entry]:

    print("Creating entry")

    # TODO: Data validation that attachments are not reused if those already assigned to some other entry.
    created_entries = []

    # Create separate entries for mileages and items if both are present
    if entry.mileages:
        entry_without_items = schemas.EntryCreate(
            name=entry.name,
            contact=entry.contact,
            iban=entry.iban,
            gov_id=entry.gov_id,
            title=entry.title,
            items=[],
            mileages=entry.mileages,
        )

        created_mileages = crud.create_entry_full(entry=entry_without_items, db=db)
        created_entries.append(created_mileages)

    if entry.items:
        entry_without_mileages = schemas.EntryCreate(
            name=entry.name,
            contact=entry.contact,
            iban=entry.iban,
            gov_id=None,
            title=entry.title,
            items=entry.items,
            mileages=[],
        )

        created_items = crud.create_entry_full(entry=entry_without_mileages, db=db)
        created_entries.append(created_items)

    return created_entries


# @api_router.get('/mileage/{mileage_id}')
# def get_mileage_by_id(mileage_id: int, db: Session = Depends(get_db)) -> schemas.Mileage:
#     db_mileage = crud.get_mileage_by_id(id=mileage_id, db=db)
#     if not db_mileage:
#         raise HTTPException(status_code=404)
#     return schemas.Mileage.from_orm(db_mileage)


@api_router.post("/attachment")
def create_attachment(file: UploadFile = File(), db: Session = Depends(get_db)) -> int:
    filename = file.filename
    if filename:
        filename = sanitise_filename(filename)
    attachment = schemas.AttachmentCreate(
        filename=filename,
        data=file.file.read(),
    )
    try:
        attachment_id = crud.create_attachment(attachment=attachment, db=db).id
    except crud.UnknownFileFormatError:
        raise HTTPException(status_code=415, detail="Unsupported file format")

    return attachment_id


@api_router.delete("/attachment/{attachment_id}")
def del_attachment(attachment_id, db: Session = Depends(get_db)):
    return crud.delete_attachment(attachment_id, db)


@api_router.get("/entries")
def get_entry(db: Session = Depends(get_db), user=Depends(get_user)):
    return crud.get_entries(db)


@api_router.get("/items/{item_id}/attachments")
def get_attachment_for_item(
    item_id, db: Session = Depends(get_db), user=Depends(get_user)
):
    data = crud.get_item_attachments(item_id, db)
    return data


@api_router.get("/attachment/{attachment_id}")
async def get_attachment(
    attachment_id,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user=Depends(get_user),
):
    buffer = io.BytesIO()  # BytesIO stream containing the pdf data
    background_tasks.add_task(buffer.close)
    buffer.write(crud.get_attachment_data(attachment_id, db))

    data = buffer.getvalue()

    # Check the file type
    file_type = None
    if data.startswith(b"%PDF"):
        file_type = "application/pdf"
    elif data.startswith(b"\x89PNG"):
        file_type = "image/png"
    elif data.startswith(b"\x47\x49\x46\x38"):
        file_type = "image/gif"
    elif data.startswith(b"\xff\xd8\xff"):
        file_type = "image/jpeg"
    else:
        file_type = "application/octet-stream"

    return Response(
        data,
        media_type=file_type,
        headers={"Content-Disposition": "attachment"},
    )


def generate_parts(entry: models.Entry):
    parts = []
    for item in entry.items:
        liitteet = []
        for liite in item.attachments:
            liitteet.append(
                pdf_util.Attachment(
                    data=liite.data,
                    value_cents=liite.value_cents,
                    is_not_receipt=liite.is_not_receipt,
                )
            )
        part = pdf_util.Part(
            paivamaara=item.date,
            hinta=sum(
                [
                    attachment.value_cents if attachment.value_cents else 0
                    for attachment in item.attachments
                ]
            )
            / 100,
            selite=item.description,
            liitteet=liitteet,
        )
        parts.append(part)
    for mileage in entry.mileages:
        part = pdf_util.Part(
            paivamaara=mileage.date,
            hinta=mileage.distance * float(os.environ["MILEAGE_REIMBURSEMENT_RATE"]),
            selite=f"Kilometrikorvaus: {mileage.description}\nReitti: {mileage.route}\nMatkan pituus: {mileage.distance} km\nRekisterinumero: {mileage.plate_no}",
            liitteet=[],
        )
        parts.append(part)
    return parts


@api_router.get("/entry/{entry_id}/pdf")
async def get_entry_pdf(
    entry_id,
    db: Session = Depends(get_db),
    user=Depends(get_user),
):
    entry = crud.get_entry_by_id(entry_id, db)
    if entry is None:
        raise HTTPException(404)

    parts = generate_parts(entry)

    if entry.status not in {"approved", "paid", "submitted", "denied"}:
        raise HTTPException(500, "Invalid status")

    document_name, pdf = pdf_util.generate_combined_pdf(
        status=entry.status,
        entry_id=entry_id,
        name=entry.name,
        IBAN=entry.iban,
        HETU=entry.gov_id,
        Pvm=entry.submission_date,
        reason=entry.title,
        parts=parts,
        accepted_date=entry.approval_date,
        accepted_note=entry.approval_note,
        paid=entry.paid_date,
        rejection_date=entry.rejection_date,
    )

    return Response(
        pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={document_name}"},
    )


@api_router.get("/entry/multi/csv")
async def get_multi_entry_csv(
    entry_ids: str,
    db: Session = Depends(get_db),
    user=Depends(get_user),
):
    ids = entry_ids.split(",")
    entries = crud.get_entries_by_ids(ids, db)
    if len(entries) != len(ids):
        raise HTTPException(404)
    if any([entry.status not in {"paid"} for entry in entries]):
        raise HTTPException(500, "Invalid status")

    pdf_infos = []

    for entry in entries:
        rows = []
        for item in entry.items:
            rows.append(
                csv_util.Row(
                    yksikkohinta=str(
                        sum(
                            attachment.value_cents if attachment.value_cents else 0
                            for attachment in item.attachments
                        )
                        / 100
                    ),
                    selite=item.description,
                    maara=1,
                    matkalasku=False,
                    kirjanpitotili=item.account,
                )
            )
        for mileage in entry.mileages:
            rows.append(
                csv_util.Row(
                    yksikkohinta=float(os.environ["MILEAGE_REIMBURSEMENT_RATE"]),
                    selite=f"Kilometrikorvaus: {mileage.description}",
                    maara=mileage.distance,
                    matkalasku=True,
                    kirjanpitotili=mileage.account,
                )
            )

        parts = generate_parts(entry)
        pdf = pdf_util.generate_combined_pdf(
            status=entry.status,
            entry_id=entry.id,
            name=entry.name,
            IBAN=entry.iban,
            HETU=entry.gov_id,
            Pvm=entry.submission_date,
            reason=entry.title,
            parts=parts,
            accepted_date=entry.approval_date,
            accepted_note=entry.approval_note,
            paid=entry.paid_date,
            rejection_date=entry.rejection_date,
        )

        pdf_infos.append(
            csv_util.CsvInfo(
                entry_id=entry.id,
                name=entry.name,
                IBAN=entry.iban,
                HETU=entry.gov_id,
                Pvm=entry.submission_date,
                rows=rows,
                pdf=pdf,
            )
        )

    document_name, csv = csv_util.generate_csv(pdf_infos)

    media_type = "text/csv"
    if document_name.endswith("zip"):
        media_type = "application/zip"

    return Response(
        csv,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{document_name}"'},
    )


@api_router.get("/entry/{entry_id}/csv")
async def get_entry_csv(
    entry_id,
    db: Session = Depends(get_db),
    user=Depends(get_user),
):
    entry = crud.get_entry_by_id(entry_id, db)
    if entry is None:
        raise HTTPException(404)

    if entry.status not in {"approved", "paid"}:
        raise HTTPException(500, "Invalid status")

    rows = []

    for item in entry.items:
        rows.append(
            csv_util.Row(
                yksikkohinta=str(
                    sum(
                        attachment.value_cents if attachment.value_cents else 0
                        for attachment in item.attachments
                    )
                    / 100
                ),
                selite=item.description,
                maara=1,
                matkalasku=False,
                kirjanpitotili=item.account,
            )
        )
    for mileage in entry.mileages:
        rows.append(
            csv_util.Row(
                yksikkohinta=float(os.environ["MILEAGE_REIMBURSEMENT_RATE"]),
                selite=f"Kilometrikorvaus: {mileage.description}",
                maara=mileage.distance,
                matkalasku=True,
                kirjanpitotili=mileage.account,
            )
        )

    pdf = None
    if entry.status == "paid":
        parts = generate_parts(entry)
        pdf = pdf_util.generate_combined_pdf(
            status=entry.status,
            entry_id=entry_id,
            name=entry.name,
            IBAN=entry.iban,
            HETU=entry.gov_id,
            Pvm=entry.submission_date,
            reason=entry.title,
            parts=parts,
            accepted_date=entry.approval_date,
            accepted_note=entry.approval_note,
            paid=entry.paid_date,
            rejection_date=entry.rejection_date,
        )

    document_name, csv = csv_util.generate_csv(
        [
            csv_util.CsvInfo(
                entry_id=entry_id,
                name=entry.name,
                IBAN=entry.iban,
                HETU=entry.gov_id,
                Pvm=entry.submission_date,
                rows=rows,
                pdf=pdf,
            )
        ]
    )

    media_type = "text/csv"
    if document_name.endswith("zip"):
        media_type = "application/zip"

    return Response(
        csv,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{document_name}"'},
    )


def assert_status_in(entry_id, statuses, db):
    entry = crud.get_entry_by_id(entry_id, db)
    if entry is None:
        raise HTTPException(404)
    if entry.status not in statuses:
        raise HTTPException(400, "Entry has wrong status for current operation")


def assert_archived(entry_id, db):
    entry = crud.get_entry_by_id(entry_id, db)
    if entry is None:
        raise HTTPException(404)
    if not entry.archived:
        raise HTTPException(400, "Entry not archived")


@api_router.delete("/entry/{entry_id}")
def del_entry(entry_id, db: Session = Depends(get_db), user=Depends(get_user)):
    assert_archived(entry_id, db)
    return crud.delete_entry(entry_id, db)


@api_router.delete("/entries")
def del_archived_old_entries(db: Session = Depends(get_db), user=Depends(get_user)):
    age_limit = int(os.environ["DELETE_ARCHIVED_AGE_LIMIT"])
    return crud.delete_archived_old_entries(age_limit, db)


class ChangeStatusBody(BaseModel):
    ids: list[int]


class ApproveBody(ChangeStatusBody):
    date: datetime
    approval_note: str


@api_router.post("/approve")
async def approve_entries(
    data: ApproveBody,
    db: Session = Depends(get_db),
    user=Depends(get_user),
):
    for entry_id in data.ids:
        assert_status_in(entry_id, ["submitted"], db)
    for entry_id in data.ids:
        crud.approve_entry(entry_id, data.date.date(), data.approval_note, db)
    return


@api_router.post("/deny")
def deny_entries(
    data: ChangeStatusBody,
    db: Session = Depends(get_db),
    user=Depends(get_user),
):
    for entry_id in data.ids:
        assert_status_in(entry_id, ["submitted"], db)
    for entry_id in data.ids:
        crud.deny_entry(entry_id, db)
    return


@api_router.post("/reset")
def reset_entries(
    data: ChangeStatusBody,
    db: Session = Depends(get_db),
    user=Depends(get_user),
):
    for entry_id in data.ids:
        assert_status_in(entry_id, ["approved", "denied", "paid"], db)
    for entry_id in data.ids:
        crud.reset_entry_status(entry_id, db)
    return


class PayBody(ChangeStatusBody):
    date: datetime


@api_router.post("/pay")
def pay_entries(
    data: PayBody,
    db: Session = Depends(get_db),
    user=Depends(get_user),
):
    for entry_id in data.ids:
        assert_status_in(entry_id, ["approved"], db)
    for entry_id in data.ids:
        crud.pay_entry(entry_id, data.date.date(), db)
    return


@api_router.post("/archive")
def archive_entries(
    data: ChangeStatusBody,
    db: Session = Depends(get_db),
    user=Depends(get_user),
):
    for entry_id in data.ids:
        assert_status_in(entry_id, ["denied", "paid"], db)
    for entry_id in data.ids:
        crud.archive_entry(entry_id, db)
    return


@api_router.post("/item/{item_id}")
def update_item(
    item_id: int,
    item: schemas.ItemUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_user),
):
    return crud.update_item(item_id, item, db)


@api_router.post("/mileage/{mileage_id}")
def update_mileage(
    mileage_id: int,
    mileage: schemas.MileageUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_user),
):
    return crud.update_mileage(mileage_id, mileage, db)


class BookkeepingAccountBody(BaseModel):
    account: str
    is_mileage: bool


@api_router.post("/bookkeeping/{item_or_mileage_id}")
def update_bookkeeping(
    item_or_mileage_id: int,
    data: BookkeepingAccountBody,
    db: Session = Depends(get_db),
    user=Depends(get_user),
):
    isMileage = data.is_mileage
    account = data.account
    if isMileage:
        return crud.update_mileage_bookkeeping(item_or_mileage_id, account, db)
    else:
        return crud.update_item_bookkeeping(item_or_mileage_id, account, db)


@api_router.get("/userdata")
def user_data(user=Depends(get_user)):
    return {"email": user["sub"]}


@api_router.get("/login/google")
async def google_redirect(request: Request):
    with sso:
        return await sso.get_login_redirect()


@api_router.get("/login/google/callback")
async def google_callback(request: Request, response: Response):
    with sso:
        try:
            user = await sso.verify_and_process(request)
        except httpx.ConnectTimeout:
            raise HTTPException(500, "Could not connect to Google")
        except Exception as e:
            print(e, flush=True)
            raise HTTPException(500, "Unknown auth error")
    if user is None:
        print("User is none")
        raise HTTPException(401, "Invalid auth")
    if user.email not in ADMINS:
        print("User is not admin")
        print(user)
        raise HTTPException(401, "Invalid auth")
    response.set_cookie(
        "token",
        create_access_token(
            user.email, timedelta(minutes=int(os.environ["JWT_EXPIRY_MINUTES"]))
        ),
        httponly=True,
        samesite="strict",  # The auth cookies are not used outside the domain
        path="/",
        secure=False if HOSTER_OVER_HTTP else True,
    )
    return {"success": True, "username": user.email}


@api_router.get("/logout")
async def logout(response: Response):
    response.delete_cookie("token")
    return {"success": True}


@api_router.get("/config")
async def get_config():
    return {"mileageReimbursementRate": os.environ["MILEAGE_REIMBURSEMENT_RATE"]}


@api_router.get("/config/admin")
async def get_admin_config(user=Depends(get_user)):
    return {
        "mileageReimbursementRate": os.environ["MILEAGE_REIMBURSEMENT_RATE"],
        "deleteArchivedAgeLimit": os.environ["DELETE_ARCHIVED_AGE_LIMIT"],
        "bookkeepingAccounts": bookkeeping_accounts.bookkeeping_accounts,
    }


app.include_router(api_router)
