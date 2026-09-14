from rest_framework.permissions import BasePermission


class HasSchoolAccess(BasePermission):
    """
    Allows authenticated users who belong to a school to access
    school-scoped resources.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        profile = getattr(request.user, "profile", None)

        return bool(
            profile
            and profile.school_id
        )


class IsSchoolAdmin(BasePermission):
    """
    Allows only school administrators or Django superusers.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        profile = getattr(request.user, "profile", None)

        return bool(
            profile
            and profile.school_id
            and profile.role == "ADMIN"
        )