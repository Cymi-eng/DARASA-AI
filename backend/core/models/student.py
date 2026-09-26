from django.contrib.auth.models import User
from django.db import models

from .school import School


class Student(models.Model):
    GRADE_CHOICES = [
        ("PP1", "Pre-Primary 1"),
        ("PP2", "Pre-Primary 2"),
        ("G1", "Grade 1"),
        ("G2", "Grade 2"),
        ("G3", "Grade 3"),
        ("G4", "Grade 4"),
        ("G5", "Grade 5"),
        ("G6", "Grade 6"),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.SET_NULL,
        related_name="student_record",
        null=True,
        blank=True,
    )

    first_name = models.CharField(
        max_length=100
    )

    last_name = models.CharField(
        max_length=100
    )

    admission_number = models.CharField(
        max_length=20,
        unique=True,
    )

    grade = models.CharField(
        max_length=10,
        choices=GRADE_CHOICES,
    )

    date_of_birth = models.DateField(
        null=True,
        blank=True,
    )

    guardian_name = models.CharField(
        max_length=150,
        blank=True,
    )

    guardian_phone = models.CharField(
        max_length=15,
        blank=True,
    )

    school = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        related_name="students",
        null=True,
        blank=True,
    )

    classroom = models.ForeignKey(
        "ClassRoom",
        on_delete=models.SET_NULL,
        related_name="students",
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):
        return (
            f"{self.first_name} "
            f"{self.last_name} "
            f"({self.admission_number})"
        )