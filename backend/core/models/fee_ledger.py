from django.db import models

from .fee_payment import FeePayment
from .student import Student


class FeeLedgerEntry(models.Model):
    ENTRY_TYPES = [
        ("PAYMENT", "Payment"),
        ("ADJUSTMENT", "Adjustment"),
        ("REFUND", "Refund"),
    ]

    payment = models.ForeignKey(
        FeePayment,
        on_delete=models.PROTECT,
        related_name="ledger_entries",
        null=True,
        blank=True,
    )

    student = models.ForeignKey(
        Student,
        on_delete=models.PROTECT,
        related_name="fee_ledger_entries",
    )

    entry_type = models.CharField(
        max_length=20,
        choices=ENTRY_TYPES,
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    reference = models.CharField(
        max_length=100,
        blank=True,
    )

    description = models.TextField(
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return (
            f"{self.student} - "
            f"{self.entry_type} - "
            f"KES {self.amount}"
        )