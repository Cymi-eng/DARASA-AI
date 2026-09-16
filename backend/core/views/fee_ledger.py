from rest_framework import viewsets

from ..models import FeeLedgerEntry
from ..permissions import IsAdminOrBursar
from ..serializers import FeeLedgerEntrySerializer
from .base import SchoolScopedViewSet


class FeeLedgerViewSet(SchoolScopedViewSet):
    queryset = FeeLedgerEntry.objects.all()
    serializer_class = FeeLedgerEntrySerializer

    def get_permissions(self):
        return [IsAdminOrBursar()]

    def get_queryset(self):
        school = self.get_school()

        queryset = FeeLedgerEntry.objects.all().select_related(
            "student",
            "student__school",
            "payment",
        )

        if school is not None:
            queryset = queryset.filter(
                student__school=school
            )

        student = self.request.query_params.get(
            "student"
        )

        if student:
            queryset = queryset.filter(
                student_id=student
            )

        entry_type = self.request.query_params.get(
            "entry_type"
        )

        if entry_type:
            queryset = queryset.filter(
                entry_type=entry_type
            )

        return queryset.order_by(
            "-created_at",
            "-id",
        )

    def perform_create(self, serializer):
        school = self.get_school()

        student = serializer.validated_data["student"]

        if school is not None and student.school_id != school.id:
            from rest_framework.exceptions import ValidationError

            raise ValidationError(
                {
                    "student": (
                        "Student does not belong "
                        "to your school."
                    )
                }
            )

        payment = serializer.validated_data.get(
            "payment"
        )

        if (
            school is not None
            and payment
            and payment.student.school_id != school.id
        ):
            from rest_framework.exceptions import ValidationError

            raise ValidationError(
                {
                    "payment": (
                        "Payment does not belong "
                        "to your school."
                    )
                }
            )

        serializer.save()