from rest_framework import status, viewsets
from rest_framework.response import Response

from .models import (
    ClassRoom,
    Competency,
    FeePayment,
    School,
    Student,
    Teacher,
)
from .permissions import HasSchoolAccess, IsSchoolAdmin
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
    Base ViewSet for resources that belong to a school.
    """

    permission_classes = [HasSchoolAccess]

    def get_school(self):
        if self.request.user.is_superuser:
            return None

        return self.request.user.profile.school


class StudentViewSet(SchoolScopedViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer

    def get_queryset(self):
        school = self.get_school()

        if school is None:
            return Student.objects.all()

        return Student.objects.filter(
            school=school
        ).select_related("school", "classroom")

    def perform_create(self, serializer):
        school = self.get_school()

        if school is None:
            serializer.save()
        else:
            serializer.save(school=school)


class CompetencyViewSet(SchoolScopedViewSet):
    queryset = Competency.objects.all()
    serializer_class = CompetencySerializer

    def get_queryset(self):
        school = self.get_school()

        if school is None:
            return Competency.objects.all()

        return Competency.objects.filter(
            student__school=school
        ).select_related("student")


class SchoolViewSet(viewsets.ModelViewSet):
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
    queryset = ClassRoom.objects.all()
    serializer_class = ClassRoomSerializer

    def get_queryset(self):
        school = self.get_school()

        if school is None:
            return ClassRoom.objects.all()

        return ClassRoom.objects.filter(
            school=school
        ).select_related("school")

    def perform_create(self, serializer):
        school = self.get_school()

        if school is None:
            serializer.save()
        else:
            serializer.save(school=school)


class TeacherViewSet(SchoolScopedViewSet):
    queryset = Teacher.objects.all()
    serializer_class = TeacherSerializer

    def get_queryset(self):
        school = self.get_school()

        if school is None:
            return Teacher.objects.all()

        return Teacher.objects.filter(
            school=school
        ).select_related("user")


class FeePaymentViewSet(SchoolScopedViewSet):
    queryset = FeePayment.objects.all()
    serializer_class = FeePaymentSerializer

    def get_queryset(self):
        school = self.get_school()

        if school is None:
            return FeePayment.objects.all()

        return FeePayment.objects.filter(
            student__school=school
        ).select_related("student")

    def perform_create(self, serializer):
        school = self.get_school()

        if school is None:
            serializer.save()
            return

        student = serializer.validated_data["student"]

        if student.school_id != school.id:
            from rest_framework.exceptions import ValidationError

            raise ValidationError(
                {"student": "Student does not belong to your school."}
            )

        serializer.save()


class DashboardViewSet(viewsets.ViewSet):
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

        return Response(data, status=status.HTTP_200_OK)