from rest_framework import permissions, viewsets
from rest_framework.exceptions import PermissionDenied

from ..models import ClassRoom
from ..permissions import IsAdminOrTeacher
from ..serializers import ClassRoomSerializer
from .base import SchoolScopedViewSet


class ClassRoomViewSet(SchoolScopedViewSet):
    """
    Classroom management API.

    Admins can manage classrooms.

    Teachers can only view classrooms assigned
    to their teacher profile. Teachers cannot
    create classrooms.
    """

    queryset = ClassRoom.objects.all()
    serializer_class = ClassRoomSerializer

    def get_permissions(self):
        return [IsAdminOrTeacher()]

    def _is_teacher(self):
        user = self.request.user

        return (
            user.is_authenticated
            and not user.is_superuser
            and hasattr(user, "profile")
            and user.profile.role == "TEACHER"
        )

    def get_queryset(self):
        school = self.get_school()

        queryset = ClassRoom.objects.all().select_related(
            "school"
        )

        if school is not None:
            queryset = queryset.filter(
                school=school
            )

        user = self.request.user

        # Teachers can only see classrooms assigned
        # to their teacher profile.
        if self._is_teacher():
            queryset = queryset.filter(
                teachers__user=user
            ).distinct()

        grade = self.request.query_params.get(
            "grade"
        )

        if grade:
            queryset = queryset.filter(
                grade=grade
            )

        return queryset.order_by(
            "grade",
            "name",
        )

    def perform_create(self, serializer):
        """
        Teachers are not allowed to create classrooms.
        Classroom creation is an administrative operation.
        """

        if self._is_teacher():
            raise PermissionDenied(
                "Teachers cannot create classrooms."
            )

        school = self.get_school()

        if school is None:
            serializer.save()
            return

        serializer.save(
            school=school
        )