from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import Student
from ..permissions import IsAdminOrTeacher
from ..serializers import StudentSerializer
from ..services.adaptive_learning import AdaptiveLearningService
from .base import SchoolScopedViewSet


class StudentViewSet(SchoolScopedViewSet):
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

        if school is not None:
            queryset = queryset.filter(
                school=school
            )

        grade = self.request.query_params.get(
            "grade"
        )

        if grade:
            queryset = queryset.filter(
                grade=grade
            )

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
        school = self.get_school()

        if school is None:
            serializer.save()
            return

        serializer.save(
            school=school
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