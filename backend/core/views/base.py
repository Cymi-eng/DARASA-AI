from rest_framework import viewsets

from ..permissions import HasSchoolAccess


class SchoolScopedViewSet(viewsets.ModelViewSet):
    """
    Base ViewSet for resources belonging to a school.

    Superusers have global access.
    Normal users are restricted to their school.
    """

    permission_classes = [HasSchoolAccess]

    def get_school(self):
        """
        Return the authenticated user's school.

        Returns None for superusers because they
        have global access.
        """

        if self.request.user.is_superuser:
            return None

        return self.request.user.profile.school