
from rest_framework import viewsets
from rest_framework.permissions import BasePermission

from ..models import School
from ..permissions import HasSchoolAccess, IsPlatformAdmin
from ..serializers import SchoolSerializer


class PlatformAdminOrSchoolAdmin(BasePermission):
    """
    Allows platform administrators to manage all schools
    and school administrators to manage their own school.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        profile = getattr(request.user, "profile", None)

        return bool(
            profile
            and (
                profile.role == "PLATFORM_ADMIN"
                or (
                    profile.role == "ADMIN"
                    and profile.school_id is not None
                )
            )
        )

    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser:
            return True

        profile = getattr(request.user, "profile", None)

        if not profile:
            return False

        if profile.role == "PLATFORM_ADMIN":
            return True

        return bool(
            profile.role == "ADMIN"
            and profile.school_id == obj.pk
        )


class SchoolViewSet(viewsets.ModelViewSet):
    """
    School management API.

    Platform administrators:
    - Create schools.
    - View all schools.
    - Update and delete any school.

    School administrators:
    - View their own school.
    - Update their own school.

    Other school users:
    - Can only view their assigned school.
    """

    queryset = School.objects.all()
    serializer_class = SchoolSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [HasSchoolAccess()]

        if self.action == "create":
            return [IsPlatformAdmin()]

        return [PlatformAdminOrSchoolAdmin()]

    def get_queryset(self):
        user = self.request.user

        if not user or not user.is_authenticated:
            return School.objects.none()

        if user.is_superuser:
            return School.objects.all()

        profile = getattr(user, "profile", None)

        if not profile:
            return School.objects.none()

        if profile.role == "PLATFORM_ADMIN":
            return School.objects.all()

        if profile.school_id is None:
            return School.objects.none()

        return School.objects.filter(
            pk=profile.school_id
        )
