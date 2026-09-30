from django.contrib.auth import get_user_model
from django.db import transaction

from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from rest_framework_simplejwt.tokens import RefreshToken

from ..serializers import UserAccountSerializer


User = get_user_model()


class UserAccountViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserAccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.is_superuser:
            return User.objects.all()

        profile = getattr(user, "profile", None)

        if not profile or not profile.school_id:
            return User.objects.filter(pk=user.pk)

        return (
            User.objects
            .filter(profile__school=profile.school)
            .select_related(
                "profile",
                "profile__school",
            )
        )

    @action(
        detail=False,
        methods=["get"],
        permission_classes=[permissions.IsAuthenticated],
    )
    def me(self, request):
        user = request.user

        serializer = self.get_serializer(user)

        data = dict(serializer.data)

        profile = getattr(
            user,
            "profile",
            None,
        )

        data["role"] = (
            profile.role
            if profile
            else None
        )

        data["school"] = (
            profile.school_id
            if profile and profile.school
            else None
        )

        student = getattr(
            user,
            "student_record",
            None,
        )

        if student:
            data["student"] = {
                "id": student.id,
                "first_name": student.first_name,
                "last_name": student.last_name,
                "admission_number": student.admission_number,
                "grade": student.grade,
                "classroom": (
                    student.classroom_id
                    if student.classroom
                    else None
                ),
            }
        else:
            data["student"] = None

        return Response(
            data,
            status=status.HTTP_200_OK,
        )

    @action(
        detail=False,
        methods=["get", "post"],
        url_path="me/settings",
        permission_classes=[permissions.IsAuthenticated],
    )
    @transaction.atomic
    def account_settings(self, request):
        """
        Read or update the authenticated user's account settings.

        Changes are persisted directly to Django's User model.
        Passwords are stored using Django's secure password hashing.
        """

        user = request.user

        if request.method == "GET":
            profile = getattr(
                user,
                "profile",
                None,
            )

            return Response(
                {
                    "username": user.username,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "email": user.email,
                    "role": (
                        profile.role
                        if profile
                        else None
                    ),
                    "school": (
                        profile.school_id
                        if profile
                        else None
                    ),
                },
                status=status.HTTP_200_OK,
            )

        data = request.data

        username = data.get("username")
        first_name = data.get("first_name")
        last_name = data.get("last_name")
        email = data.get("email")

        current_password = data.get(
            "current_password"
        )
        new_password = data.get(
            "new_password"
        )
        confirm_password = data.get(
            "confirm_password"
        )

        password_changed = False

        # -------------------------
        # USERNAME
        # -------------------------

        if username is not None:
            username = username.strip()

            if not username:
                return Response(
                    {
                        "username": (
                            "Username cannot be empty."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            username_exists = (
                User.objects
                .filter(username__iexact=username)
                .exclude(pk=user.pk)
                .exists()
            )

            if username_exists:
                return Response(
                    {
                        "username": (
                            "This username is already in use."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user.username = username

        # -------------------------
        # FIRST NAME
        # -------------------------

        if first_name is not None:
            user.first_name = first_name.strip()

        # -------------------------
        # LAST NAME
        # -------------------------

        if last_name is not None:
            user.last_name = last_name.strip()

        # -------------------------
        # EMAIL
        # -------------------------

        if email is not None:
            user.email = email.strip()

        # -------------------------
        # PASSWORD
        # -------------------------

        changing_password = any(
            value
            for value in (
                current_password,
                new_password,
                confirm_password,
            )
        )

        if changing_password:

            if not current_password:
                return Response(
                    {
                        "current_password": (
                            "Current password is required."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if not user.check_password(
                current_password
            ):
                return Response(
                    {
                        "current_password": (
                            "Current password is incorrect."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if not new_password:
                return Response(
                    {
                        "new_password": (
                            "New password is required."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if new_password != confirm_password:
                return Response(
                    {
                        "confirm_password": (
                            "Passwords do not match."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if len(new_password) < 8:
                return Response(
                    {
                        "new_password": (
                            "Password must be at least "
                            "8 characters long."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user.set_password(new_password)

            password_changed = True

        # -------------------------
        # SAVE EVERYTHING
        # -------------------------

        user.save()

        # -------------------------
        # REFRESH JWT TOKENS
        # -------------------------

        response_data = {
            "detail": (
                "Account settings updated successfully."
            ),
            "password_changed": password_changed,
            "user": {
                "id": user.id,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
            },
        }

        if password_changed:
            refresh = RefreshToken.for_user(user)

            response_data["tokens"] = {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            }

        return Response(
            response_data,
            status=status.HTTP_200_OK,
        )