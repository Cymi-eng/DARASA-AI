from rest_framework import serializers

from .models import (
    Student,
    Competency,
    School,
    ClassRoom,
    Teacher,
    FeePayment,
)


def get_user_school(user):
    """
    Return the school belonging to the authenticated user.

    Superusers are not restricted to a school.
    """
    if user.is_superuser:
        return None

    profile = getattr(user, "profile", None)

    if not profile or not profile.school_id:
        raise serializers.ValidationError(
            "Authenticated user is not assigned to a school."
        )

    return profile.school


class CompetencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Competency
        fields = "__all__"

    def validate_student(self, student):
        school = get_user_school(self.context["request"].user)

        if school is not None and student.school_id != school.id:
            raise serializers.ValidationError(
                "Student does not belong to your school."
            )

        return student


class FeePaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeePayment
        fields = "__all__"

    def validate_student(self, student):
        school = get_user_school(self.context["request"].user)

        if school is not None and student.school_id != school.id:
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

    def validate_school(self, school):
        user = self.context["request"].user

        if user.is_superuser:
            return school

        user_school = get_user_school(user)

        if school.id != user_school.id:
            raise serializers.ValidationError(
                "You cannot assign a student to another school."
            )

        return school

    def validate_classroom(self, classroom):
        school = get_user_school(self.context["request"].user)

        if school is not None and classroom.school_id != school.id:
            raise serializers.ValidationError(
                "Classroom does not belong to your school."
            )

        return classroom


class ClassRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassRoom
        fields = "__all__"

    def validate_school(self, school):
        user = self.context["request"].user

        if user.is_superuser:
            return school

        user_school = get_user_school(user)

        if school.id != user_school.id:
            raise serializers.ValidationError(
                "You cannot assign a classroom to another school."
            )

        return school


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

    def validate_school(self, school):
        user = self.context["request"].user

        if user.is_superuser:
            return school

        user_school = get_user_school(user)

        if school.id != user_school.id:
            raise serializers.ValidationError(
                "You cannot assign a teacher to another school."
            )

        return school

    def validate_classroom(self, classrooms):
        school = get_user_school(self.context["request"].user)

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