from .base import SchoolScopedViewSet
from .users import UserAccountViewSet
from .schools import SchoolViewSet
from .students import StudentViewSet
from .classrooms import ClassRoomViewSet
from .teachers import TeacherViewSet
from .competencies import CompetencyViewSet
from .fee_payments import FeePaymentViewSet
from .fee_ledger import FeeLedgerViewSet
from .dashboard import DashboardViewSet


__all__ = [
    "SchoolScopedViewSet",
    "UserAccountViewSet",
    "SchoolViewSet",
    "StudentViewSet",
    "ClassRoomViewSet",
    "TeacherViewSet",
    "CompetencyViewSet",
    "FeePaymentViewSet",
    "FeeLedgerViewSet",
    "DashboardViewSet",
]