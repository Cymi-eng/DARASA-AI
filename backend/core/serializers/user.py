from django.contrib.auth import get_user_model
from django.db import transaction

from rest_framework import serializers

from ..models import School, UserProfile, Teacher, ClassRoom


User = get_user_model()


class UserAccountSerializer(serializers.ModelSerializer):
    school = serializers.PrimaryKeyRelatedField(
        source="profile.school",
        queryset=School.objects.all(),
        required=False,
        allow_null=True,
    )

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

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "password",
            "school",
            "role",
        ]
        read_only_fields = ["id"]

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

        profile_data = attrs.get("profile", {})
        requested_school = profile_data.get("school")

        if requested_school and requested_school.id != profile.school_id:
            raise serializers.ValidationError(
                {
                    "school": (
                        "You cannot assign a user "
                        "to another school."
                    )
                }
            )

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        profile_data = validated_data.pop("profile", {})

        password = validated_data.pop("password", None)
        role = validated_data.pop(
            "role",
            UserProfile.ROLE_TEACHER,
        )

        school = profile_data.get("school")

        request = self.context.get("request")

        if school is None and request:
            request_profile = getattr(
                request.user,
                "profile",
                None,
            )

            if request_profile and request_profile.school_id:
                school = request_profile.school

        if not password:
            raise serializers.ValidationError(
                {
                    "password": (
                        "Password is required when "
                        "creating a user."
                    )
                }
            )

        user = User(**validated_data)
        user.set_password(password)
        user.save()

        UserProfile.objects.create(
            user=user,
            school=school,
            role=role,
        )

        if role == UserProfile.ROLE_TEACHER:
            if school is None:
                raise serializers.ValidationError(
                    {
                        "school": (
                            "A school is required when "
                            "creating a teacher."
                        )
                    }
                )

            Teacher.objects.create(
                user=user,
                school=school,
            )

        return user

    @transaction.atomic
    def update(self, instance, validated_data):
        profile_data = validated_data.pop("profile", {})

        password = validated_data.pop("password", None)

        role = validated_data.pop(
            "role",
            None,
        )

        school = profile_data.get("school")

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()

        profile = instance.profile

        if school is not None:
            profile.school = school

        if role:
            profile.role = role

        profile.save()

        if role == UserProfile.ROLE_TEACHER:
            Teacher.objects.get_or_create(
                user=instance,
                defaults={
                    "school": profile.school,
                },
            )

        elif role and role != UserProfile.ROLE_TEACHER:
            Teacher.objects.filter(
                user=instance
            ).delete()

        return instance


class TeacherSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
    )

    classrooms = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=ClassRoom.objects.all(),
        required=False,
    )

    school = serializers.PrimaryKeyRelatedField(
        read_only=True,
    )

    class Meta:
        model = Teacher
        fields = [
            "id",
            "user",
            "school",
            "classrooms",
            "phone",
        ]
        read_only_fields = [
            "id",
            "school",
        ]

    def validate(self, attrs):
        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError(
                "Authentication is required."
            )

        school = (
            None
            if request.user.is_superuser
            else request.user.profile.school
        )

        user = attrs.get("user")

        if school and user:
            user_profile = getattr(
                user,
                "profile",
                None,
            )

            if (
                not user_profile
                or user_profile.school_id != school.id
            ):
                raise serializers.ValidationError(
                    {
                        "user": (
                            "Teacher user must belong "
                            "to your school."
                        )
                    }
                )

        classrooms = attrs.get("classrooms", [])

        if school:
            invalid_classrooms = [
                classroom.id
                for classroom in classrooms
                if classroom.school_id != school.id
            ]

            if invalid_classrooms:
                raise serializers.ValidationError(
                    {
                        "classrooms": (
                            "All classrooms must belong "
                            "to your school."
                        )
                    }
                )

        return attrs