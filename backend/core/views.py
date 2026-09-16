from django.contrib.auth import get_user_model

from rest_framework import status, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from .models import (
    ClassRoom,
    Competency,
    FeePayment,
    School,
    Student,
    Teacher,
)
from .permissions import (
    HasSchoolAccess,
    IsAdminOrBursar,
    IsAdminOrTeacher,
    IsSchoolAdmin,
)
from .serializers import (
    ClassRoomSerializer,
    CompetencySerializer,
    FeePaymentSerializer,
    SchoolSerializer,
    StudentSerializer,
    TeacherSerializer,
    UserAccountSerializer,
)


User = get_user_model()


class SchoolScopedViewSet(viewsets.ModelViewSet):
    """
    Base ViewSet for resources belonging to a school.
    """

    permission_classes = [HasSchoolAccess]

    def get_school(self):
        """
        Return the authenticated user's school.

        Superusers have global access.
        """

        if self.request.user.is_superuser:
            return None

        return self.request.user.profile.school


class UserAccountViewSet(viewsets.ModelViewSet):
    """
    School user account management API.
    """

    queryset = User.objects.all().select_related(
        "profile",
        "profile__school",
    )

    serializer_class = UserAccountSerializer
    permission_classes = [IsSchoolAdmin]

    def get_queryset(self):
        if self.request.user.is_superuser:
            return User.objects.all().select_related(
                "profile",
                "profile__school",
            )

        school = self.request.user.profile.school

        return User.objects.filter(
            profile__school=school
        ).select_related(
            "profile",
            "profile__school",
        )

    def perform_create(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        if instance.pk == self.request.user.pk:
            raise ValidationError(
                "You cannot delete your own account."
            )

        instance.delete()


class StudentViewSet(SchoolScopedViewSet):
    """
    Student management API.

    Students are automatically restricted to the
    authenticated user's school.
    """

    queryset = Student.objects.all()
    serializer_class = StudentSerializer

    def get_permissions(self):
        return [IsAdminOrTeacher()]

    def get_queryset(self):
        school = self.get_school()

        queryset = Student.objects.all().select_related(
            "school",
            "classroom",
        )

        if school is not None:
            queryset = queryset.filter(
                school=school
            )

        grade = self.request.query_params.get("grade")

        if grade:
            queryset = queryset.filter(
                grade=grade
            )

        classroom = self.request.query_params.get("classroom")

        if classroom:
            queryset = queryset.filter(
                classroom_id=classroom
            )

        return queryset

    def perform_create(self, serializer):
        school = self.get_school()

        if school is None:
            serializer.save()
            return

        serializer.save(
            school=school
        )


class CompetencyViewSet(SchoolScopedViewSet):
    """
    CBC competency assessment API.

    Supports filtering by:

    - student
    - learning_area
    - mastery_level
    - assessed_on
    """

    queryset = Competency.objects.all()
    serializer_class = CompetencySerializer

    def get_permissions(self):
        return [IsAdminOrTeacher()]

    def get_queryset(self):
        school = self.get_school()

        queryset = Competency.objects.all().select_related(
            "student",
            "student__school",
        )

        if school is not None:
            queryset = queryset.filter(
                student__school=school
            )

        student = self.request.query_params.get("student")

        if student:
            queryset = queryset.filter(
                student_id=student
            )

        learning_area = self.request.query_params.get(
            "learning_area"
        )

        if learning_area:
            queryset = queryset.filter(
                learning_area=learning_area
            )

        mastery_level = self.request.query_params.get(
            "mastery_level"
        )

        if mastery_level:
            queryset = queryset.filter(
                mastery_level=mastery_level
            )

        assessed_on = self.request.query_params.get(
            "assessed_on"
        )

        if assessed_on:
            queryset = queryset.filter(
                assessed_on=assessed_on
            )

        return queryset


class SchoolViewSet(viewsets.ModelViewSet):
    """
    School management API.
    """

    queryset = School.objects.all()
    serializer_class = SchoolSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [HasSchoolAccess()]

        return [IsSchoolAdmin()]

    def get_queryset(self):
        if self.request.user.is_superuser:
            return School.objects.all()

        return School.objects.filter(
            id=self.request.user.profile.school_id
        )


class ClassRoomViewSet(SchoolScopedViewSet):
    """
    Classroom management API.
    """

    queryset = ClassRoom.objects.all()
    serializer_class = ClassRoomSerializer

    def get_permissions(self):
        return [IsAdminOrTeacher()]

    def get_queryset(self):
        school = self.get_school()

        queryset = ClassRoom.objects.all().select_related(
            "school"
        )

        if school is not None:
            queryset = queryset.filter(
                school=school
            )

        grade = self.request.query_params.get("grade")

        if grade:
            queryset = queryset.filter(
                grade=grade
            )

        return queryset

    def perform_create(self, serializer):
        school = self.get_school()

        if school is None:
            serializer.save()
            return

        serializer.save(
            school=school
        )


class TeacherViewSet(SchoolScopedViewSet):
    """
    Teacher management API.
    """

    queryset = Teacher.objects.all()
    serializer_class = TeacherSerializer

    def get_permissions(self):
        return [IsSchoolAdmin()]

    def get_queryset(self):
        school = self.get_school()

        queryset = Teacher.objects.all().select_related(
            "user",
            "school",
        )

        if school is not None:
            queryset = queryset.filter(
                school=school
            )

        return queryset

    def perform_create(self, serializer):
        school = self.get_school()

        if school is None:
            serializer.save()
            return

        serializer.save(
            school=school
        )


class FeePaymentViewSet(SchoolScopedViewSet):
    """
    School fee payment API.
    """

    queryset = FeePayment.objects.all()
    serializer_class = FeePaymentSerializer

    def get_permissions(self):
        return [IsAdminOrBursar()]

    def get_queryset(self):
        school = self.get_school()

        queryset = FeePayment.objects.all().select_related(
            "student",
            "student__school",
        )

        if school is not None:
            queryset = queryset.filter(
                student__school=school
            )

        student = self.request.query_params.get("student")

        if student:
            queryset = queryset.filter(
                student_id=student
            )

        status_filter = self.request.query_params.get(
            "status"
        )

        if status_filter:
            queryset = queryset.filter(
                status=status_filter
            )

        return queryset

    def perform_create(self, serializer):
        school = self.get_school()

        if school is None:
            serializer.save()
            return

        student = serializer.validated_data["student"]

        if student.school_id != school.id:
            raise ValidationError(
                {
                    "student": (
                        "Student does not belong "
                        "to your school."
                    )
                }
            )

        serializer.save()


class DashboardViewSet(viewsets.ViewSet):
    """
    School dashboard statistics.
    """

    permission_classes = [HasSchoolAccess]

    def list(self, request):
        if request.user.is_superuser:
            data = {
                "students": Student.objects.count(),
                "teachers": Teacher.objects.count(),
                "classrooms": ClassRoom.objects.count(),
                "payments": FeePayment.objects.count(),
            }

        else:
            school = request.user.profile.school

            data = {
                "students": Student.objects.filter(
                    school=school
                ).count(),

                "teachers": Teacher.objects.filter(
                    school=school
                ).count(),

                "classrooms": ClassRoom.objects.filter(
                    school=school
                ).count(),

                "payments": FeePayment.objects.filter(
                    student__school=school
                ).count(),
            }

        return Response(
            data,
            status=status.HTTP_200_OK,
        )