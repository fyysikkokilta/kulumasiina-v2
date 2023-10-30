import io
from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException, File, Response, UploadFile, APIRouter
from fastapi.responses import FileResponse
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware

from typing import Annotated
from sqlalchemy.orm import Session

from kulumasiina_backend import crud, models, schemas
from kulumasiina_backend.db import SessionLocal, engine
from fastapi.security import HTTPBearer
from fastapi_sso.sso.google import GoogleSSO, OpenID

models.Base.metadata.create_all(bind=engine)

app = FastAPI()
sso = GoogleSSO(scope=[""],allow_insecure_http=True) # TODO Make secure

# TODO: make more secure
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"])

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

# TODO: implement JWT
AuthorToken = Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)]


@api_router.get('/')
def hello():
    return {'msg': 'hello'}


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
def get_entry(db: Session = Depends(get_db)):
    return crud.get_entries(db)

@api_router.get("/items/{item_id}/reciepts")
def get_reciept_for_item(item_id, db: Session = Depends(get_db)):
    data = crud.get_item_reciepts(item_id, db)
    return data

# # TODO: replace w/ JWT with expiration time
# @api_router.get('/author_token/')
# def generate_author_token() -> str:
#     return uuid.uuid4().hex

@api_router.get("/receipt/{reciept_id}")
async def get_reciept(reciept_id,background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    buffer = io.BytesIO()  # BytesIO stream containing the pdf data
    background_tasks.add_task(buffer.close)
    buffer.write( crud.get_reciept_data(reciept_id, db))
    return Response(buffer.getvalue())


@api_router.delete("/entry/{entry_id}")
async def del_item(entry_id, db: Session = Depends(get_db)):
    return crud.delete_entry(entry_id, db)

@api_router.post("/approve/{entry_id}")
async def approve_entry(entry_id, db: Session = Depends(get_db)):
    pass # TODO

@api_router.post("/deny/{entry_id}")
async def approve_entry(entry_id, db: Session = Depends(get_db)):
    pass # TODO

# @api_router.get('/receipt/{filename}')
# def get_file(filename: str, db: Session = Depends(get_db)) ->

app.include_router(api_router)

