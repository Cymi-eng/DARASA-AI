from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import (
    Student,
    Competency,
    School,
    ClassRoom,
    Teacher,
    FeePayment,
    UserProfile,
)


User = get_user_model()


def get_user_school(user):
    if user.is_superuser:
        return None

    profile = getattr(user, "profile", None)

    if not profile or not profile.school_id:
        raise serializers.ValidationError(
            "Authenticated user is not assigned to a school."
        )

    return profile.school


class UserAccountSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        required=False,
        min_length=8,
    )

    role = serializers.ChoiceField(
        choices=UserProfile.ROLE_CHOICES,
        write_only=True,
    )

    school = serializers.PrimaryKeyRelatedField(
        read_only=True,
        source="profile.school",
    )

    phone = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
    )

    class Meta:
        model = User

        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
            "role",
            "school",
            "phone",
            "is_active",
            "date_joined",
        ]

        read_only_fields = [
            "id",
            "school",
            "date_joined",
        ]

    def validate_role(self, role):

        allowed_roles = {
            UserProfile.ROLE_ADMIN,
            UserProfile.ROLE_TEACHER,
            UserProfile.ROLE_BURSAR,
        }

        if role not in allowed_roles:
            raise serializers.ValidationError(
                "Student accounts are created through student management."
            )

        return role

    def validate_username(self, username):

        queryset = User.objects.filter(
            username=username
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

    def create(self, validated_data):

        role = validated_data.pop("role")
        phone = validated_data.pop("phone", "")
        password = validated_data.pop("password", None)

        request = self.context["request"]

        school = get_user_school(
            request.user
        )

        if school is None:
            raise serializers.ValidationError(
                "A school is required when creating a school user."
            )

        user = User.objects.create_user(
            password=password,
            **validated_data,
        )

        UserProfile.objects.create(
            user=user,
            school=school,
            role=role,
        )

        if role == UserProfile.ROLE_TEACHER:

            Teacher.objects.create(
                user=user,
                school=school,
                phone=phone,
            )

        return user

    def update(self, instance, validated_data):

        role = validated_data.pop(
            "role",
            None,
        )

        password = validated_data.pop(
            "password",
            None,
        )

        phone = validated_data.pop(
            "phone",
            None,
        )

        for attr, value in validated_data.items():

            setattr(
                instance,
                attr,
                value,
            )

        if password:

            instance.set_password(
                password
            )

        instance.save()

        if phone is not None:

            teacher = Teacher.objects.filter(
                user=instance
            ).first()

            if teacher:

                teacher.phone = phone
                teacher.save()

        if role is not None:

            instance.profile.role = role
            instance.profile.save()

            if role == UserProfile.ROLE_TEACHER:

                Teacher.objects.get_or_create(
                    user=instance,
                    defaults={
                        "school": instance.profile.school,
                    },
                )

            else:

                Teacher.objects.filter(
                    user=instance
                ).delete()

        return instance


class CompetencySerializer(serializers.ModelSerializer):

    class Meta:
        model = Competency
        fields = "__all__"

    def validate_student(self, student):

        school = get_user_school(
            self.context["request"].user
        )

        if (
            school is not None
            and student.school_id != school.id
        ):

            raise serializers.ValidationError(
                "Student does not belong to your school."
            )

        return student


class FeePaymentSerializer(serializers.ModelSerializer):

    class Meta:
        model = FeePayment
        fields = "__all__"

    def validate_student(self, student):

        school = get_user_school(
            self.context["request"].user
        )

        if (
            school is not None
            and student.school_id != school.id
        ):

            raise serializers.ValidationError(
                "Student does not belong to your school."
            )

        return student


class StudentSerializer(serializers.ModelSerializer):

    competencies = CompetencySerializer(
        many=True,
        read_only=True,
    )

    fee_payments = FeePaymentSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Student
        fields = "__all__"

        read_only_fields = [
            "created_at",
        ]

    def validate(self, attrs):

        request = self.context.get(
            "request"
        )

        if (
            not request
            or not request.user.is_authenticated
        ):

            return attrs

        school = get_user_school(
            request.user
        )

        if school is None:
            return attrs

        submitted_school = attrs.get(
            "school"
        )

        if submitted_school is not None:

            if submitted_school.id != school.id:

                raise serializers.ValidationError(
                    {
                        "school": (
                            "You cannot create or assign "
                            "a student to another school."
                        )
                    }
                )

        return attrs

    def validate_classroom(self, classroom):

        school = get_user_school(
            self.context["request"].user
        )

        if (
            school is not None
            and classroom.school_id != school.id
        ):

            raise serializers.ValidationError(
                "Classroom does not belong to your school."
            )

        return classroom


class ClassRoomSerializer(serializers.ModelSerializer):

    class Meta:
        model = ClassRoom
        fields = "__all__"

        read_only_fields = [
            "school",
        ]


class SchoolSerializer(serializers.ModelSerializer):

    classrooms = ClassRoomSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = School
        fields = "__all__"


class TeacherSerializer(serializers.ModelSerializer):

    class Meta:
        model = Teacher
        fields = "__all__"

        read_only_fields = [
            "school",
        ]

    def validate_classrooms(self, classrooms):

        school = get_user_school(
            self.context["request"].user
        )

        if school is None:
            return classrooms

        invalid_classrooms = classrooms.exclude(
            school=school
        )

        if invalid_classrooms.exists():

            raise serializers.ValidationError(
                "Teacher cannot be assigned to classrooms "
                "from another school."
            )

        return classrooms