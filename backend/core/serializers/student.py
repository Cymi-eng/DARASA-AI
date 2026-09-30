from rest_framework import permissions

from ..models import Student, UserProfile
from ..permissions import (
IsAdminOrTeacher,
IsSchoolAdmin,
IsStudent,
)
from ..serializers import StudentSerializer
from .base import SchoolScopedViewSet

class StudentViewSet(SchoolScopedViewSet):
queryset = Student.objects.all()
serializer_class = StudentSerializer


def _is_student(self):
    user = self.request.user

    if not user.is_authenticated:
        return False

    profile = getattr(user, "profile", None)

    return (
        profile is not None
        and profile.role == UserProfile.STUDENT
    )

def get_permissions(self):
    user = self.request.user

    if self._is_student():
        if self.request.method in permissions.SAFE_METHODS:
            return [IsStudent()]

        return [permissions.IsAdminUser()]

    if self.request.method in permissions.SAFE_METHODS:
        return [IsAdminOrTeacher()]

    return [IsSchoolAdmin()]

def get_queryset(self):
    user = self.request.user

    queryset = (
        Student.objects
        .select_related(
            "user",
            "school",
            "classroom",
        )
        .prefetch_related(
            "classroom__teachers",
        )
    )

    if user.is_superuser:
        filtered = queryset
    else:
        profile = getattr(user, "profile", None)

        if profile is None:
            return queryset.none()

        if profile.role == UserProfile.STUDENT:
            filtered = queryset.filter(
                user=user,
            )

        elif profile.role == UserProfile.TEACHER:
            filtered = queryset.filter(
                school_id=profile.school_id,
                classroom__teachers__user=user,
            )

        else:
            filtered = queryset.filter(
                school_id=profile.school_id,
            )

    grade = self.request.query_params.get("grade")

    if grade:
        filtered = filtered.filter(
            grade=grade,
        )

    classroom = self.request.query_params.get(
        "classroom"
    )

    if classroom:
        filtered = filtered.filter(
            classroom_id=classroom,
        )

    return filtered.order_by(
        "first_name",
        "last_name",
    )

def perform_create(self, serializer):
    school = self.get_school()

    if school is None and not self.request.user.is_superuser:
        raise permissions.PermissionDenied(
            "Your account is not assigned to a school."
        )

    serializer.save(
        school=school,
    )

