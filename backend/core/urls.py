from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .views import (
    UserAccountViewSet,
    StudentViewSet,
    CompetencyViewSet,
    SchoolViewSet,
    ClassRoomViewSet,
    TeacherViewSet,
    FeePaymentViewSet,
    DashboardViewSet,
)


router = DefaultRouter()

router.register(
    r"users",
    UserAccountViewSet,
    basename="user",
)

router.register(
    r"students",
    StudentViewSet,
)

router.register(
    r"competencies",
    CompetencyViewSet,
)

router.register(
    r"schools",
    SchoolViewSet,
)

router.register(
    r"classrooms",
    ClassRoomViewSet,
)

router.register(
    r"teachers",
    TeacherViewSet,
)

router.register(
    r"fee-payments",
    FeePaymentViewSet,
)


urlpatterns = [
    path(
        "auth/token/",
        TokenObtainPairView.as_view(),
        name="token_obtain_pair",
    ),

    path(
        "auth/token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
    ),

    path(
        "dashboard/",
        DashboardViewSet.as_view(
            {"get": "list"}
        ),
        name="dashboard",
    ),
]

urlpatterns += router.urls