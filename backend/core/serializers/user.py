from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction

from rest_framework import serializers

from ..models import Teacher, UserProfile


User = get_user_model()


class UserAccountSerializer(serializers.ModelSerializer):
    role = serializers.ChoiceField(
        choices=UserProfile.ROLE_CHOICES,
        write_only=True,
        required=False,
    )

    password = serializers.CharField(
        write_only=True,
        required=False,
        min_length=8,
    )

    school = serializers.PrimaryKeyRelatedField(
        source="profile.school",
        read_only=True,
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "password",
            "role",
            "school",
            "is_active",
        ]
        read_only_fields = [
            "id",
            "school",
        ]
        extra_kwargs = {
            "username": {
                "required": True,
            },
        }

    def validate_username(self, value):
        username = value.strip()

        if not username:
            raise serializers.ValidationError(
                "Username cannot be empty."
            )

        queryset = User.objects.filter(
            username__iexact=username
        )

        if self.instance:
            queryset = queryset.exclude(
                pk=self.instance.pk
            )

        if queryset.exists():
            raise serializers.ValidationError(
                "A user with this username already exists."
            )

        return username

    def validate_password(self, value):
        validate_password(
            value,
            self.instance,
        )
        return value

    @transaction.atomic
    def create(self, validated_data):
        role = validated_data.pop(
            "role",
            UserProfile.Role.STUDENT,
        )

        password = validated_data.pop(
            "password",
            None,
        )

        profile_data = validated_data.pop(
            "profile",
            {},
        )

        user = User.objects.create(
            **validated_data
        )

        if password:
            user.set_password(password)
            user.save(update_fields=["password"])

        UserProfile.objects.create(
            user=user,
            role=role,
            **profile_data,
        )

        if role == UserProfile.Role.TEACHER:
            Teacher.objects.get_or_create(
                user=user,
                defaults={
                    "school": profile_data.get("school"),
                },
            )

        return user

    @transaction.atomic
    def update(self, instance, validated_data):
        validated_data.pop(
            "profile",
            None,
        )

        role = validated_data.pop(
            "role",
            None,
        )

        password = validated_data.pop(
            "password",
            None,
        )

        for attr, value in validated_data.items():
            setattr(
                instance,
                attr,
                value,
            )

        if password:
            instance.set_password(password)

        instance.save()

        if role:
            profile = instance.profile
            profile.role = role
            profile.save(update_fields=["role"])

        return instance


class StudentAccountSettingsSerializer(serializers.Serializer):
    """
    Self-service account settings for authenticated students.

    Students can change:
    - username
    - password

    Students cannot change:
    - role
    - school
    - student record
    - email
    - another user's account
    """

    username = serializers.CharField(
        required=False,
        allow_blank=False,
        max_length=150,
    )

    current_password = serializers.CharField(
        required=False,
        allow_blank=False,
        write_only=True,
        trim_whitespace=False,
    )

    new_password = serializers.CharField(
        required=False,
        allow_blank=False,
        write_only=True,
        trim_whitespace=False,
        min_length=8,
    )

    def validate_username(self, value):
        user = self.context["request"].user

        username = value.strip()

        if not username:
            raise serializers.ValidationError(
                "Username cannot be empty."
            )

        queryset = User.objects.filter(
            username__iexact=username
        ).exclude(
            pk=user.pk
        )

        if queryset.exists():
            raise serializers.ValidationError(
                "This username is already in use."
            )

        return username

    def validate(self, attrs):
        user = self.context["request"].user

        username = attrs.get("username")
        current_password = attrs.get(
            "current_password"
        )
        new_password = attrs.get(
            "new_password"
        )

        if not username and not new_password:
            raise serializers.ValidationError(
                "Provide a username or a new password to update."
            )

        if new_password:
            if not current_password:
                raise serializers.ValidationError(
                    {
                        "current_password": (
                            "Your current password is required "
                            "when changing your password."
                        )
                    }
                )

            if not user.check_password(
                current_password
            ):
                raise serializers.ValidationError(
                    {
                        "current_password": (
                            "Your current password is incorrect."
                        )
                    }
                )

            validate_password(
                new_password,
                user=user,
            )

        return attrs

    @transaction.atomic
    def update(self, instance, validated_data):
        username = validated_data.get(
            "username"
        )
        new_password = validated_data.get(
            "new_password"
        )

        update_fields = []

        if username:
            instance.username = username
            update_fields.append("username")

        if new_password:
            instance.set_password(
                new_password
            )
            update_fields.append("password")

        if update_fields:
            instance.save(
                update_fields=update_fields
            )

        return instance

    def create(self, validated_data):
        raise NotImplementedError(
            "StudentAccountSettingsSerializer "
            "is for updates only."
        )


class TeacherSerializer(serializers.ModelSerializer):
    user = UserAccountSerializer(
        read_only=True
    )

    classrooms = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=__import__(
            "core.models",
            fromlist=["ClassRoom"],
        ).ClassRoom.objects.all(),
        required=False,
    )

    class Meta:
        model = Teacher
        fields = [
            "id",
            "user",
            "school",
            "phone",
            "classrooms",
        ]
        read_only_fields = [
            "id",
            "user",
            "school",
        ]