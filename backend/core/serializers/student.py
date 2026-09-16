from rest_framework import serializers

from ..models import Student, School


class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = [
            "id",
            "first_name",
            "last_name",
            "admission_number",
            "grade",
            "date_of_birth",
            "guardian_name",
            "guardian_phone",
            "school",
            "classroom",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
        ]

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

        school = attrs.get("school")

        if school and school.id != profile.school_id:
            raise serializers.ValidationError(
                {
                    "school": (
                        "You cannot create or assign a "
                        "student to another school."
                    )
                }
            )

        classroom = attrs.get("classroom")

        if classroom and classroom.school_id != profile.school_id:
            raise serializers.ValidationError(
                {
                    "classroom": (
                        "Classroom does not belong "
                        "to your school."
                    )
                }
            )

        return attrs