from rest_framework import viewsets

from ..models import Notification
from ..permissions import IsAdminOrTeacher
from ..serializers import NotificationSerializer
from .base import SchoolScopedViewSet


class NotificationViewSet(SchoolScopedViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer

    def get_permissions(self):
        return [IsAdminOrTeacher()]

    def get_queryset(self):
        school = self.get_school()

        queryset = Notification.objects.all().select_related(
            "school",
            "student",
            "student__school",
        )

        if school is not None:
            queryset = queryset.filter(
                school=school
            )

        student = self.request.query_params.get(
            "student"
        )

        if student:
            queryset = queryset.filter(
                student_id=student
            )

        channel = self.request.query_params.get(
            "channel"
        )

        if channel:
            queryset = queryset.filter(
                channel=channel
            )

        notification_status = self.request.query_params.get(
            "status"
        )

        if notification_status:
            queryset = queryset.filter(
                status=notification_status
            )

        recipient_type = self.request.query_params.get(
            "recipient_type"
        )

        if recipient_type:
            queryset = queryset.filter(
                recipient_type=recipient_type
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

        serializer.save(
            school=school
        )