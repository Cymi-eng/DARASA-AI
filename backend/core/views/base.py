from rest_framework import viewsets

from ..permissions import HasSchoolAccess


class SchoolScopedViewSet(viewsets.ModelViewSet):
    permission_classes = [HasSchoolAccess]

    def get_school(self):
        profile = getattr(self.request.user, "profile", None)

        if profile and profile.school_id:
            return profile.school

        return None