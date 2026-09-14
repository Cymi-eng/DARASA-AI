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
)


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

        if school is None:
            return Student.objects.all().select_related(
                "school",
                "classroom",
            )

        return Student.objects.filter(
            school=school
        ).select_related(
            "school",
            "classroom",
        )

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
    """

    queryset = Competency.objects.all()
    serializer_class = CompetencySerializer

    def get_permissions(self):
        return [IsAdminOrTeacher()]

    def get_queryset(self):
        school = self.get_school()

        if school is None:
            return Competency.objects.all().select_related(
                "student"
            )

        return Competency.objects.filter(
            student__school=school
        ).select_related(
            "student"
        )


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

        if school is None:
            return ClassRoom.objects.all().select_related(
                "school"
            )

        return ClassRoom.objects.filter(
            school=school
        ).select_related(
            "school"
        )

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

        if school is None:
            return Teacher.objects.all().select_related(
                "user",
                "school",
            )

        return Teacher.objects.filter(
            school=school
        ).select_related(
            "user",
            "school",
        )

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

        if school is None:
            return FeePayment.objects.all().select_related(
                "student"
            )

        return FeePayment.objects.filter(
            student__school=school
        ).select_related(
            "student"
        )

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
                        "Student does not belong to your school."
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