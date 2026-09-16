from rest_framework import status, viewsets
from rest_framework.response import Response

from ..models import (
    ClassRoom,
    Competency,
    FeePayment,
    Student,
    Teacher,
)
from ..permissions import HasSchoolAccess


class DashboardViewSet(viewsets.ViewSet):
    """
    School dashboard statistics.

    Superusers receive global statistics.

    Normal users receive statistics for their
    own school only.
    """

    permission_classes = [HasSchoolAccess]

    def list(self, request):
        if request.user.is_superuser:
            data = {
                "students": Student.objects.count(),
                "teachers": Teacher.objects.count(),
                "classrooms": ClassRoom.objects.count(),
                "assessments": Competency.objects.count(),
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