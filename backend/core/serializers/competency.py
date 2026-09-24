from django.utils import timezone

from rest_framework import serializers

from ..models import Competency


class CompetencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Competency
        fields = [
            "id",
            "student",
            "learning_area",
            "strand",
            "sub_strand",
            "mastery_level",
            "assessed_on",
            "teacher_notes",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
        ]

    def validate_learning_area(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Learning area cannot be empty."
            )

        return value

    def validate_strand(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Strand cannot be empty."
            )

        return value

    def validate_sub_strand(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Sub-strand cannot be empty."
            )

        return value

    def validate_assessed_on(self, value):
        today = timezone.localdate()

        if value > today:
            raise serializers.ValidationError(
                "Assessment date cannot be in the future."
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

        profile = getattr(request.user, "profile", None)

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