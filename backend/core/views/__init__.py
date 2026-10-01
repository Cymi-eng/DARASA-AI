
from .base import SchoolScopedViewSet
from .users import UserAccountViewSet
from .schools import SchoolViewSet
from .students import StudentViewSet
from .classrooms import ClassRoomViewSet
from .teachers import TeacherViewSet
from .competencies import CompetencyViewSet
from .fee_payments import FeePaymentViewSet
from .fee_ledger import FeeLedgerViewSet
from .notifications import NotificationViewSet
from .dashboard import DashboardViewSet
from .demo import DemoDataViewSet
from .ai_assistant import AIAssistantView


__all__ = [
    "SchoolScopedViewSet",
    "UserAccountViewSet",
    "SchoolViewSet",
    "StudentViewSet",
    "CompetencyViewSet",
    "ClassRoomViewSet",
    "TeacherViewSet",
    "FeePaymentViewSet",
    "FeeLedgerViewSet",
    "NotificationViewSet",
    "DashboardViewSet",
    "DemoDataViewSet",
    "AIAssistantView",
]

