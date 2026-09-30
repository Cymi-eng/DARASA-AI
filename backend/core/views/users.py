from django.contrib.auth import get_user_model

from rest_framework import permissions, status, viewsets
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

    The /me/ endpoint is available to every authenticated
    user and returns their portal role and school context.

    Students can also use /me/settings/ to update
    their own username and password.
    """

    queryset = User.objects.all().select_related(
        "profile",
        "profile__school",
    )

    serializer_class = UserAccountSerializer

    permission_classes = [
        IsSchoolAdmin
    ]

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
            serializer.data,
            status=status.HTTP_200_OK,
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
        Update the authenticated user's own
        username and/or password.
        """

        serializer = (
            StudentAccountSettingsSerializer(
                instance=request.user,
                data=request.data,
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        return Response(
            {
                "detail": (
                    "Account settings updated successfully."
                ),
                "username": request.user.username,
            },
            status=status.HTTP_200_OK,
        )