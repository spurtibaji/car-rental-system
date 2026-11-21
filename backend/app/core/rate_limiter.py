import time
from collections import defaultdict
from typing import Dict, List, Tuple
from fastapi import HTTPException, Request, status


class InMemoryRateLimiter:
    """Sliding-window rate limiter per client IP."""

    def __init__(self, requests_limit: int, time_window_seconds: int = 60):
        self.requests_limit = requests_limit
        self.time_window_seconds = time_window_seconds
        self.requests: Dict[str, List[float]] = defaultdict(list)

    def is_allowed(self, client_ip: str) -> Tuple[bool, int, int]:
        """
        Check if request is allowed.
        Returns: (allowed, remaining_requests, retry_after_seconds)
        """
        now = time.time()
        window_start = now - self.time_window_seconds

        # Clean old timestamps
        timestamps = [ts for ts in self.requests[client_ip] if ts > window_start]
        self.requests[client_ip] = timestamps

        if len(timestamps) >= self.requests_limit:
            oldest = timestamps[0]
            retry_after = int(self.time_window_seconds - (now - oldest)) + 1
            return False, 0, max(1, retry_after)

        # Allow and record timestamp
        self.requests[client_ip].append(now)
        remaining = self.requests_limit - len(self.requests[client_ip])
        return True, remaining, 0

    def check(self, request: Request) -> None:
        """Enforce rate limit, raising 429 Too Many Requests if exceeded."""
        client_ip = (
            request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
            or request.client.host
            if request.client
            else "127.0.0.1"
        )
        allowed, remaining, retry_after = self.is_allowed(client_ip)
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Please try again in {retry_after} seconds.",
                headers={"Retry-After": str(retry_after)},
            )


# Global instances for auth and roadside endpoints
auth_rate_limiter = InMemoryRateLimiter(requests_limit=10, time_window_seconds=60)
roadside_rate_limiter = InMemoryRateLimiter(requests_limit=5, time_window_seconds=60)
