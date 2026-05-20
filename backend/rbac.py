"""Role-Based Access Control dependencies."""
from functools import wraps
from fastapi import Depends, HTTPException, status
from backend.models import User, UserRole


def require_role(*allowed_roles: UserRole):
    """
    FastAPI dependency that checks if the authenticated user has one of the allowed roles.

    Usage:
        @router.delete("/resource", dependencies=[Depends(require_role(UserRole.ADMIN))])
        async def delete_resource(...):
    """
    async def role_checker(user: User):
        if user.role not in [r.value if isinstance(r, UserRole) else r for r in allowed_roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required role: {', '.join(r.value if isinstance(r, UserRole) else r for r in allowed_roles)}"
            )
        return user
    return role_checker


def require_admin(user: User):
    """Shorthand dependency: require ADMIN role."""
    if user.role != UserRole.ADMIN.value and user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return user
