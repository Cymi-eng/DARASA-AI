from django.db import models

from .student import Student


class Competency(models.Model):
    LEARNING_AREA_CHOICES = [
        ("MATH", "Mathematics"),
        ("ENG", "English"),
        ("KIS", "Kiswahili"),
        ("SCI", "Science & Technology"),
        ("SST", "Social Studies"),
        ("CRE", "Christian Religious Education"),
        ("CA", "Creative Arts"),
        ("AGR", "Agriculture"),
    ]

    MASTERY_LEVELS = [
        ("EE", "Exceeds Expectation"),
        ("ME", "Meets Expectation"),
        ("AE", "Approaches Expectation"),
        ("BE", "Below Expectation"),
    ]

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="competencies",
    )

    learning_area = models.CharField(
        max_length=10,
        choices=LEARNING_AREA_CHOICES,
    )

    strand = models.CharField(
        max_length=150,
    )

    sub_strand = models.CharField(
        max_length=150,
        blank=True,
    )

    mastery_level = models.CharField(
        max_length=2,
        choices=MASTERY_LEVELS,
    )

    assessed_on = models.DateField()

    teacher_notes = models.TextField(
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["-assessed_on"]

    def __str__(self):
        return (
            f"{self.student} - "
            f"{self.learning_area} "
            f"({self.mastery_level}) "
            f"on {self.assessed_on}"
        )