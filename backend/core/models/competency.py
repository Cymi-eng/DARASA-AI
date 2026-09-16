from django.db.models import Count

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from ..models import Competency, Student
from ..permissions import IsAdminOrTeacher
from ..serializers import CompetencySerializer
from .base import SchoolScopedViewSet


class CompetencyViewSet(SchoolScopedViewSet):
    """
    CBC competency assessment API.

    Supports:

    - assessment creation
    - assessment retrieval
    - assessment updates
    - assessment deletion
    - filtering
    - student competency summaries
    - classroom competency summaries
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

        # School isolation.
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

        # Filter from date.
        assessed_from = self.request.query_params.get(
            "assessed_from"
        )

        if assessed_from:
            queryset = queryset.filter(
                assessed_on__gte=assessed_from
            )

        # Filter to date.
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

        Normal users can only assess students
        belonging to their school.
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

        School ownership is checked again before saving.
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

    @action(
        detail=False,
        methods=["get"],
        url_path=r"student/(?P<student_id>[^/.]+)/summary",
    )
    def student_summary(self, request, student_id=None):
        """
        Return a CBC competency summary for one student.
        """

        school = self.get_school()

        try:
            student = Student.objects.select_related(
                "school",
                "classroom",
            ).get(
                id=student_id
            )
        except Student.DoesNotExist:
            return Response(
                {
                    "detail": "Student not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # Enforce school isolation.
        if (
            school is not None
            and student.school_id != school.id
        ):
            return Response(
                {
                    "detail": "Student not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        competencies = Competency.objects.filter(
            student=student
        )

        total_assessments = competencies.count()

        mastery_counts = {
            "EE": 0,
            "ME": 0,
            "AE": 0,
            "BE": 0,
        }

        for item in competencies.values(
            "mastery_level"
        ).annotate(
            total=Count("id")
        ):
            mastery_counts[item["mastery_level"]] = (
                item["total"]
            )

        learning_area_counts = {}

        for item in competencies.values(
            "learning_area"
        ).annotate(
            total=Count("id")
        ):
            learning_area_counts[
                item["learning_area"]
            ] = item["total"]

        return Response(
            {
                "student": {
                    "id": student.id,
                    "name": (
                        f"{student.first_name} "
                        f"{student.last_name}"
                    ),
                    "admission_number": (
                        student.admission_number
                    ),
                    "grade": student.grade,
                    "classroom": (
                        student.classroom.name
                        if student.classroom
                        else None
                    ),
                },
                "total_assessments": total_assessments,
                "mastery_distribution": mastery_counts,
                "assessments_by_learning_area": (
                    learning_area_counts
                ),
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=False,
        methods=["get"],
        url_path=r"classroom/(?P<classroom_id>[^/.]+)/summary",
    )
    def classroom_summary(
        self,
        request,
        classroom_id=None,
    ):
        """
        Return CBC competency summary for a classroom.
        """

        school = self.get_school()

        students = Student.objects.filter(
            classroom_id=classroom_id
        )

        # Enforce school isolation.
        if school is not None:
            students = students.filter(
                school=school
            )

        students = students.select_related(
            "classroom",
            "school",
        )

        if not students.exists():
            return Response(
                {
                    "detail": "Classroom not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        student_ids = students.values_list(
            "id",
            flat=True,
        )

        competencies = Competency.objects.filter(
            student_id__in=student_ids
        )

        total_assessments = competencies.count()

        mastery_counts = {
            "EE": 0,
            "ME": 0,
            "AE": 0,
            "BE": 0,
        }

        for item in competencies.values(
            "mastery_level"
        ).annotate(
            total=Count("id")
        ):
            mastery_counts[item["mastery_level"]] = (
                item["total"]
            )

        learning_area_counts = {}

        for item in competencies.values(
            "learning_area"
        ).annotate(
            total=Count("id")
        ):
            learning_area_counts[
                item["learning_area"]
            ] = item["total"]

        return Response(
            {
                "classroom": {
                    "id": classroom_id,
                    "name": students.first().classroom.name,
                    "grade": students.first().grade,
                },
                "total_students": students.count(),
                "total_assessments": total_assessments,
                "mastery_distribution": mastery_counts,
                "assessments_by_learning_area": (
                    learning_area_counts
                ),
            },
            status=status.HTTP_200_OK,
        )