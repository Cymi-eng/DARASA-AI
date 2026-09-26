from rest_framework import viewsets

from ..models import ClassRoom
from ..permissions import IsAdminOrTeacher
from ..serializers import ClassRoomSerializer
from .base import SchoolScopedViewSet


class ClassRoomViewSet(SchoolScopedViewSet):
    """
    Classroom management API.

    Classrooms are automatically restricted to the
    authenticated user's school.

    Teachers can only access classrooms assigned
    to their teacher profile.

    Supports filtering by:

    - grade
    """

    queryset = ClassRoom.objects.all()
    serializer_class = ClassRoomSerializer

    def get_permissions(self):
        return [IsAdminOrTeacher()]

    def get_queryset(self):
        school = self.get_school()

        queryset = ClassRoom.objects.all().select_related(
            "school"
        )

        # Superusers can access classrooms across
        # all schools.
        if school is not None:
            queryset = queryset.filter(
                school=school
            )

        user = self.request.user

        # Teachers can only access classrooms assigned
        # to their teacher profile.
        if (
            user.is_authenticated
            and not user.is_superuser
            and hasattr(user, "profile")
            and user.profile.role == "TEACHER"
        ):
            queryset = queryset.filter(
                teachers__user=user
            ).distinct()

        # Filter by grade.
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
        Automatically assign a new classroom to the
        authenticated user's school.

        Superusers may explicitly provide a school.
        """

        school = self.get_school()

        if school is None:
            serializer.save()
            return

        serializer.save(
            school=school
        )