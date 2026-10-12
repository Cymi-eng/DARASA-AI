
from rest_framework import serializers

from ..models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    recipient = serializers.CharField(
        required=False,
        allow_blank=True,
    )

    class Meta:
        model = Notification
        fields = [
            "id",
            "school",
            "student",
            "recipient_type",
            "recipient",
            "channel",
            "subject",
            "message",
            "status",
            "provider_message_id",
            "failure_reason",
            "sent_at",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "school",
            "status",
            "provider_message_id",
            "failure_reason",
            "sent_at",
            "created_at",
            "updated_at",
        ]

    def validate_message(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Notification message cannot be empty."
            )

        return value

    def validate(self, attrs):
        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError(
                "Authentication is required."
            )

        user = request.user
        profile = getattr(user, "profile", None)
        is_platform_admin = (
            user.is_superuser
            or (
                profile is not None
                and profile.role == "PLATFORM_ADMIN"
            )
        )

        recipient_type = attrs.get("recipient_type")
        channel = attrs.get("channel")
        student = attrs.get("student")

        is_global = (
            recipient_type == "ALL"
            or channel == "IN_APP"
        )

        if is_global:
            if not is_platform_admin:
                raise serializers.ValidationError(
                    "Only platform administrators can publish "
                    "global announcements."
                )

            if student is not None:
                raise serializers.ValidationError(
                    {
                        "student": (
                            "A global announcement cannot target "
                            "a single student."
                        )
                    }
                )

            # The view sets the global announcement's final values.
            attrs["recipient_type"] = "ALL"
            attrs["recipient"] = "ALL"
            attrs["channel"] = "IN_APP"
            return attrs

        if not user.is_superuser:
            if not profile or not profile.school_id:
                raise serializers.ValidationError(
                    "Your account must be associated with a school "
                    "to create school notifications."
                )

            if student and student.school_id != profile.school_id:
                raise serializers.ValidationError(
                    {
                        "student": (
                            "Student does not belong to your school."
                        )
                    }
                )

        if not attrs.get("recipient", "").strip():
            raise serializers.ValidationError(
                {
                    "recipient": (
                        "Notification recipient is required."
                    )
                }
            )

        if student:
            school = (
                profile.school
                if profile and profile.school_id
                else None
            )

            if school and student.school_id != school.id:
                raise serializers.ValidationError(
                    {
                        "student": (
                            "Student must belong to the "
                            "notification school."
                        )
                    }
                )

        return attrs
