from django.contrib.auth import get_user_model
from django.db import transaction

from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from rest_framework_simplejwt.tokens import RefreshToken

from ..serializers import UserAccountSerializer


User = get_user_model()


class UserAccountViewSet(viewsets.ModelViewSet):
    """
    API endpoints for authenticated user accounts.

    Students can update their own account information through:

        GET  /api/users/me/
        GET  /api/users/me/settings/
        POST /api/users/me/settings/

    Account changes are persisted directly to Django's User model.
    """

    queryset = User.objects.all()

    serializer_class = UserAccountSerializer

    permission_classes = [
        permissions.IsAuthenticated,
    ]

    # ------------------------------------------------------------------
    # QUERYSET
    # ------------------------------------------------------------------

    def get_queryset(self):
        """
        Restrict normal users to accounts belonging to their school.

        Superusers can access all users.
        Users without a school can only access themselves.
        """

        user = self.request.user

        if user.is_superuser:
            return (
                User.objects
                .all()
                .select_related(
                    "profile",
                    "profile__school",
                )
            )

        profile = getattr(
            user,
            "profile",
            None,
        )

        if not profile or not profile.school_id:
            return User.objects.filter(
                pk=user.pk
            )

        return (
            User.objects
            .filter(
                profile__school=profile.school
            )
            .select_related(
                "profile",
                "profile__school",
            )
        )

    # ------------------------------------------------------------------
    # CURRENT USER
    # ------------------------------------------------------------------

    @action(
        detail=False,
        methods=["get"],
        permission_classes=[
            permissions.IsAuthenticated,
        ],
    )
    def me(self, request):
        """
        Return the currently authenticated user's account.
        """

        user = request.user

        serializer = self.get_serializer(
            user
        )

        data = dict(
            serializer.data
        )

        # --------------------------------------------------------------
        # USER PROFILE
        # --------------------------------------------------------------

        if user.is_superuser:
            data["role"] = "PLATFORM_ADMIN"
        else:
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

        profile = getattr(
            user,
            "profile",
            None,
        )

        data["school"] = (
            profile.school_id
            if profile and profile.school
            else None
        )

        # --------------------------------------------------------------
        # LINKED STUDENT
        # --------------------------------------------------------------

        student = getattr(
            user,
            "student_record",
            None,
        )

        if student:

            data["student"] = {
                "id": student.id,

                "first_name": (
                    student.first_name
                ),

                "last_name": (
                    student.last_name
                ),

                "admission_number": (
                    student.admission_number
                ),

                "grade": (
                    student.grade
                ),

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

    # ------------------------------------------------------------------
    # ACCOUNT SETTINGS
    # ------------------------------------------------------------------

    @action(
        detail=False,
        methods=["get", "post"],
        url_path="me/settings",
        permission_classes=[
            permissions.IsAuthenticated,
        ],
    )
    @transaction.atomic
    def account_settings(self, request):
        """
        Read or update the authenticated user's account settings.

        IMPORTANT:

        This method is intentionally called `account_settings`
        instead of `settings`.

        DRF internally uses `self.settings`, so naming an action
        `settings` causes an AttributeError inside DRF.
        """

        user = request.user

        # ============================================================== 
        # GET SETTINGS
        # ==============================================================

        if request.method == "GET":

            profile = getattr(
                user,
                "profile",
                None,
            )

            return Response(
                {
                    "id": user.id,

                    "username": (
                        user.username
                    ),

                    "first_name": (
                        user.first_name
                    ),

                    "last_name": (
                        user.last_name
                    ),

                    "email": (
                        user.email
                    ),

                    "role": (
                        "PLATFORM_ADMIN"
                        if user.is_superuser
                        else (
                            profile.role
                            if profile
                            else None
                        )
                    ),

                    "school": (
                        profile.school_id
                        if profile
                        else None
                    ),
                },
                status=status.HTTP_200_OK,
            )

        # ============================================================== 
        # REQUEST DATA
        # ==============================================================

        data = request.data

        username = data.get(
            "username"
        )

        first_name = data.get(
            "first_name"
        )

        last_name = data.get(
            "last_name"
        )

        email = data.get(
            "email"
        )

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

        # ============================================================== 
        # USERNAME
        # ==============================================================

        if username is not None:

            username = username.strip()

            if not username:

                return Response(
                    {
                        "username": (
                            "Username cannot be empty."
                        )
                    },
                    status=(
                        status.HTTP_400_BAD_REQUEST
                    ),
                )

            username_exists = (
                User.objects
                .filter(
                    username__iexact=username
                )
                .exclude(
                    pk=user.pk
                )
                .exists()
            )

            if username_exists:

                return Response(
                    {
                        "username": (
                            "This username is already "
                            "in use."
                        )
                    },
                    status=(
                        status.HTTP_400_BAD_REQUEST
                    ),
                )

            user.username = username

        # ============================================================== 
        # FIRST NAME
        # ==============================================================

        if first_name is not None:

            user.first_name = (
                first_name.strip()
            )

        # ============================================================== 
        # LAST NAME
        # ==============================================================

        if last_name is not None:

            user.last_name = (
                last_name.strip()
            )

        # ============================================================== 
        # EMAIL
        # ==============================================================

        if email is not None:

            user.email = (
                email.strip()
            )

        # ============================================================== 
        # PASSWORD
        # ==============================================================

        changing_password = any(
            value
            for value in (
                current_password,
                new_password,
                confirm_password,
            )
        )

        if changing_password:

            # ----------------------------------------------------------
            # CURRENT PASSWORD
            # ----------------------------------------------------------

            if not current_password:

                return Response(
                    {
                        "current_password": (
                            "Current password is required."
                        )
                    },
                    status=(
                        status.HTTP_400_BAD_REQUEST
                    ),
                )

            # ----------------------------------------------------------
            # VERIFY CURRENT PASSWORD
            # ----------------------------------------------------------

            if not user.check_password(
                current_password
            ):

                return Response(
                    {
                        "current_password": (
                            "Current password is incorrect."
                        )
                    },
                    status=(
                        status.HTTP_400_BAD_REQUEST
                    ),
                )

            # ----------------------------------------------------------
            # NEW PASSWORD
            # ----------------------------------------------------------

            if not new_password:

                return Response(
                    {
                        "new_password": (
                            "New password is required."
                        )
                    },
                    status=(
                        status.HTTP_400_BAD_REQUEST
                    ),
                )

            # ----------------------------------------------------------
            # CONFIRM PASSWORD
            # ----------------------------------------------------------

            if new_password != confirm_password:

                return Response(
                    {
                        "confirm_password": (
                            "Passwords do not match."
                        )
                    },
                    status=(
                        status.HTTP_400_BAD_REQUEST
                    ),
                )

            # ----------------------------------------------------------
            # PASSWORD LENGTH
            # ----------------------------------------------------------

            if len(new_password) < 8:

                return Response(
                    {
                        "new_password": (
                            "Password must be at least "
                            "8 characters long."
                        )
                    },
                    status=(
                        status.HTTP_400_BAD_REQUEST
                    ),
                )

            # ----------------------------------------------------------
            # SAVE PASSWORD USING DJANGO HASHING
            # ----------------------------------------------------------

            user.set_password(
                new_password
            )

            password_changed = True

        # ============================================================== 
        # SAVE USER
        # ==============================================================

        user.save()

        # ============================================================== 
        # RESPONSE
        # ==============================================================

        response_data = {
            "detail": (
                "Account settings updated successfully."
            ),

            "password_changed": (
                password_changed
            ),

            "user": {
                "id": user.id,

                "username": (
                    user.username
                ),

                "first_name": (
                    user.first_name
                ),

                "last_name": (
                    user.last_name
                ),

                "email": (
                    user.email
                ),
            },
        }

        # ============================================================== 
        # ISSUE FRESH TOKENS AFTER PASSWORD CHANGE
        # ==============================================================

        if password_changed:

            refresh = RefreshToken.for_user(
                user
            )

            response_data["tokens"] = {
                "refresh": str(
                    refresh
                ),

                "access": str(
                    refresh.access_token
                ),
            }

        return Response(
            response_data,
            status=status.HTTP_200_OK,
        )