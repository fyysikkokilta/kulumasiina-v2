from kulumasiina_backend.api import app
from kulumasiina_backend import schemas
from fastapi.testclient import TestClient

import os

client = TestClient(app)


def test_hello():
    response = client.get('/')
    assert response.status_code == 200
    assert response.json() == {'msg': 'hello'}


def test_receipt_upload():
    filepath = os.path.dirname(os.path.realpath(__file__))
    filepath = os.path.join(filepath, 'test_image.png')
    with open(filepath, 'rb') as f:
        response = client.post(
            '/receipt/',
            files={'file': ('test_image.png', f, 'image/png')},
        )
    assert response.status_code == 200


def test_entry_only():
    data = schemas.EntryCreate(
        name='Test user',
        iban='tilinro',
        contact='@testuser',
        title='Vappujuttuja',
        items=[],
        mileages=[],
    )
    response = client.post('/entry/', json=data.dict())
    assert response.status_code == 200


# TODO:
# test entry get
# test entry get id
# test entry update status
# test item get id
# test mileage get id
# test receipt get id / filename
# test unauthorised access
# test entry with bad receipt ids
# test entry unauthorised receipt id
# test receipt null filename

# test login
# test roles



def test_bad_request():
    response = client.post(
        '/entry/',
        headers={'Authorization': 'bearer token-1234'},
        json={
            'name': 'nimi',
            'title': 'titteli',
            'contact': 'yhteystieto',
            'iban': 'tilinro',
        },
    )
    assert response.status_code != 200
