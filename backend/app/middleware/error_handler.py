from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder
from app.core.exceptions import AppException
from app.core.logging import logger
from app.core.config import settings


def _apply_cors_headers(request: Request, response: JSONResponse) -> JSONResponse:
    origin = request.headers.get("origin")
    if origin:
        allowed = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else settings.CORS_ORIGINS.split(",")
        allowed = [a.strip() for a in allowed]
        if "*" in allowed or origin in allowed:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "*"
            response.headers["Access-Control-Allow-Headers"] = "*"
    return response


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    logger.warning(f"AppException at {request.method} {request.url.path}: {exc.message}")
    resp = JSONResponse(
        status_code=exc.status_code,
        content=jsonable_encoder({
            "success": False,
            "message": exc.message,
            "details": exc.details,
        }),
    )
    return _apply_cors_headers(request, resp)


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    errors = exc.errors()
    first_msg = errors[0].get("msg") if errors else "Validation failed"
    first_loc = " -> ".join(str(l) for l in errors[0].get("loc", [])) if errors else ""
    friendly_msg = f"{first_loc}: {first_msg}" if first_loc else first_msg

    logger.warning(f"Validation error at {request.method} {request.url.path}: {friendly_msg}")
    resp = JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=jsonable_encoder({
            "success": False,
            "message": friendly_msg,
            "details": errors,
        }),
    )
    return _apply_cors_headers(request, resp)


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception(f"Unhandled exception at {request.method} {request.url.path}: {str(exc)}")
    resp = JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "An internal server error occurred. Please try again later.",
        },
    )
    return _apply_cors_headers(request, resp)
