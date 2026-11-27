import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from fastapi import HTTPException
from app.core.rate_limiter import auth_rate_limiter, roadside_rate_limiter


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        try:
            # Rate limit auth endpoints
            if "/api/v1/auth/login" in path or "/api/v1/auth/register" in path:
                auth_rate_limiter.check(request)

            # Rate limit roadside emergency request submission
            elif "/api/v1/roadside/requests" in path and request.method == "POST":
                roadside_rate_limiter.check(request)
        except HTTPException as exc:
            headers = dict(exc.headers or {})
            return JSONResponse(
                status_code=exc.status_code,
                content={
                    "success": False,
                    "message": exc.detail,
                },
                headers=headers,
            )

        response: Response = await call_next(request)
        return response
