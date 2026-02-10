"""API dependencies for authentication and authorization."""

import os

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import APIKeyHeader

API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)


def verify_api_key(api_key: str = Security(API_KEY_HEADER)) -> str:
    """Verify the API key from X-API-Key header.

    Skips verification if AI_SERVICE_API_KEY is not configured (development mode).

    Args:
        api_key: API key from request header.

    Returns:
        The verified API key.

    Raises:
        HTTPException: If API key is missing or invalid.
    """
    expected_key = os.getenv("AI_SERVICE_API_KEY", "")

    # Skip verification if no key is configured (development mode)
    if not expected_key:
        return api_key or ""

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API key. Provide X-API-Key header.",
        )

    if api_key != expected_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API key.",
        )

    return api_key
