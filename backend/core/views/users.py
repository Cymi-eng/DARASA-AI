from django.contrib.auth import get_user_model

from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from ..permissions import IsSchoolAdmin
from ..serializers import (
    StudentAccountSettingsSerializer,
    UserAccountSerializer,
)
from ..serializers.user_profile import CurrentUserSerializer


User = get_user_model()


class UserAccountViewSet(viewsets.ModelViewSet):
    """
    School user account management API.

    School administrators can manage users within
    their own school.

    Superusers have global access.

    The /me/ endpoint is available to every
    authenticated user.
    """

    queryset = User.objects.all().select_related(
        "profile",
        "profile__school",
    )

    serializer_class = UserAccountSerializer

    permission_classes = [
        IsSchoolAdmin,
    ]

    def get_queryset(self):
        if self.request.user.is_superuser:
            return User.objects.all().select_related(
                "profile",
                "profile__school",
            )

        profile = getattr(
            self.request.user,
            "profile",
            None,
        )

        if profile is None:
            return User.objects.none()

        school = profile.school

        if school is None:
            return User.objects.none()

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

    @action(
        detail=False,
        methods=["get"],
        url_path="me",
        permission_classes=[
            permissions.IsAuthenticated,
        ],
    )
    def me(self, request):
        serializer = CurrentUserSerializer(
            request.user
        )

        return Response(
            serializer.data
        )

    @action(
        detail=False,
        methods=["post"],
        url_path="me/settings",
        permission_classes=[
            permissions.IsAuthenticated,
        ],
    )
    def settings(self, request):
        """
        Update the currently authenticated user's
        own account settings.
        """

        serializer = StudentAccountSettingsSerializer(
            instance=request.user,
            data=request.data,
            partial=True,
            context={
                "request": request,
            },
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        request.user.refresh_from_db()

        return Response(
            CurrentUserSerializer(
                request.user
            ).data
        )