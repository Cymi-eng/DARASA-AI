from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

from rest_framework import serializers

from ..models import Teacher


User = get_user_model()


class UserAccountSerializer(serializers.ModelSerializer):
    """
    Serializer used by school administrators to manage user accounts.
    """

    password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=False,
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "password",
        ]
        read_only_fields = [
            "id",
        ]

    def create(self, validated_data):
        password = validated_data.pop(
            "password",
            None,
        )

        user = User(**validated_data)

        if password:
            user.set_password(password)

        user.save()

        return user

    def update(self, instance, validated_data):
        password = validated_data.pop(
            "password",
            None,
        )

        for field, value in validated_data.items():
            setattr(instance, field, value)

        if password:
            instance.set_password(password)

        instance.save()

        return instance


class StudentAccountSettingsSerializer(
    serializers.Serializer
):
    """
    Allows an authenticated student to update
    their own username and/or password.
    """

    username = serializers.CharField(
        required=False,
        min_length=3,
        max_length=150,
    )

    current_password = serializers.CharField(
        required=False,
        write_only=True,
        allow_blank=False,
    )

    new_password = serializers.CharField(
        required=False,
        write_only=True,
        min_length=8,
        allow_blank=False,
    )

    def validate_username(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Username cannot be empty."
            )

        queryset = User.objects.filter(
            username__iexact=value
        )

        if self.instance is not None:
            queryset = queryset.exclude(
                pk=self.instance.pk
            )

        if queryset.exists():
            raise serializers.ValidationError(
                "That username is already in use."
            )

        return value

    def validate(self, attrs):
        current_password = attrs.get(
            "current_password"
        )

        new_password = attrs.get(
            "new_password"
        )

        username = attrs.get(
            "username"
        )

        changing_password = bool(
            new_password
        )

        changing_username = (
            username is not None
            and username != self.instance.username
        )

        if not changing_password and not changing_username:
            raise serializers.ValidationError(
                "No account changes were requested."
            )

        if changing_password:
            if not current_password:
                raise serializers.ValidationError(
                    {
                        "current_password": (
                            "Enter your current password."
                        )
                    }
                )

            if not self.instance.check_password(
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
                self.instance,
            )

        elif changing_username:
            if current_password:
                if not self.instance.check_password(
                    current_password
                ):
                    raise serializers.ValidationError(
                        {
                            "current_password": (
                                "Your current password is incorrect."
                            )
                        }
                    )

        return attrs

    def update(self, instance, validated_data):
        new_username = validated_data.get(
            "username"
        )

        new_password = validated_data.get(
            "new_password"
        )

        if new_username:
            instance.username = new_username

        if new_password:
            instance.set_password(
                new_password
            )

        instance.save()

        return instance


class TeacherSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = Teacher
        fields = "__all__"