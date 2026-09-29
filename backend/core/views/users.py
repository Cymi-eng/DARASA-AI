from django.contrib.auth import get_user_model

from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from ..permissions import IsSchoolAdmin
from ..serializers import (
    StudentRegistrationSerializer,
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

    The student-register endpoint is publicly available
    and allows an existing student record to create its
    own STUDENT account.
    """

    queryset = User.objects.all().select_related(
        "profile",
        "profile__school",
    )

    serializer_class = UserAccountSerializer
    permission_classes = [IsSchoolAdmin]

    def get_queryset(self):
        """
        Restrict normal administrators to users
        belonging to their school.
        """

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
        """
        Create a user account.

        School assignment is handled by the serializer.
        """

        serializer.save()

    def perform_destroy(self, instance):
        """
        Prevent an administrator from deleting
        their own account.
        """

        if instance.pk == self.request.user.pk:
            from rest_framework.exceptions import ValidationError

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
        """
        Return the authenticated user's portal context.
        """

        serializer = CurrentUserSerializer(
            request.user
        )

        return Response(
            serializer.data
        )

    @action(
        detail=False,
        methods=["post"],
        url_path="student-register",
        permission_classes=[
            permissions.AllowAny,
        ],
    )
    def student_register(self, request):
        """
        Public student account registration.

        The student must already exist in the school's
        Student records. The registration serializer
        verifies the learner information before creating
        the account.
        """

        serializer = StudentRegistrationSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        user = serializer.save()

        return Response(
            {
                "detail": (
                    "Student account created successfully."
                ),
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "role": user.profile.role,
                    "school": (
                        user.profile.school.name
                        if user.profile.school
                        else None
                    ),
                },
            },
            status=status.HTTP_201_CREATED,
        )