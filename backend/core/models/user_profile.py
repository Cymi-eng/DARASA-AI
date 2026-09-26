from django.contrib.auth.models import User
from django.db import models

from .school import School


class UserProfile(models.Model):
    """
    Extends Django's User model with DARASA-AI-specific
    role and school information.
    """

    PLATFORM_ADMIN = "PLATFORM_ADMIN"
    ADMIN = "ADMIN"
    TEACHER = "TEACHER"
    BURSAR = "BURSAR"
    STUDENT = "STUDENT"

    ROLE_CHOICES = [
        (
            PLATFORM_ADMIN,
            "Platform Administrator",
        ),
        (
            ADMIN,
            "School Administrator",
        ),
        (
            TEACHER,
            "Teacher",
        ),
        (
            BURSAR,
            "Bursar",
        ),
        (
            STUDENT,
            "Student",
        ),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile",
    )

    school = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        related_name="user_profiles",
        null=True,
        blank=True,
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default=TEACHER,
    )

    def __str__(self):
        return (
            f"{self.user.username} - "
            f"{self.get_role_display()}"
        )