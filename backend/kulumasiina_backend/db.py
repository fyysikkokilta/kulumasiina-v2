from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

if 'DATABASE_URL' in os.environ:
    raise Exception("DATABASE_URL not set. Please set it in .env")

SQLALCHEMY_DATABASE_URL = os.environ['DATABASE_URL']

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={'check_same_thread': False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base = declarative_base()
