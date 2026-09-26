from rest_framework import viewsets

from ..models import Teacher
from ..permissions import IsSchoolAdmin
from ..serializers import TeacherSerializer
from .base import SchoolScopedViewSet


class TeacherViewSet(SchoolScopedViewSet):
    """
    Teacher management API.

    Teachers are automatically restricted to the
    authenticated user's school.

    Only school administrators can manage teacher
    records.

    Classroom assignments are loaded efficiently because
    teacher-to-classroom relationships are used throughout
    the role-based access system.
    """

    queryset = Teacher.objects.all()
    serializer_class = TeacherSerializer

    def get_permissions(self):
        return [IsSchoolAdmin()]

    def get_queryset(self):
        school = self.get_school()

        queryset = Teacher.objects.all().select_related(
            "user",
            "school",
        ).prefetch_related(
            "classrooms",
        )

        # Superusers can access teachers across all schools.
        if school is not None:
            queryset = queryset.filter(
                school=school
            )

        return queryset.order_by(
            "user__first_name",
            "user__last_name",
        )

    def perform_create(self, serializer):
        """
        Automatically assign a new teacher record to the
        authenticated administrator's school.

        Superusers may explicitly provide a school.
        """

        school = self.get_school()

        if school is None:
            serializer.save()
            return

        serializer.save(
            school=school
        )