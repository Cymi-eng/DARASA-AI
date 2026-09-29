from rest_framework import viewsets
from rest_framework.permissions import SAFE_METHODS

from ..models import Notification
from ..permissions import IsAdminOrTeacher, IsStudent
from ..serializers import NotificationSerializer
from .base import SchoolScopedViewSet


class NotificationViewSet(SchoolScopedViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer

    def _is_student(self):
        user = self.request.user

        return (
            user.is_authenticated
            and not user.is_superuser
            and hasattr(user, "profile")
            and user.profile.role == "STUDENT"
        )

    def get_permissions(self):
        if self._is_student():
            if self.request.method in SAFE_METHODS:
                return [IsStudent()]

        return [IsAdminOrTeacher()]

    def get_queryset(self):
        school = self.get_school()

        queryset = Notification.objects.all().select_related(
            "school",
            "student",
            "student__user",
            "student__school",
        )

        if school is not None:
            queryset = queryset.filter(school=school)

        # Students may only view notifications linked
        # to their own authenticated student record.
        if self._is_student():
            queryset = queryset.filter(
                student__user=self.request.user
            )
        else:
            student = self.request.query_params.get("student")

            if student:
                queryset = queryset.filter(
                    student_id=student
                )

            recipient_type = (
                self.request.query_params.get("recipient_type")
            )

            if recipient_type:
                queryset = queryset.filter(
                    recipient_type=recipient_type
                )

        channel = self.request.query_params.get("channel")

        if channel and not self._is_student():
            queryset = queryset.filter(channel=channel)

        notification_status = (
            self.request.query_params.get("status")
        )

        if notification_status and not self._is_student():
            queryset = queryset.filter(
                status=notification_status
            )

        return queryset.order_by(
            "-created_at",
            "-id",
        )

    def perform_create(self, serializer):
        school = self.get_school()

        if school is None:
            serializer.save()
            return

        serializer.save(school=school)