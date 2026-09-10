from rest_framework.routers import DefaultRouter
from .views import StudentViewSet, CompetencyViewSet

router = DefaultRouter()
router.register(r'students', StudentViewSet)
router.register(r'competencies', CompetencyViewSet)

urlpatterns = router.urls