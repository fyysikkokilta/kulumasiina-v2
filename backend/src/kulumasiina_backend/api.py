from fastapi import Depends, FastAPI, HTTPException, File, UploadFile
from fastapi.responses import FileResponse
from fastapi.security import HTTPAuthorizationCredentials
from typing import Annotated
from sqlalchemy.orm import Session

from kulumasiina_backend import crud, models, schemas
from kulumasiina_backend.db import SessionLocal, engine
from fastapi.security import HTTPBearer

models.Base.metadata.create_all(bind=engine)

app = FastAPI()


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


@app.get('/')
def hello():
    return {'msg': 'hello'}


@app.post('/entry/')
def create_entry(
    entry: schemas.EntryCreate,
    db: Session = Depends(get_db)
) -> schemas.Entry:
    return crud.create_entry_full(entry=entry, db=db)


# @app.get('/mileage/{mileage_id}')
# def get_mileage_by_id(mileage_id: int, db: Session = Depends(get_db)) -> schemas.Mileage:
#     db_mileage = crud.get_mileage_by_id(id=mileage_id, db=db)
#     if not db_mileage:
#         raise HTTPException(status_code=404)
#     return schemas.Mileage.from_orm(db_mileage)



# # TODO: test
# @app.post('/receipt/')
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


@app.post('/receipt/')
def create_receipt(
    file: UploadFile = File(),
    db: Session = Depends(get_db)
) -> int:
    # try:
    filename = file.filename
    if filename:
        filename = sanitise_filename(filename)
    receipt = schemas.ReceiptCreate(
        filename=filename,
        data=file.file.read(),
    )
    return crud.create_receipt(receipt=receipt, db=db).id
    # except:
    #     raise HTTPException(status_code=500, detail='Could not upload file!')

# # TODO: implement
# @app.get('/receipt/{filename}')
# def get_receipt(filename: str, db: Session = Depends(get_db)) -> FileResponse:
#     pass




# # TODO: replace w/ JWT with expiration time
# @app.get('/author_token/')
# def generate_author_token() -> str:
#     return uuid.uuid4().hex


# @app.get('/receipt/{filename}')
# def get_file(filename: str, db: Session = Depends(get_db)) ->
