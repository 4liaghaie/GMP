from rest_framework.permissions import BasePermission

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                getattr(request.user, "role", "") == "admin"
                or getattr(request.user, "is_staff", False)
                or getattr(request.user, "is_superuser", False)
            )
        )

class IsStaffOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and getattr(request.user, "role", "") in {"staff", "admin"}
        )
