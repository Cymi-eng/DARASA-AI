
from django.contrib import admin
from django.urls import include, path

from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from core.views import (
    UserAccountViewSet,
    StudentViewSet,
    CompetencyViewSet,
    SchoolViewSet,
    ClassRoomViewSet,
    TeacherViewSet,
    FeePaymentViewSet,
    FeeLedgerViewSet,
    NotificationViewSet,
    DashboardViewSet,
    DemoDataViewSet,
    AIAssistantView,
)

from core.views.mpesa import mpesa_callback


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

router.register(
    r"fee-ledger",
    FeeLedgerViewSet,
)

router.register(
    r"notifications",
    NotificationViewSet,
)

router.register(
    r"demo",
    DemoDataViewSet,
    basename="demo",
)


urlpatterns = [
    path(
        "admin/",
        admin.site.urls,
    ),

    # JWT Authentication
    path(
        "api/auth/token/",
        TokenObtainPairView.as_view(),
        name="token_obtain_pair",
    ),

    path(
        "api/auth/token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
    ),

    # Dashboard
    path(
        "api/dashboard/",
        DashboardViewSet.as_view(
            {"get": "list"}
        ),
        name="dashboard",
    ),

    # DARASA-AI Assistant
    path(
        "api/ai/assistant/",
        AIAssistantView.as_view(),
        name="ai_assistant",
    ),

    # M-Pesa callback
    path(
        "api/mpesa/callback/",
        mpesa_callback,
        name="mpesa_callback",
    ),

    # Main API routes
    path(
        "api/",
        include(router.urls),
    ),
]

