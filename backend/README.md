### Use these commands to start the backend

```
virtualenv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn --host 0.0.0.0 --port 8025 --access-log kulumasiina_backend.api:app
```
