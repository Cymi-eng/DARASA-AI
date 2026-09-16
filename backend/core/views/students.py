from rest_framework import viewsets

from ..models import Student
from ..permissions import IsAdminOrTeacher
from ..serializers import StudentSerializer
from .base import SchoolScopedViewSet


class StudentViewSet(SchoolScopedViewSet):
    """
    Student management API.

    Students are automatically restricted to the
    authenticated user's school.

    Supports filtering by:

    - grade
    - classroom
    """

    queryset = Student.objects.all()
    serializer_class = StudentSerializer

    def get_permissions(self):
        return [IsAdminOrTeacher()]

    def get_queryset(self):
        school = self.get_school()

        queryset = Student.objects.all().select_related(
            "school",
            "classroom",
        )

        # Superusers can access students across all schools.
        if school is not None:
            queryset = queryset.filter(
                school=school
            )

        # Filter by grade.
        grade = self.request.query_params.get(
            "grade"
        )

        if grade:
            queryset = queryset.filter(
                grade=grade
            )

        # Filter by classroom.
        classroom = self.request.query_params.get(
            "classroom"
        )

        if classroom:
            queryset = queryset.filter(
                classroom_id=classroom
            )

        return queryset.order_by(
            "first_name",
            "last_name",
        )

    def perform_create(self, serializer):
        """
        Automatically assign a new student to the
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