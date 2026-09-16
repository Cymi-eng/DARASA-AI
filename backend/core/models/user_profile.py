from django.db import models
from django.contrib.auth.models import User

from .school import School


class UserProfile(models.Model):
    ROLE_ADMIN = "ADMIN"
    ROLE_TEACHER = "TEACHER"
    ROLE_BURSAR = "BURSAR"
    ROLE_STUDENT = "STUDENT"

    ROLE_CHOICES = [
        (ROLE_ADMIN, "Admin"),
        (ROLE_TEACHER, "Teacher"),
        (ROLE_BURSAR, "Bursar"),
        (ROLE_STUDENT, "Student"),
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
        default=ROLE_TEACHER,
    )

    def __str__(self):
        return f"{self.user.username} - {self.role}"