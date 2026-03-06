from fastapi import FastAPI
from api.router import api_router

app = FastAPI(
    title="Codebase Atlas API",
    description="Backend API for mapping and querying codebases.",
    version="0.1.0"
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "Welcome to the Codebase Atlas API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
