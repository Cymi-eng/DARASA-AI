from django.contrib.auth.models import User
from rest_framework import serializers

from ..models import Student, School, UserProfile


class StudentSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Student
        fields = [
            "id",
            "user",
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

        if (
            classroom
            and classroom.school_id != profile.school_id
        ):
            raise serializers.ValidationError(
                {
                    "classroom": (
                        "Classroom does not belong "
                        "to your school."
                    )
                }
            )

        student_user = attrs.get("user")

        if student_user:
            student_profile = getattr(
                student_user,
                "profile",
                None,
            )

            if not student_profile:
                raise serializers.ValidationError(
                    {
                        "user": (
                            "The selected user does not "
                            "have a user profile."
                        )
                    }
                )

            if student_profile.role != UserProfile.STUDENT:
                raise serializers.ValidationError(
                    {
                        "user": (
                            "The selected user must have "
                            "the STUDENT role."
                        )
                    }
                )

            if (
                student_profile.school_id
                != profile.school_id
            ):
                raise serializers.ValidationError(
                    {
                        "user": (
                            "Student user must belong "
                            "to your school."
                        )
                    }
                )

            existing_student = (
                Student.objects.filter(
                    user=student_user
                )
                .exclude(
                    pk=self.instance.pk
                    if self.instance
                    else None
                )
                .first()
            )

            if existing_student:
                raise serializers.ValidationError(
                    {
                        "user": (
                            "This user is already linked "
                            "to another student."
                        )
                    }
                )

        return attrs