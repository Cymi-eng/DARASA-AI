from django.contrib.auth import get_user_model
from django.db import transaction

from rest_framework import serializers

from ..models import (
    School,
    UserProfile,
    Teacher,
    ClassRoom,
    Student,
)


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

    student = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(),
        required=False,
        allow_null=True,
        write_only=True,
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
            "student",
        ]
        read_only_fields = ["id"]

    def validate(self, attrs):
        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError(
                "Authentication is required."
            )

        profile_data = attrs.get("profile", {})
        requested_school = profile_data.get("school")
        selected_student = attrs.get("student")

        current_role = (
            self.instance.profile.role
            if self.instance is not None
            else UserProfile.ROLE_TEACHER
        )

        requested_role = attrs.get(
            "role",
            current_role,
        )

        if request.user.is_superuser:
            school = requested_school

            if school is None and self.instance is not None:
                school = self.instance.profile.school

        else:
            profile = getattr(
                request.user,
                "profile",
                None,
            )

            if not profile or not profile.school_id:
                raise serializers.ValidationError(
                    "Your account is not associated with a school."
                )

            school = profile.school

            if (
                requested_school
                and requested_school.id != profile.school_id
            ):
                raise serializers.ValidationError(
                    {
                        "school": (
                            "You cannot assign a user "
                            "to another school."
                        )
                    }
                )

        if selected_student is not None:
            if requested_role != UserProfile.ROLE_STUDENT:
                raise serializers.ValidationError(
                    {
                        "student": (
                            "A student record can only be "
                            "linked to a STUDENT account."
                        )
                    }
                )

            if school is None:
                raise serializers.ValidationError(
                    {
                        "student": (
                            "A school is required when "
                            "linking a student account."
                        )
                    }
                )

            if selected_student.school_id != school.id:
                raise serializers.ValidationError(
                    {
                        "student": (
                            "The selected student does not "
                            "belong to this school."
                        )
                    }
                )

            existing_link = (
                Student.objects
                .filter(user=selected_student.user)
                .exclude(pk=selected_student.pk)
                .first()
                if selected_student.user_id
                else None
            )

            if existing_link:
                raise serializers.ValidationError(
                    {
                        "student": (
                            "The selected student user is "
                            "already linked to another student."
                        )
                    }
                )

            if (
                selected_student.user_id
                and self.instance is not None
                and selected_student.user_id != self.instance.pk
            ):
                raise serializers.ValidationError(
                    {
                        "student": (
                            "The selected student is already "
                            "linked to another user account."
                        )
                    }
                )

        if (
            requested_role == UserProfile.ROLE_STUDENT
            and self.instance is None
            and selected_student is None
        ):
            raise serializers.ValidationError(
                {
                    "student": (
                        "A student record is required when "
                        "creating a STUDENT account."
                    )
                }
            )

        if (
            requested_role == UserProfile.ROLE_STUDENT
            and self.instance is not None
            and selected_student is None
            and not hasattr(self.instance, "student_record")
        ):
            raise serializers.ValidationError(
                {
                    "student": (
                        "A student record is required when "
                        "converting an account to STUDENT."
                    )
                }
            )

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        profile_data = validated_data.pop(
            "profile",
            {},
        )

        selected_student = validated_data.pop(
            "student",
            None,
        )

        password = validated_data.pop(
            "password",
            None,
        )

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

            if (
                request_profile
                and request_profile.school_id
            ):
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

        if role == UserProfile.ROLE_STUDENT:
            if selected_student is None:
                raise serializers.ValidationError(
                    {
                        "student": (
                            "A student record is required "
                            "for a STUDENT account."
                        )
                    }
                )

            selected_student.user = user
            selected_student.save(
                update_fields=["user"]
            )

        return user

    @transaction.atomic
    def update(self, instance, validated_data):
        profile_data = validated_data.pop(
            "profile",
            {},
        )

        selected_student = validated_data.pop(
            "student",
            None,
        )

        password = validated_data.pop(
            "password",
            None,
        )

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

        previous_role = profile.role

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

        if role == UserProfile.ROLE_STUDENT:
            current_student = getattr(
                instance,
                "student_record",
                None,
            )

            if selected_student is not None:
                if (
                    current_student is not None
                    and current_student.pk != selected_student.pk
                ):
                    current_student.user = None
                    current_student.save(
                        update_fields=["user"]
                    )

                selected_student.user = instance
                selected_student.save(
                    update_fields=["user"]
                )

        elif (
            role
            and previous_role == UserProfile.ROLE_STUDENT
            and role != UserProfile.ROLE_STUDENT
        ):
            current_student = getattr(
                instance,
                "student_record",
                None,
            )

            if current_student is not None:
                current_student.user = None
                current_student.save(
                    update_fields=["user"]
                )

        return instance


class StudentRegistrationSerializer(serializers.Serializer):
    admission_number = serializers.CharField(
        max_length=50,
    )

    first_name = serializers.CharField(
        max_length=150,
    )

    last_name = serializers.CharField(
        max_length=150,
    )

    date_of_birth = serializers.DateField(
        required=False,
        allow_null=True,
    )

    guardian_phone = serializers.CharField(
        max_length=30,
    )

    username = serializers.CharField(
        max_length=150,
    )

    password = serializers.CharField(
        write_only=True,
        min_length=8,
    )

    def validate_username(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Username is required."
            )

        if User.objects.filter(
            username__iexact=value
        ).exists():
            raise serializers.ValidationError(
                "This username is already in use."
            )

        return value

    def validate(self, attrs):
        admission_number = attrs[
            "admission_number"
        ].strip()

        first_name = attrs[
            "first_name"
        ].strip()

        last_name = attrs[
            "last_name"
        ].strip()

        guardian_phone = attrs[
            "guardian_phone"
        ].strip()

        date_of_birth = attrs.get(
            "date_of_birth"
        )

        student = (
            Student.objects
            .select_related(
                "school",
                "user",
            )
            .filter(
                admission_number__iexact=admission_number
            )
            .first()
        )

        if student is None:
            raise serializers.ValidationError(
                {
                    "admission_number": (
                        "No student record was found "
                        "with this admission number."
                    )
                }
            )

        if student.user_id:
            raise serializers.ValidationError(
                {
                    "admission_number": (
                        "This student already has "
                        "an account."
                    )
                }
            )

        if (
            student.first_name.strip().lower()
            != first_name.lower()
        ):
            raise serializers.ValidationError(
                {
                    "first_name": (
                        "The first name does not match "
                        "the school record."
                    )
                }
            )

        if (
            student.last_name.strip().lower()
            != last_name.lower()
        ):
            raise serializers.ValidationError(
                {
                    "last_name": (
                        "The last name does not match "
                        "the school record."
                    )
                }
            )

        if (
            date_of_birth is not None
            and student.date_of_birth != date_of_birth
        ):
            raise serializers.ValidationError(
                {
                    "date_of_birth": (
                        "The date of birth does not match "
                        "the school record."
                    )
                }
            )

        if (
            student.guardian_phone
            and student.guardian_phone.strip()
            != guardian_phone
        ):
            raise serializers.ValidationError(
                {
                    "guardian_phone": (
                        "The guardian phone number does "
                        "not match the school record."
                    )
                }
            )

        attrs["admission_number"] = (
            admission_number
        )

        attrs["first_name"] = first_name
        attrs["last_name"] = last_name
        attrs["guardian_phone"] = guardian_phone
        attrs["student"] = student

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        student = validated_data.pop(
            "student"
        )

        validated_data.pop(
            "admission_number"
        )

        validated_data.pop(
            "date_of_birth",
            None,
        )

        validated_data.pop(
            "guardian_phone"
        )

        password = validated_data.pop(
            "password"
        )

        user = User.objects.create_user(
            username=validated_data["username"],
            password=password,
            first_name=validated_data[
                "first_name"
            ],
            last_name=validated_data[
                "last_name"
            ],
        )

        UserProfile.objects.create(
            user=user,
            school=student.school,
            role=UserProfile.ROLE_STUDENT,
        )

        student.user = user

        student.save(
            update_fields=["user"]
        )

        return user


class TeacherSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
    )

    user_first_name = serializers.CharField(
        source="user.first_name",
        read_only=True,
    )

    user_last_name = serializers.CharField(
        source="user.last_name",
        read_only=True,
    )

    username = serializers.CharField(
        source="user.username",
        read_only=True,
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
            "user_first_name",
            "user_last_name",
            "username",
            "school",
            "classrooms",
            "phone",
        ]

        read_only_fields = [
            "id",
            "school",
            "user_first_name",
            "user_last_name",
            "username",
        ]

    def validate(self, attrs):
        request = self.context.get("request")

        if (
            not request
            or not request.user.is_authenticated
        ):
            raise serializers.ValidationError(
                "Authentication is required."
            )

        if request.user.is_superuser:
            school = None

        else:
            profile = getattr(
                request.user,
                "profile",
                None,
            )

            if (
                not profile
                or not profile.school_id
            ):
                raise serializers.ValidationError(
                    "Your account is not associated "
                    "with a school."
                )

            school = profile.school

        user = attrs.get("user")

        if user is not None:
            user_profile = getattr(
                user,
                "profile",
                None,
            )

            if not user_profile:
                raise serializers.ValidationError(
                    {
                        "user": (
                            "The selected user does not "
                            "have a user profile."
                        )
                    }
                )

            if (
                user_profile.role
                != UserProfile.ROLE_TEACHER
            ):
                raise serializers.ValidationError(
                    {
                        "user": (
                            "The selected user must have "
                            "the TEACHER role."
                        )
                    }
                )

            if school is not None:
                if (
                    user_profile.school_id
                    != school.id
                ):
                    raise serializers.ValidationError(
                        {
                            "user": (
                                "Teacher user must belong "
                                "to your school."
                            )
                        }
                    )

        classrooms = attrs.get(
            "classrooms",
            [],
        )

        if school is not None:
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