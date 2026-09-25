from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from core.models import (
    School,
    UserProfile,
    Student,
    ClassRoom,
    Teacher,
    Competency,
    FeePayment,
    FeeLedgerEntry,
    Notification,
)


User = get_user_model()


class Command(BaseCommand):
    help = "Create a realistic temporary Darasa-AI demonstration dataset."

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(
            self.style.WARNING(
                "Creating Darasa-AI demonstration data..."
            )
        )

        school, _ = School.objects.get_or_create(
            name="Darasa-AI Demonstration School",
            defaults={
                "location": "Nairobi, Kenya",
                "phone": "0700000000",
            },
        )

        classrooms_data = [
            ("PP1 Sunshine", "PP1"),
            ("PP2 Rainbow", "PP2"),
            ("Grade 1 Blue", "G1"),
            ("Grade 1 Green", "G1"),
            ("Grade 2 Blue", "G2"),
            ("Grade 2 Green", "G2"),
            ("Grade 3 Blue", "G3"),
            ("Grade 3 Green", "G3"),
            ("Grade 4 Blue", "G4"),
            ("Grade 5 Blue", "G5"),
            ("Grade 6 Blue", "G6"),
        ]

        classrooms = {}

        for name, grade in classrooms_data:
            classroom, _ = ClassRoom.objects.get_or_create(
                school=school,
                name=name,
                defaults={
                    "grade": grade,
                },
            )

            classrooms[name] = classroom

        teachers_data = [
            (
                "jane.wanjiku",
                "Jane",
                "Wanjiku",
                "jane.wanjiku@darasa-demo.ac.ke",
                "0711000001",
                "Grade 1 Blue",
            ),
            (
                "peter.kiptoo",
                "Peter",
                "Kiptoo",
                "peter.kiptoo@darasa-demo.ac.ke",
                "0711000002",
                "Grade 2 Blue",
            ),
            (
                "mary.achieng",
                "Mary",
                "Achieng",
                "mary.achieng@darasa-demo.ac.ke",
                "0711000003",
                "Grade 3 Blue",
            ),
            (
                "david.omondi",
                "David",
                "Omondi",
                "david.omondi@darasa-demo.ac.ke",
                "0711000004",
                "Grade 4 Blue",
            ),
            (
                "grace.njeri",
                "Grace",
                "Njeri",
                "grace.njeri@darasa-demo.ac.ke",
                "0711000005",
                "Grade 5 Blue",
            ),
            (
                "samuel.kipchoge",
                "Samuel",
                "Kipchoge",
                "samuel.kipchoge@darasa-demo.ac.ke",
                "0711000006",
                "Grade 6 Blue",
            ),
        ]

        teachers = []

        for (
            username,
            first_name,
            last_name,
            email,
            phone,
            classroom_name,
        ) in teachers_data:
            user, _ = User.objects.get_or_create(
                username=username,
                defaults={
                    "first_name": first_name,
                    "last_name": last_name,
                    "email": email,
                },
            )

            user.first_name = first_name
            user.last_name = last_name
            user.email = email
            user.set_password("DemoTeacher123!")
            user.save()

            profile, _ = UserProfile.objects.get_or_create(
                user=user,
            )

            profile.school = school
            profile.role = UserProfile.ROLE_TEACHER
            profile.save(
                update_fields=[
                    "school",
                    "role",
                ]
            )

            teacher, _ = Teacher.objects.get_or_create(
                user=user,
                defaults={
                    "school": school,
                    "phone": phone,
                },
            )

            teacher.school = school
            teacher.phone = phone
            teacher.save(
                update_fields=[
                    "school",
                    "phone",
                ]
            )

            teacher.classrooms.set(
                [classrooms[classroom_name]]
            )

            teachers.append(teacher)

        first_names = [
            "Brian",
            "Faith",
            "Kevin",
            "Sharon",
            "Daniel",
            "Mercy",
            "Collins",
            "Brenda",
            "Ian",
            "Amina",
            "Victor",
            "Winnie",
            "Mark",
            "Joy",
            "Dennis",
            "Cynthia",
            "Eric",
            "Lydia",
            "Felix",
            "Ann",
        ]

        last_names = [
            "Kamau",
            "Wambui",
            "Kiptoo",
            "Achieng",
            "Otieno",
            "Njeri",
            "Mwangi",
            "Omondi",
            "Kiprotich",
            "Mutua",
        ]

        learning_areas = [
            ("MATH", "Numbers and Operations"),
            ("ENG", "Reading and Comprehension"),
            ("KIS", "Kusoma na Kuandika"),
            ("SCI", "Living Things and Environment"),
            ("SST", "Our Community"),
        ]

        mastery_levels = ["EE", "ME", "ME", "AE", "BE"]

        students = []

        for index in range(60):
            first_name = first_names[index % len(first_names)]
            last_name = last_names[index % len(last_names)]

            grade_index = index % 6

            grades = [
                "G1",
                "G2",
                "G3",
                "G4",
                "G5",
                "G6",
            ]

            grade = grades[grade_index]

            grade_classrooms = [
                classroom
                for classroom in classrooms.values()
                if classroom.grade == grade
            ]

            classroom = grade_classrooms[
                index % len(grade_classrooms)
            ]

            admission_number = (
                f"DARASA-{index + 1:04d}"
            )

            student, _ = Student.objects.get_or_create(
                admission_number=admission_number,
                defaults={
                    "first_name": first_name,
                    "last_name": last_name,
                    "grade": grade,
                    "date_of_birth": date(
                        2015 + grade_index,
                        1 + (index % 10),
                        1 + (index % 20),
                    ),
                    "guardian_name": (
                        f"{last_name} Guardian"
                    ),
                    "guardian_phone": (
                        f"0722{index + 1:06d}"
                    ),
                    "school": school,
                    "classroom": classroom,
                },
            )

            student.first_name = first_name
            student.last_name = last_name
            student.grade = grade
            student.school = school
            student.classroom = classroom
            student.guardian_name = (
                f"{last_name} Guardian"
            )
            student.guardian_phone = (
                f"0722{index + 1:06d}"
            )
            student.save()

            students.append(student)

            for area_index, (
                learning_area,
                strand,
            ) in enumerate(learning_areas):
                assessed_on = (
                    date.today()
                    - timedelta(
                        days=area_index * 8
                    )
                )

                mastery_level = mastery_levels[
                    (index + area_index) % len(mastery_levels)
                ]

                Competency.objects.update_or_create(
                    student=student,
                    learning_area=learning_area,
                    strand=strand,
                    assessed_on=assessed_on,
                    defaults={
                        "sub_strand": (
                            "Demonstration of "
                            "competency"
                        ),
                        "mastery_level": mastery_level,
                        "teacher_notes": (
                            "Demo assessment data "
                            "for presentation."
                        ),
                    },
                )

        for index, student in enumerate(students[:30]):
            amount = Decimal(
                5000 + ((index % 5) * 2500)
            )

            transaction_id = (
                f"DEMO-TXN-{index + 1:04d}"
            )

            payment, _ = FeePayment.objects.get_or_create(
                transaction_id=transaction_id,
                defaults={
                    "student": student,
                    "amount": amount,
                    "mpesa_receipt_number": (
                        f"DEMO{index + 1:06d}"
                    ),
                    "phone_number": (
                        f"0722{index + 1:06d}"
                    ),
                    "status": "CONFIRMED",
                    "paid_at": date.today(),
                },
            )

            FeeLedgerEntry.objects.get_or_create(
                payment=payment,
                entry_type="PAYMENT",
                defaults={
                    "student": student,
                    "amount": amount,
                    "reference": transaction_id,
                    "description": (
                        "Demonstration school "
                        "fee payment."
                    ),
                },
            )

        for index, student in enumerate(students[:15]):
            Notification.objects.get_or_create(
                school=school,
                student=student,
                recipient_type="GUARDIAN",
                recipient=student.guardian_phone,
                channel="SMS",
                subject="Darasa-AI Demo",
                defaults={
                    "message": (
                        "Darasa-AI demonstration "
                        "notification: your child's "
                        "learning progress has been "
                        "updated."
                    ),
                    "status": "SENT",
                    "sent_at": date.today(),
                },
            )

        self.stdout.write("")
        self.stdout.write(
            self.style.SUCCESS(
                "Darasa-AI demonstration data created successfully."
            )
        )

        self.stdout.write(
            f"School: {school.name}"
        )

        self.stdout.write(
            f"Classrooms: {ClassRoom.objects.filter(school=school).count()}"
        )

        self.stdout.write(
            f"Teachers: {Teacher.objects.filter(school=school).count()}"
        )

        self.stdout.write(
            f"Students: {Student.objects.filter(school=school).count()}"
        )

        self.stdout.write(
            "Demo teacher password: DemoTeacher123!"
        )