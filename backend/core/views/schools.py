from rest_framework import viewsets

from ..models import School
from ..permissions import HasSchoolAccess, IsSchoolAdmin
from ..serializers import SchoolSerializer


class SchoolViewSet(viewsets.ModelViewSet):
    """
    School management API.

    Superusers can manage all schools.

    School administrators can view their own school
    and manage their school's information.
    """

    queryset = School.objects.all()
    serializer_class = SchoolSerializer

    def get_permissions(self):
        """
        Allow authenticated school users to view their
        school.

        Only school administrators can create, update,
        or delete schools.
        """

        if self.action in ["list", "retrieve"]:
            return [HasSchoolAccess()]

        return [IsSchoolAdmin()]

    def get_queryset(self):
        """
        Restrict normal users to their own school.

        Superusers can access all schools.
        """

        if self.request.user.is_superuser:
            return School.objects.all()

        return School.objects.filter(
            id=self.request.user.profile.school_id
        )