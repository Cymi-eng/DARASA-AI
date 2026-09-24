from rest_framework import status, viewsets
from rest_framework.response import Response

from ..models import ClassRoom, Competency, FeePayment, Student, Teacher
from ..permissions import HasSchoolAccess


class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [HasSchoolAccess]

    def list(self, request):
        profile = getattr(request.user, "profile", None)
        school = profile.school if profile and profile.school_id else None

        if school is None:
            data = {
                "students": Student.objects.count(),
                "teachers": Teacher.objects.count(),
                "classrooms": ClassRoom.objects.count(),
                "assessments": Competency.objects.count(),
                "payments": FeePayment.objects.count(),
            }
        else:
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
                "assessments": Competency.objects.filter(
                    student__school=school
                ).count(),
                "payments": FeePayment.objects.filter(
                    student__school=school
                ).count(),
            }

        return Response(
            data,
            status=status.HTTP_200_OK,
        )