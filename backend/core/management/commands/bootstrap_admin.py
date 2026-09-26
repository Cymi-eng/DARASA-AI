import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from core.models import School, UserProfile


class Command(BaseCommand):
    help = "Create or update the Darasa-AI production administrator."

    def handle(self, *args, **options):
        username = os.getenv("DJANGO_ADMIN_USERNAME")
        password = os.getenv("DJANGO_ADMIN_PASSWORD")
        school_name = os.getenv(
            "DJANGO_ADMIN_SCHOOL_NAME",
            "Darasa-AI School",
        )

        if not username:
            raise CommandError(
                "DJANGO_ADMIN_USERNAME environment variable is required."
            )

        if not password:
            raise CommandError(
                "DJANGO_ADMIN_PASSWORD environment variable is required."
            )

        if len(password) < 8:
            raise CommandError(
                "DJANGO_ADMIN_PASSWORD must contain at least 8 characters."
            )

        User = get_user_model()

        school, _ = School.objects.get_or_create(
            name=school_name,
        )

        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "is_staff": True,
                "is_superuser": True,
                "is_active": True,
            },
        )

        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.set_password(password)
        user.save(
            update_fields=[
                "password",
                "is_staff",
                "is_superuser",
                "is_active",
            ]
        )

        profile, _ = UserProfile.objects.get_or_create(
            user=user,
        )

        profile.school = school
        profile.role = "ADMIN"
        profile.save(
            update_fields=[
                "school",
                "role",
            ]
        )

        if created:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Production administrator '{username}' created "
                    f"and assigned to '{school.name}'."
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Production administrator '{username}' updated "
                    f"and assigned to '{school.name}'."
                )
            )