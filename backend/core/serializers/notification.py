from rest_framework import serializers

from ..models import Notification


class NotificationSerializer(serializers.ModelSerializer):
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

    def validate_recipient(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Notification recipient is required."
            )

        return value

    def validate(self, attrs):
        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError(
                "Authentication is required."
            )

        if request.user.is_superuser:
            return attrs

        profile = getattr(
            request.user,
            "profile",
            None,
        )

        if not profile or not profile.school_id:
            raise serializers.ValidationError(
                "Your account is not associated with a school."
            )

        school = attrs.get("school")

        if school and school.id != profile.school_id:
            raise serializers.ValidationError(
                {
                    "school": (
                        "Notification does not belong "
                        "to your school."
                    )
                }
            )

        student = attrs.get("student")

        if (
            student
            and student.school_id != profile.school_id
        ):
            raise serializers.ValidationError(
                {
                    "student": (
                        "Student does not belong "
                        "to your school."
                    )
                }
            )

        return attrs