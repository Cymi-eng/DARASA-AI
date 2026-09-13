from rest_framework.routers import DefaultRouter
from .views import (
    StudentViewSet, CompetencyViewSet, SchoolViewSet,
    ClassRoomViewSet, TeacherViewSet, FeePaymentViewSet
)

router = DefaultRouter()
router.register(r'students', StudentViewSet)
router.register(r'competencies', CompetencyViewSet)
router.register(r'schools', SchoolViewSet)
router.register(r'classrooms', ClassRoomViewSet)
router.register(r'teachers', TeacherViewSet)
router.register(r'fee-payments', FeePaymentViewSet)

urlpatterns = router.urls