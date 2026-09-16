from django.db import models

from .school import School


class ClassRoom(models.Model):
    school = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        related_name="classrooms",
    )

    name = models.CharField(max_length=50)

    grade = models.CharField(
        max_length=10,
        choices=[
            ("PP1", "Pre-Primary 1"),
            ("PP2", "Pre-Primary 2"),
            ("G1", "Grade 1"),
            ("G2", "Grade 2"),
            ("G3", "Grade 3"),
            ("G4", "Grade 4"),
            ("G5", "Grade 5"),
            ("G6", "Grade 6"),
        ],
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["school", "name"],
                name="unique_classroom_per_school",
            )
        ]
        ordering = ["school", "grade", "name"]

    def __str__(self):
        return f"{self.name} - {self.school.name}"