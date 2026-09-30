from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import SAFE_METHODS
from rest_framework.response import Response

from ..models import Student
from ..permissions import IsAdminOrTeacher, IsStudent
from ..serializers import StudentSerializer
from ..services.adaptive_learning import AdaptiveLearningService
from .base import SchoolScopedViewSet


class StudentViewSet(SchoolScopedViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer

    def get_permissions(self):
        user = self.request.user

        if (
            user.is_authenticated
            and not user.is_superuser
            and hasattr(user, "profile")
            and user.profile.role == "STUDENT"
        ):
            if self.request.method in SAFE_METHODS:
                return [IsStudent()]

            return [IsAdminOrTeacher()]

        return [IsAdminOrTeacher()]

    def _is_student(self):
        user = self.request.user

        return (
            user.is_authenticated
            and not user.is_superuser
            and hasattr(user, "profile")
            and user.profile.role == "STUDENT"
        )

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

        queryset = Student.objects.all().select_related(
            "user",
            "school",
            "classroom",
        )

        if school is not None:
            queryset = queryset.filter(
                school=school
            )

        user = self.request.user

        if self._is_student():
            queryset = queryset.filter(
                user=user
            )

        elif self._is_teacher():
            # Teachers can only see students whose
            # classroom is assigned to them.
            queryset = queryset.filter(
                classroom__teachers__user=user
            ).distinct()

        grade = self.request.query_params.get(
            "grade"
        )

        if grade and not self._is_student():
            queryset = queryset.filter(
                grade=grade
            )

        classroom = self.request.query_params.get(
            "classroom"
        )

        if classroom and not self._is_student():
            queryset = queryset.filter(
                classroom_id=classroom
            )

        return queryset.order_by(
            "first_name",
            "last_name",
        )

    def perform_create(self, serializer):
        school = self.get_school()

        if school is None:
            serializer.save()
            return

        serializer.save(
            school=school
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="me",
        permission_classes=[IsStudent],
    )
    def me(self, request):
        """
        Return the authenticated student's own learner record.
        """

        student = self.get_queryset().first()

        if student is None:
            return Response(
                {
                    "detail": (
                        "No student record is linked "
                        "to this account."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.get_serializer(student)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["get"],
        url_path="adaptive-profile",
    )
    def adaptive_profile(self, request, pk=None):
        """
        Return the student's adaptive learning profile.
        """

        student = self.get_object()

        service = AdaptiveLearningService(
            student=student
        )

        profile = service.generate_profile()

        return Response(
            profile,
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["get"],
        url_path="recommendations",
    )
    def recommendations(self, request, pk=None):
        """
        Return targeted learning recommendations
        for the student.
        """

        student = self.get_object()

        service = AdaptiveLearningService(
            student=student
        )

        recommendations = (
            service.generate_recommendations()
        )

        return Response(
            recommendations,
            status=status.HTTP_200_OK,
        )