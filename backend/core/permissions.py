from rest_framework.permissions import BasePermission


class HasSchoolAccess(BasePermission):
    """
    Allows authenticated users who belong to a school.
    Superusers bypass school restrictions.
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


class IsTeacher(BasePermission):
    """
    Allows school teachers or Django superusers.
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
            and profile.role == "TEACHER"
        )


class IsBursar(BasePermission):
    """
    Allows school bursars or Django superusers.
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
            and profile.role == "BURSAR"
        )


class IsAdminOrTeacher(BasePermission):
    """
    Allows school administrators and teachers.
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
            and profile.role in ["ADMIN", "TEACHER"]
        )


class IsAdminOrBursar(BasePermission):
    """
    Allows school administrators and bursars.
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
            and profile.role in ["ADMIN", "BURSAR"]
        )