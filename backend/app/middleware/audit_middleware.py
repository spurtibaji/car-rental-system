import time
import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from app.core.logging import logger
from app.core.config import settings


class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))

        try:
            response: Response = await call_next(request)
        except Exception as exc:
            logger.exception(f"Unhandled exception in request pipeline at {request.method} {request.url.path}: {exc}")
            headers = {
                "X-Request-ID": request_id,
                "X-Process-Time": f"{time.time() - start_time:.4f}s",
            }
            origin = request.headers.get("origin")
            if origin:
                allowed = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else settings.CORS_ORIGINS.split(",")
                allowed = [a.strip() for a in allowed]
                if "*" in allowed or origin in allowed:
                    headers["Access-Control-Allow-Origin"] = origin
                    headers["Access-Control-Allow-Credentials"] = "true"
                    headers["Access-Control-Allow-Methods"] = "*"
                    headers["Access-Control-Allow-Headers"] = "*"
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": "An internal server error occurred. Please try again later.",
                },
                headers=headers,
            )

        duration = time.time() - start_time
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time"] = f"{duration:.4f}s"
        return response
