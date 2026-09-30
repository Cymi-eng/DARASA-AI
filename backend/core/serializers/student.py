from django.contrib.auth import get_user_model
from rest_framework import serializers

from ..models import Student, UserProfile

User = get_user_model()


class StudentSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(
        read_only=True,
    )

    account_username = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
    )

    account_password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        min_length=8,
    )

    has_account = serializers.SerializerMethodField()

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
            "account_username",
            "account_password",
            "has_account",
        ]
        read_only_fields = [
            "id",
            "user",
            "has_account",
        ]

    def get_has_account(self, obj):
        return obj.user_id is not None

    def validate(self, attrs):
        request = self.context.get("request")

        if request is None or not request.user.is_authenticated:
            raise serializers.ValidationError(
                "Authentication is required."
            )

        user = request.user
        profile = getattr(user, "profile", None)

        if not user.is_superuser and profile is None:
            raise serializers.ValidationError(
                "Your account is not configured correctly."
            )

        account_username = attrs.get(
            "account_username"
        )

        account_password = attrs.get(
            "account_password"
        )

        if account_username == "":
            account_username = None
            attrs["account_username"] = None

        if account_password == "":
            account_password = None
            attrs["account_password"] = None

        # Only school administrators can create or modify
        # student login accounts.
        account_fields_supplied = (
            account_username is not None
            or account_password is not None
        )

        if account_fields_supplied:
            if (
                not user.is_superuser
                and profile.role != UserProfile.ADMIN
            ):
                raise serializers.ValidationError(
                    {
                        "account_username": (
                            "Only school administrators can manage "
                            "student login accounts."
                        )
                    }
                )

        instance = self.instance

        # Creating a new student account.
        if instance is None:
            if account_username and not account_password:
                raise serializers.ValidationError(
                    {
                        "account_password": (
                            "A password is required when creating "
                            "a student account."
                        )
                    }
                )

            if account_password and not account_username:
                raise serializers.ValidationError(
                    {
                        "account_username": (
                            "A username is required when creating "
                            "a student account."
                        )
                    }
                )

        # Adding an account to an existing student.
        elif instance.user_id is None:
            if account_username and not account_password:
                raise serializers.ValidationError(
                    {
                        "account_password": (
                            "A password is required when creating "
                            "a student account."
                        )
                    }
                )

            if account_password and not account_username:
                raise serializers.ValidationError(
                    {
                        "account_username": (
                            "A username is required when creating "
                            "a student account."
                        )
                    }
                )

        # Check username uniqueness.
        if account_username:
            existing_user = User.objects.filter(
                username=account_username
            )

            if instance and instance.user_id:
                existing_user = existing_user.exclude(
                    pk=instance.user_id
                )

            if existing_user.exists():
                raise serializers.ValidationError(
                    {
                        "account_username": (
                            "This username is already in use."
                        )
                    }
                )

        # ---------------------------------------------------------
        # SCHOOL ISOLATION
        # ---------------------------------------------------------
        # A school administrator may only create/update students
        # belonging to their own school.
        supplied_school = attrs.get("school")

        if (
            supplied_school is not None
            and not user.is_superuser
            and profile.role != UserProfile.STUDENT
            and profile.school_id != supplied_school.id
        ):
            raise serializers.ValidationError(
                {
                    "school": (
                        "You cannot create or manage a student "
                        "from another school."
                    )
                }
            )

        # ---------------------------------------------------------
        # TEACHER CLASSROOM SECURITY
        # ---------------------------------------------------------
        # Teachers may create students only inside classrooms
        # assigned to them.
        if (
            not user.is_superuser
            and profile.role == UserProfile.TEACHER
            and instance is None
        ):
            classroom = attrs.get("classroom")

            if classroom is None:
                raise serializers.ValidationError(
                    {
                        "classroom": (
                            "A teacher must assign the student "
                            "to a classroom."
                        )
                    }
                )

            if classroom.school_id != profile.school_id:
                raise serializers.ValidationError(
                    {
                        "classroom": (
                            "You cannot create a student in "
                            "another school's classroom."
                        )
                    }
                )

            if not classroom.teachers.filter(
                user=user
            ).exists():
                raise serializers.ValidationError(
                    {
                        "classroom": (
                            "You can only create students in "
                            "classrooms assigned to you."
                        )
                    }
                )

        return attrs

    def create(self, validated_data):
        account_username = validated_data.pop(
            "account_username",
            None,
        )

        account_password = validated_data.pop(
            "account_password",
            None,
        )

        student = Student.objects.create(
            **validated_data
        )

        if account_username and account_password:
            user = User.objects.create_user(
                username=account_username,
                password=account_password,
                first_name=student.first_name,
                last_name=student.last_name,
            )

            UserProfile.objects.create(
                user=user,
                school=student.school,
                role=UserProfile.STUDENT,
            )

            student.user = user
            student.save(
                update_fields=["user"]
            )

        return student

    def update(self, instance, validated_data):
        account_username = validated_data.pop(
            "account_username",
            None,
        )

        account_password = validated_data.pop(
            "account_password",
            None,
        )

        for attr, value in validated_data.items():
            setattr(
                instance,
                attr,
                value,
            )

        instance.save()

        if instance.user_id:
            user = instance.user

            if account_username:
                user.username = account_username

            if account_password:
                user.set_password(account_password)

            user.first_name = instance.first_name
            user.last_name = instance.last_name

            user.save()

            profile = getattr(
                user,
                "profile",
                None,
            )

            if profile is not None:
                profile.school = instance.school
                profile.save(
                    update_fields=["school"]
                )

        elif account_username and account_password:
            user = User.objects.create_user(
                username=account_username,
                password=account_password,
                first_name=instance.first_name,
                last_name=instance.last_name,
            )

            UserProfile.objects.create(
                user=user,
                school=instance.school,
                role=UserProfile.STUDENT,
            )

            instance.user = user
            instance.save(
                update_fields=["user"]
            )

        return instance

    def to_representation(self, instance):
        data = super().to_representation(instance)

        data["account_username"] = (
            instance.user.username
            if instance.user_id
            else None
        )

        data["has_account"] = instance.user_id is not None

        return data