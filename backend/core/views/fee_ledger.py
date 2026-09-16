from django.db.models import Count, Sum
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from ..models import FeeLedgerEntry, FeePayment
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
            raise ValidationError(
                {
                    "payment": (
                        "Payment does not belong "
                        "to your school."
                    )
                }
            )

        serializer.save()

    @action(
        detail=False,
        methods=["get"],
        url_path="summary",
    )
    def summary(self, request):
        queryset = self.get_queryset()

        payment_total = queryset.filter(
            entry_type="PAYMENT"
        ).aggregate(
            total=Sum("amount"),
            count=Count("id"),
        )

        adjustment_total = queryset.filter(
            entry_type="ADJUSTMENT"
        ).aggregate(
            total=Sum("amount"),
            count=Count("id"),
        )

        refund_total = queryset.filter(
            entry_type="REFUND"
        ).aggregate(
            total=Sum("amount"),
            count=Count("id"),
        )

        total_payments = payment_total["total"] or 0
        total_adjustments = adjustment_total["total"] or 0
        total_refunds = refund_total["total"] or 0

        net_balance = (
            total_payments
            + total_adjustments
            - total_refunds
        )

        return Response(
            {
                "payments": {
                    "count": payment_total["count"],
                    "total": total_payments,
                },
                "adjustments": {
                    "count": adjustment_total["count"],
                    "total": adjustment_total["total"] or 0,
                },
                "refunds": {
                    "count": refund_total["count"],
                    "total": refund_total["total"] or 0,
                },
                "net_balance": net_balance,
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="reconciliation",
    )
    def reconciliation(self, request):
        school = self.get_school()

        payments = FeePayment.objects.filter(
            status="CONFIRMED"
        ).select_related(
            "student"
        )

        if school is not None:
            payments = payments.filter(
                student__school=school
            )

        payment_count = payments.count()

        payment_total = payments.aggregate(
            total=Sum("amount")
        )["total"] or 0

        ledger_entries = FeeLedgerEntry.objects.filter(
            entry_type="PAYMENT",
            payment__status="CONFIRMED",
        )

        if school is not None:
            ledger_entries = ledger_entries.filter(
                student__school=school
            )

        ledger_count = ledger_entries.count()

        ledger_total = ledger_entries.aggregate(
            total=Sum("amount")
        )["total"] or 0

        missing_ledger_count = (
            payments.filter(
                ledger_entries__isnull=True
            ).count()
        )

        amount_difference = (
            payment_total - ledger_total
        )

        if missing_ledger_count == 0 and amount_difference == 0:
            reconciliation_status = "RECONCILED"
        else:
            reconciliation_status = "ACTION_REQUIRED"

        return Response(
            {
                "status": reconciliation_status,
                "payments": {
                    "count": payment_count,
                    "total": payment_total,
                },
                "ledger": {
                    "count": ledger_count,
                    "total": ledger_total,
                },
                "missing_ledger_entries": missing_ledger_count,
                "amount_difference": amount_difference,
            },
            status=status.HTTP_200_OK,
        )