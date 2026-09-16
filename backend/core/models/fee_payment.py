from django.db import models

from .student import Student


class FeePayment(models.Model):
    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("CONFIRMED", "Confirmed"),
        ("FAILED", "Failed"),
    ]

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="fee_payments",
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    mpesa_receipt_number = models.CharField(
        max_length=30,
        blank=True,
    )

    phone_number = models.CharField(
        max_length=15,
    )

    transaction_id = models.CharField(
        max_length=100,
        unique=True,
        blank=True,
    )

    checkout_request_id = models.CharField(
        max_length=100,
        blank=True,
        db_index=True,
    )

    merchant_request_id = models.CharField(
        max_length=100,
        blank=True,
        db_index=True,
    )

    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default="PENDING",
        db_index=True,
    )

    failure_reason = models.TextField(
        blank=True,
    )

    paid_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-paid_at"]

    def __str__(self):
        return (
            f"{self.student} - "
            f"KES {self.amount} "
            f"({self.status})"
        )