from .users import UserAccountViewSet
from .schools import SchoolViewSet
from .students import StudentViewSet
from .classrooms import ClassRoomViewSet
from .teachers import TeacherViewSet
from .competencies import CompetencyViewSet
from .fee_payments import FeePaymentViewSet
from .dashboard import DashboardViewSet
from .base import SchoolScopedViewSet


__all__ = [
    "SchoolScopedViewSet",
    "UserAccountViewSet",
    "SchoolViewSet",
    "StudentViewSet",
    "ClassRoomViewSet",
    "TeacherViewSet",
    "CompetencyViewSet",
    "FeePaymentViewSet",
    "DashboardViewSet",
]