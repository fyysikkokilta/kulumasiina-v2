from datetime import timedelta, datetime
import io
import os

from fastapi import BackgroundTasks, Cookie, Depends, FastAPI, HTTPException, File, Request, Response, UploadFile, APIRouter
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware

from typing import Annotated, Optional, Union
from sqlalchemy.orm import Session

from kulumasiina_backend import crud, models, schemas
from kulumasiina_backend.db import SessionLocal, engine
from fastapi.security import HTTPBearer
from fastapi_sso.sso.google import GoogleSSO, OpenID
from dotenv import load_dotenv

from jose import JWTError, jwt
load_dotenv()

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
if "RAHASTONHOITAJA_EMAIL" not in os.environ:
    raise Exception("RAHASTONHOITAJA_EMAIL not set. Please set it in .env")
if "OAUTH_ALLOW_INSECURE_HTTP" not in os.environ:
    raise Exception("OAUTH_ALLOW_INSECURE_HTTP not set. Please set it in .env")

sso = GoogleSSO(client_id=os.environ["OAUTH_CLIENT_ID"], client_secret=os.environ["OAUTH_CLIENT_SECRET"],
                scope=["email"],
                redirect_uri=os.environ["OAUTH_REDIR_URL"],allow_insecure_http=bool(os.environ["OAUTH_ALLOW_INSECURE_HTTP"]))

# TODO: make more secure
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_methods=["*"], allow_credentials=True)

api_router = APIRouter(prefix='/api')

def sanitise_filename(filename: str) -> str:
    keep = [' ', '.', '_', '-']
    return ''.join(
        [c for c in filename if c.isalpha() or c.isdigit() or c in keep]
    )

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



bearer_scheme = HTTPBearer()


def get_user(token: Optional[str] = Cookie(default=None)):
    try:
        return jwt.decode(token, key=os.environ["JWT_SECRET"], subject=os.environ["RAHASTONHOITAJA_EMAIL"])
    except Exception as e:
        print(e)
        raise HTTPException(401, "Invalid auth")

def create_access_token(username: bool, expires_delta: timedelta):
    data = {"sub": username, "exp": datetime.utcnow() + expires_delta}
    return jwt.encode(data, os.environ["JWT_SECRET"])


@api_router.post('/entry/')
def create_entry(
    entry: schemas.EntryCreate,
    db: Session = Depends(get_db)
) -> schemas.Entry:
    print("Creating entry")
    return crud.create_entry_full(entry=entry, db=db)


# @api_router.get('/mileage/{mileage_id}')
# def get_mileage_by_id(mileage_id: int, db: Session = Depends(get_db)) -> schemas.Mileage:
#     db_mileage = crud.get_mileage_by_id(id=mileage_id, db=db)
#     if not db_mileage:
#         raise HTTPException(status_code=404)
#     return schemas.Mileage.from_orm(db_mileage)



# # TODO: test
# @api_router.post('/receipt/')
# def create_receipt(
#     author: AuthorToken,
#     file: UploadFile = File(),
#     db: Session = Depends(get_db)
# ) -> int:
#     try:
#         receipt = schemas.ReceiptCreate(
#             filename=file.filename,
#             data=file.file.read(),
#         )
#         crud.create_receipt(receipt=receipt, db=db)
#         return len(receipt.data)
#     except:
#         raise HTTPException(status_code=500, detail='Could not upload file!')


@api_router.post('/receipt/')
def create_receipt(
    file: UploadFile = File(),
    db: Session = Depends(get_db)
) -> int:
    # try:
    print('Got a receipt.')
    filename = file.filename
    if filename:
        filename = sanitise_filename(filename)
    print('Creating a schema.')
    receipt = schemas.ReceiptCreate(
        filename=filename,
        data=file.file.read(),
    )
    print('Doing DB stuff.')
    out = crud.create_receipt(receipt=receipt, db=db).id
    print('all done.')
    return out
    # except:
    #     raise HTTPException(status_code=500, detail='Could not upload file!')

# # TODO: implement
# @api_router.get('/receipt/{filename}')
# def get_receipt(filename: str, db: Session = Depends(get_db)) -> FileResponse:
#     pass

@api_router.get("/entries")
def get_entry(db: Session = Depends(get_db), user = Depends(get_user)):
    return crud.get_entries(db)

@api_router.get("/items/{item_id}/reciepts")
def get_reciept_for_item(item_id, db: Session = Depends(get_db), user = Depends(get_user)):
    data = crud.get_item_reciepts(item_id, db)
    return data

@api_router.get("/receipt/{reciept_id}")
async def get_reciept(reciept_id,background_tasks: BackgroundTasks, db: Session = Depends(get_db), user = Depends(get_user)):
    buffer = io.BytesIO()  # BytesIO stream containing the pdf data
    background_tasks.add_task(buffer.close)
    buffer.write( crud.get_reciept_data(reciept_id, db))
    return Response(buffer.getvalue())


@api_router.delete("/entry/{entry_id}")
def del_entry(entry_id, db: Session = Depends(get_db), user = Depends(get_user)):
    return crud.delete_entry(entry_id, db)

@api_router.post("/approve/{entry_id}")
def approve_entry(entry_id, db: Session = Depends(get_db), user = Depends(get_user)):
    return crud.approve_entry(entry_id, db)

@api_router.post("/deny/{entry_id}")
def deny_entry(entry_id, db: Session = Depends(get_db), user = Depends(get_user)):
    return crud.deny_entry(entry_id, db)

@api_router.post("/reset/{entry_id}")
def reset_entry(entry_id, db: Session = Depends(get_db), user = Depends(get_user)):
    return crud.reset_entry_status(entry_id, db)

@api_router.post("/pay/{entry_id}")
def reset_entry(entry_id, db: Session = Depends(get_db), user = Depends(get_user)):
    return crud.pay_entry(entry_id, db)


@api_router.get("/userdata")
def reset_entry(user = Depends(get_user)):
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
        except:
            raise HTTPException(401, "Invalid auth")
    if user.email != os.getenv("RAHASTONHOITAJA_EMAIL"):
        raise HTTPException(401, "Invalid auth")
    response.set_cookie("token", create_access_token(user.email, timedelta(minutes=30)), httponly=True, samesite="none")
    return {"success": True, "username": user.email}

@api_router.get("/logout")
async def logout(response: Response):
    response.delete_cookie("token")
    return {"success": True}

# @api_router.get('/receipt/{filename}')
# def get_file(filename: str, db: Session = Depends(get_db)) ->

app.include_router(api_router)

