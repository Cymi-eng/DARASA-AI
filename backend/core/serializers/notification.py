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
            self._validate_student_school(
                attrs
            )
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

        student = attrs.get("student")

        if student and student.school_id != profile.school_id:
            raise serializers.ValidationError(
                {
                    "student": (
                        "Student does not belong "
                        "to your school."
                    )
                }
            )

        return attrs

    def _validate_student_school(self, attrs):
        """
        Validate student/school consistency for
        superusers as well.
        """

        request = self.context.get("request")

        student = attrs.get("student")

        if not student:
            return

        school = attrs.get("school")

        if school and student.school_id != school.id:
            raise serializers.ValidationError(
                {
                    "student": (
                        "Student must belong to "
                        "the notification school."
                    )
                }
            )

        if (
            request
            and request.user.is_superuser
            and not school
        ):
            return