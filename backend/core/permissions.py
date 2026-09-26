from rest_framework.permissions import BasePermission


class HasSchoolAccess(BasePermission):
    """
    Allows authenticated users who belong to a school.

    Platform administrators are allowed through because they
    operate at the platform level rather than within one school.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        profile = getattr(request.user, "profile", None)

        if not profile:
            return False

        if profile.role == "PLATFORM_ADMIN":
            return True

        return profile.school_id is not None


class IsPlatformAdmin(BasePermission):
    """
    Allows only DARASA-AI platform administrators.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        profile = getattr(request.user, "profile", None)

        return bool(
            profile
            and profile.role == "PLATFORM_ADMIN"
        )


class IsSchoolAdmin(BasePermission):
    """
    Allows only school administrators.

    Platform administrators are intentionally excluded here.
    Platform-level and school-level responsibilities remain separate.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        profile = getattr(request.user, "profile", None)

        return bool(
            profile
            and profile.role == "ADMIN"
            and profile.school_id is not None
        )


class IsTeacher(BasePermission):
    """
    Allows authenticated teachers belonging to a school.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        profile = getattr(request.user, "profile", None)

        return bool(
            profile
            and profile.role == "TEACHER"
            and profile.school_id is not None
        )


class IsBursar(BasePermission):
    """
    Allows authenticated bursars belonging to a school.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        profile = getattr(request.user, "profile", None)

        return bool(
            profile
            and profile.role == "BURSAR"
            and profile.school_id is not None
        )


class IsStudent(BasePermission):
    """
    Allows authenticated students belonging to a school.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        profile = getattr(request.user, "profile", None)

        return bool(
            profile
            and profile.role == "STUDENT"
            and profile.school_id is not None
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
            and profile.role in {"ADMIN", "TEACHER"}
            and profile.school_id is not None
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
            and profile.role in {"ADMIN", "BURSAR"}
            and profile.school_id is not None
        )