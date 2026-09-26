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

    Teachers and school administrators can:

    - create assessments
    - view assessments
    - update assessments
    - delete assessments
    - filter assessments
    - view student competency summaries
    - view classroom competency summaries
    - identify student intervention areas

    School administrators can access all learners
    within their school.

    Teachers can only access learners belonging to
    classrooms assigned to them.
    """

    queryset = Competency.objects.all()
    serializer_class = CompetencySerializer

    def get_permissions(self):
        return [IsAdminOrTeacher()]

    def _is_teacher(self):
        """
        Return True when the authenticated user is
        a non-superuser teacher.
        """

        user = self.request.user

        return (
            user.is_authenticated
            and not user.is_superuser
            and hasattr(user, "profile")
            and user.profile.role == "TEACHER"
        )

    def _teacher_can_access_student(self, student):
        """
        Check whether the current teacher is assigned
        to the student's classroom.

        School administrators and superusers are handled
        outside this method.
        """

        if not self._is_teacher():
            return True

        return student.classroom is not None and student.classroom.teachers.filter(
            user=self.request.user
        ).exists()

    def _validate_student_access(self, student):
        """
        Validate school isolation and teacher classroom
        assignment for a student.
        """

        school = self.get_school()

        if school is not None and student.school_id != school.id:
            raise ValidationError(
                {
                    "student": (
                        "Student does not belong "
                        "to your school."
                    )
                }
            )

        if not self._teacher_can_access_student(student):
            raise ValidationError(
                {
                    "student": (
                        "You can only assess students "
                        "in your assigned classrooms."
                    )
                }
            )

    def _student_is_accessible(self, student):
        """
        Return whether the current user can access
        the supplied student.
        """

        school = self.get_school()

        if (
            school is not None
            and student.school_id != school.id
        ):
            return False

        return self._teacher_can_access_student(student)

    def get_queryset(self):
        school = self.get_school()

        queryset = Competency.objects.all().select_related(
            "student",
            "student__school",
            "student__classroom",
        )

        # School isolation.
        if school is not None:
            queryset = queryset.filter(
                student__school=school
            )

        # Teachers can only see assessments belonging
        # to students in classrooms assigned to them.
        if self._is_teacher():
            queryset = queryset.filter(
                student__classroom__teachers__user=self.request.user
            ).distinct()

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

        School administrators can assess any learner
        within their school.

        Teachers can only assess learners belonging
        to their assigned classrooms.
        """

        student = serializer.validated_data["student"]

        self._validate_student_access(student)

        serializer.save()

    def perform_update(self, serializer):
        """
        Update an existing competency assessment.

        The student's school and teacher classroom
        assignment are checked again so an assessment
        cannot be moved outside the user's access scope.
        """

        student = serializer.validated_data.get(
            "student",
            serializer.instance.student,
        )

        self._validate_student_access(student)

        serializer.save()

    def _mastery_distribution(self, competencies):
        """
        Return CBC mastery counts and percentages.
        """

        total = competencies.count()

        distribution = {
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
            distribution[item["mastery_level"]] = (
                item["total"]
            )

        percentages = {}

        for level, count in distribution.items():
            percentages[level] = (
                round((count / total) * 100, 2)
                if total
                else 0
            )

        return {
            "counts": distribution,
            "percentages": percentages,
        }

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

        if not self._student_is_accessible(student):
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

        mastery = self._mastery_distribution(
            competencies
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

        intervention_required = (
            mastery["counts"]["BE"] > 0
            or mastery["counts"]["AE"]
            > mastery["counts"]["EE"]
        )

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
                "mastery_distribution": mastery,
                "assessments_by_learning_area": (
                    learning_area_counts
                ),
                "intervention_required": (
                    intervention_required
                ),
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=False,
        methods=["get"],
        url_path=r"student/(?P<student_id>[^/.]+)/interventions",
    )
    def student_interventions(
        self,
        request,
        student_id=None,
    ):
        """
        Identify learning areas, strands, and sub-strands
        where a student may require intervention.

        Intervention is based on the student's latest
        assessment for each competency area.

        BE = high priority
        AE = medium priority
        """

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

        if not self._student_is_accessible(student):
            return Response(
                {
                    "detail": "Student not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        competencies = Competency.objects.filter(
            student=student
        ).order_by(
            "learning_area",
            "strand",
            "sub_strand",
            "-assessed_on",
            "-created_at",
        )

        latest_assessments = {}

        for competency in competencies:
            key = (
                competency.learning_area,
                competency.strand,
                competency.sub_strand,
            )

            if key not in latest_assessments:
                latest_assessments[key] = competency

        interventions = []

        for competency in latest_assessments.values():
            if competency.mastery_level not in [
                "BE",
                "AE",
            ]:
                continue

            interventions.append(
                {
                    "learning_area": (
                        competency.learning_area
                    ),
                    "strand": competency.strand,
                    "sub_strand": competency.sub_strand,
                    "mastery_level": (
                        competency.mastery_level
                    ),
                    "assessed_on": (
                        competency.assessed_on
                    ),
                    "priority": (
                        "high"
                        if competency.mastery_level == "BE"
                        else "medium"
                    ),
                    "reason": (
                        "Below Expectation"
                        if competency.mastery_level == "BE"
                        else "Approaches Expectation"
                    ),
                }
            )

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
                "total_interventions": len(
                    interventions
                ),
                "intervention_required": bool(
                    interventions
                ),
                "interventions": interventions,
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

        Teachers can only view summaries for classrooms
        assigned to them.
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

        # Teachers can only view assigned classrooms.
        if self._is_teacher():
            students = students.filter(
                classroom__teachers__user=self.request.user
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

        mastery = self._mastery_distribution(
            competencies
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

        intervention_students = []

        for student in students:
            student_competencies = Competency.objects.filter(
                student=student
            )

            student_mastery = self._mastery_distribution(
                student_competencies
            )

            if (
                student_mastery["counts"]["BE"] > 0
                or (
                    student_mastery["counts"]["AE"]
                    > student_mastery["counts"]["EE"]
                )
            ):
                intervention_students.append(
                    {
                        "id": student.id,
                        "name": (
                            f"{student.first_name} "
                            f"{student.last_name}"
                        ),
                        "admission_number": (
                            student.admission_number
                        ),
                    }
                )

        return Response(
            {
                "classroom": {
                    "id": classroom_id,
                    "name": students.first().classroom.name,
                    "grade": students.first().grade,
                },
                "total_students": students.count(),
                "total_assessments": total_assessments,
                "mastery_distribution": mastery,
                "assessments_by_learning_area": (
                    learning_area_counts
                ),
                "intervention_required": bool(
                    intervention_students
                ),
                "intervention_students": (
                    intervention_students
                ),
            },
            status=status.HTTP_200_OK,
        )