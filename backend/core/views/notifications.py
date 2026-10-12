
from django.db.models import Q
from django.utils import timezone

from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import SAFE_METHODS

from ..models import Notification
from ..permissions import (
    IsAdminOrTeacher,
    IsPlatformAdmin,
    IsStudent,
)
from ..serializers import NotificationSerializer
from .base import SchoolScopedViewSet


class NotificationViewSet(SchoolScopedViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer

    def _is_student(self):
        user = self.request.user
        profile = getattr(user, "profile", None)

        return (
            user.is_authenticated
            and not user.is_superuser
            and profile is not None
            and profile.role == "STUDENT"
        )

    def _is_global_announcement(self, notification):
        return (
            notification.school_id is None
            and notification.recipient_type == "ALL"
            and notification.channel == "IN_APP"
        )

    def _requests_global_announcement(self):
        return (
            self.request.data.get("recipient_type") == "ALL"
            or self.request.data.get("channel") == "IN_APP"
        )

    def get_permissions(self):
        if self._is_student():
            if self.request.method in SAFE_METHODS:
                return [IsStudent()]

        # Creating a global announcement requires platform-admin access.
        if (
            self.action == "create"
            and self._requests_global_announcement()
        ):
            return [IsPlatformAdmin()]

        # Only platform admins may modify existing global announcements.
        if self.action in ("update", "partial_update", "destroy"):
            lookup_value = self.kwargs.get(
                self.lookup_url_kwarg or self.lookup_field
            )

            if lookup_value is not None:
                notification = Notification.objects.filter(
                    pk=lookup_value
                ).first()

                if (
                    notification is not None
                    and self._is_global_announcement(notification)
                ):
                    return [IsPlatformAdmin()]

        return [IsAdminOrTeacher()]

    def get_queryset(self):
        school = self.get_school()

        queryset = Notification.objects.select_related(
            "school",
            "student",
            "student__user",
            "student__school",
        )

        # School users can see their school's notifications and
        # published platform-wide in-app announcements.
        if school is not None:
            queryset = queryset.filter(
                Q(school=school)
                | Q(
                    school__isnull=True,
                    recipient_type="ALL",
                    channel="IN_APP",
                    status="SENT",
                )
            )

        if self._is_student():
            # Students see their own notifications plus published
            # global announcements, never another learner's messages.
            queryset = queryset.filter(
                Q(student__user=self.request.user)
                | Q(
                    school__isnull=True,
                    recipient_type="ALL",
                    channel="IN_APP",
                    status="SENT",
                )
            )
        else:
            student = self.request.query_params.get("student")
            if student:
                queryset = queryset.filter(student_id=student)

            recipient_type = self.request.query_params.get(
                "recipient_type"
            )
            if recipient_type:
                queryset = queryset.filter(
                    recipient_type=recipient_type
                )

            channel = self.request.query_params.get("channel")
            if channel:
                queryset = queryset.filter(channel=channel)

            notification_status = self.request.query_params.get(
                "status"
            )
            if notification_status:
                queryset = queryset.filter(
                    status=notification_status
                )

        return queryset.order_by("-created_at", "-id")

    def perform_create(self, serializer):
        is_global = self._requests_global_announcement()

        if is_global:
            if not (
                self.request.user.is_superuser
                or getattr(
                    getattr(self.request.user, "profile", None),
                    "role",
                    None,
                ) == "PLATFORM_ADMIN"
            ):
                raise PermissionDenied(
                    "Only platform administrators can publish "
                    "global announcements."
                )

            serializer.save(
                school=None,
                student=None,
                recipient_type="ALL",
                recipient="ALL",
                channel="IN_APP",
                status="SENT",
                sent_at=timezone.now(),
            )
            return

        school = self.get_school()

        if school is None:
            raise PermissionDenied(
                "A school must be associated with this notification."
            )

        serializer.save(school=school)
