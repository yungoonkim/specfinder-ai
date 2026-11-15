from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.exc import SQLAlchemyError

from app.database import settings
from app.routers import cars, notebooks

app = FastAPI(title="SpecFinder AI API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["Accept", "Content-Type"],
)


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    first = errors[0] if errors else {}
    field = ".".join(str(part) for part in first.get("loc", ())[1:]) or None
    return JSONResponse(status_code=422, content={
        "code": "INVALID_FILTER",
        "message": "검색 조건을 확인해 주세요.",
        "details": {"field": field, "reason": first.get("msg", "invalid value")},
    })


@app.exception_handler(SQLAlchemyError)
async def database_error_handler(request: Request, exc: SQLAlchemyError):
    return JSONResponse(status_code=503, content={
        "code": "DB_UNAVAILABLE", "message": "데이터베이스에 연결할 수 없습니다.",
        "details": None,
    })


@app.exception_handler(StarletteHTTPException)
async def http_error_handler(request: Request, exc: StarletteHTTPException):
    if isinstance(exc.detail, dict) and "code" in exc.detail:
        body = {**exc.detail, "details": exc.detail.get("details")}
    else:
        body = {"code": "NOT_FOUND", "message": "요청한 리소스를 찾을 수 없습니다.", "details": None}
    return JSONResponse(status_code=exc.status_code, content=body, headers=exc.headers)


@app.exception_handler(Exception)
async def internal_error_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={
        "code": "INTERNAL_ERROR", "message": "서버에서 요청을 처리하지 못했습니다.",
        "details": None,
    })


@app.get("/api/health")
def health():
    return {"status": "ok"}


app.include_router(notebooks.router)
app.include_router(cars.router)
