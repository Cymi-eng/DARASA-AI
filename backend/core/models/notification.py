from django.db import models

from .school import School
from .student import Student


class Notification(models.Model):
    CHANNEL_CHOICES = [
        ("SMS", "SMS"),
        ("EMAIL", "Email"),
        ("PUSH", "Push Notification"),
    ]

    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("SENT", "Sent"),
        ("FAILED", "Failed"),
    ]

    RECIPIENT_TYPES = [
        ("GUARDIAN", "Guardian"),
        ("TEACHER", "Teacher"),
        ("ADMIN", "Administrator"),
        ("BURSAR", "Bursar"),
    ]

    school = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="notifications",
        null=True,
        blank=True,
    )

    recipient_type = models.CharField(
        max_length=20,
        choices=RECIPIENT_TYPES,
    )

    recipient = models.CharField(
        max_length=255,
    )

    channel = models.CharField(
        max_length=10,
        choices=CHANNEL_CHOICES,
    )

    subject = models.CharField(
        max_length=255,
        blank=True,
    )

    message = models.TextField()

    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default="PENDING",
        db_index=True,
    )

    provider_message_id = models.CharField(
        max_length=255,
        blank=True,
        db_index=True,
    )

    failure_reason = models.TextField(
        blank=True,
    )

    sent_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return (
            f"{self.channel} - "
            f"{self.recipient} - "
            f"{self.status}"
        )