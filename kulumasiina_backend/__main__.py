import uvicorn
from .api import app

def run():
    uvicorn.run(
        "kulumasiina_backend.api:app",
        host="127.0.0.1",
        port=8025,
        reload=True
    )

if __name__ == "__main__":
    run()
