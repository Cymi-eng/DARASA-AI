from django.db import models
from django.contrib.auth.models import User

from .school import School
from .classroom import ClassRoom


class Teacher(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
    )

    school = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        related_name="teachers",
    )

    classrooms = models.ManyToManyField(
        ClassRoom,
        related_name="teachers",
        blank=True,
    )

    phone = models.CharField(
        max_length=15,
        blank=True,
    )

    def __str__(self):
        return self.user.get_full_name() or self.user.username