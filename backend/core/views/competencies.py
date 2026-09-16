from rest_framework import viewsets
from rest_framework.exceptions import ValidationError

from ..models import Competency
from ..permissions import IsAdminOrTeacher
from ..serializers import CompetencySerializer
from .base import SchoolScopedViewSet


class CompetencyViewSet(SchoolScopedViewSet):
    """
    CBC competency assessment API.

    Teachers and school administrators can:

    - create assessments
    - view assessments
    - update assessments
    - delete assessments
    - filter by student
    - filter by learning area
    - filter by strand
    - filter by sub-strand
    - filter by mastery level
    - filter by assessment date
    - filter by assessment date range

    All assessments are automatically isolated
    to the authenticated user's school.
    """

    queryset = Competency.objects.all()
    serializer_class = CompetencySerializer

    def get_permissions(self):
        return [IsAdminOrTeacher()]

    def get_queryset(self):
        school = self.get_school()

        queryset = Competency.objects.all().select_related(
            "student",
            "student__school",
        )

        # Superusers can access all schools.
        if school is not None:
            queryset = queryset.filter(
                student__school=school
            )

        # Filter by student.
        student = self.request.query_params.get(
            "student"
        )

        if student:
            queryset = queryset.filter(
                student_id=student
            )

        # Filter by learning area.
        learning_area = self.request.query_params.get(
            "learning_area"
        )

        if learning_area:
            queryset = queryset.filter(
                learning_area=learning_area
            )

        # Filter by strand.
        strand = self.request.query_params.get(
            "strand"
        )

        if strand:
            queryset = queryset.filter(
                strand=strand
            )

        # Filter by sub-strand.
        sub_strand = self.request.query_params.get(
            "sub_strand"
        )

        if sub_strand:
            queryset = queryset.filter(
                sub_strand=sub_strand
            )

        # Filter by mastery level.
        mastery_level = self.request.query_params.get(
            "mastery_level"
        )

        if mastery_level:
            queryset = queryset.filter(
                mastery_level=mastery_level
            )

        # Filter by exact assessment date.
        assessed_on = self.request.query_params.get(
            "assessed_on"
        )

        if assessed_on:
            queryset = queryset.filter(
                assessed_on=assessed_on
            )

        # Filter from assessment date.
        assessed_from = self.request.query_params.get(
            "assessed_from"
        )

        if assessed_from:
            queryset = queryset.filter(
                assessed_on__gte=assessed_from
            )

        # Filter up to assessment date.
        assessed_to = self.request.query_params.get(
            "assessed_to"
        )

        if assessed_to:
            queryset = queryset.filter(
                assessed_on__lte=assessed_to
            )

        return queryset.order_by(
            "-assessed_on",
            "-created_at",
        )

    def perform_create(self, serializer):
        """
        Create a competency assessment.

        Normal users can only assess students belonging
        to their own school.
        """

        school = self.get_school()

        if school is None:
            serializer.save()
            return

        student = serializer.validated_data["student"]

        if student.school_id != school.id:
            raise ValidationError(
                {
                    "student": (
                        "Student does not belong "
                        "to your school."
                    )
                }
            )

        serializer.save()

    def perform_update(self, serializer):
        """
        Update an existing competency assessment.

        The student's school is checked again so that
        an assessment cannot be moved to a student
        from another school.
        """

        school = self.get_school()

        if school is None:
            serializer.save()
            return

        student = serializer.validated_data.get(
            "student",
            serializer.instance.student,
        )

        if student.school_id != school.id:
            raise ValidationError(
                {
                    "student": (
                        "Student does not belong "
                        "to your school."
                    )
                }
            )

        serializer.save()