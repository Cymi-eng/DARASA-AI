from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
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

        # ---------------------------------------------------------
        # 1. FIND THE ADMINISTRATOR'S SCHOOL
        # ---------------------------------------------------------
        admin_username = "simi"

        try:
            admin_user = User.objects.select_related(
                "profile",
                "profile__school",
            ).get(username=admin_username)
        except User.DoesNotExist:
            raise CommandError(
                f"Administrator '{admin_username}' does not exist."
            )

        profile = getattr(admin_user, "profile", None)

        if not profile or not profile.school_id:
            raise CommandError(
                f"Administrator '{admin_username}' is not associated with a school."
            )

        school = profile.school

        self.stdout.write(
            f"Using school: {school.name}"
        )

        # ---------------------------------------------------------
        # 2. CREATE / UPDATE CLASSROOMS
        # ---------------------------------------------------------
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

            classroom.grade = grade
            classroom.school = school
            classroom.save(
                update_fields=[
                    "grade",
                    "school",
                ]
            )

            classrooms[name] = classroom

        # ---------------------------------------------------------
        # 3. CREATE / UPDATE DEMO TEACHERS
        # ---------------------------------------------------------
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

            # Assign teacher to their demonstration classroom.
            teacher.classrooms.set(
                [classrooms[classroom_name]]
            )

            teachers.append(teacher)

        # ---------------------------------------------------------
        # 4. DEMO STUDENT DATA
        # ---------------------------------------------------------
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

        grades = [
            "G1",
            "G2",
            "G3",
            "G4",
            "G5",
            "G6",
        ]

        learning_areas = [
            ("MATH", "Numbers and Operations"),
            ("ENG", "Reading and Comprehension"),
            ("KIS", "Kusoma na Kuandika"),
            ("SCI", "Living Things and Environment"),
            ("SST", "Our Community"),
        ]

        mastery_levels = [
            "EE",
            "ME",
            "ME",
            "AE",
            "BE",
        ]

        students = []

        # ---------------------------------------------------------
        # 5. CREATE / UPDATE 60 STUDENTS
        # ---------------------------------------------------------
        for index in range(60):
            first_name = first_names[
                index % len(first_names)
            ]

            last_name = last_names[
                index % len(last_names)
            ]

            grade_index = index % len(grades)
            grade = grades[grade_index]

            # Get all classrooms belonging to this grade.
            grade_classrooms = [
                classroom
                for classroom in classrooms.values()
                if classroom.grade == grade
            ]

            if not grade_classrooms:
                raise CommandError(
                    f"No classroom exists for grade '{grade}'."
                )

            # Distribute students across the available
            # classrooms for their grade.
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

            # IMPORTANT:
            # Always update these fields, even when the
            # student already exists.
            #
            # This fixes previously-created students that
            # had classroom=NULL.
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

            student.save(
                update_fields=[
                    "first_name",
                    "last_name",
                    "grade",
                    "school",
                    "classroom",
                    "guardian_name",
                    "guardian_phone",
                ]
            )

            students.append(student)

            # -----------------------------------------------------
            # 6. CREATE CBC ASSESSMENTS
            # -----------------------------------------------------
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
                    (index + area_index)
                    % len(mastery_levels)
                ]

                Competency.objects.update_or_create(
                    student=student,
                    learning_area=learning_area,
                    strand=strand,
                    assessed_on=assessed_on,
                    defaults={
                        "sub_strand": (
                            "Demonstration of competency"
                        ),
                        "mastery_level": mastery_level,
                        "teacher_notes": (
                            "Demo assessment data "
                            "for presentation."
                        ),
                    },
                )

        # ---------------------------------------------------------
        # 7. DEMO FEE PAYMENTS
        # ---------------------------------------------------------
        for index, student in enumerate(
            students[:30]
        ):
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

            # Keep existing demo payment linked to the
            # correct student as well.
            payment.student = student
            payment.amount = amount
            payment.status = "CONFIRMED"
            payment.paid_at = date.today()

            payment.save(
                update_fields=[
                    "student",
                    "amount",
                    "status",
                    "paid_at",
                ]
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

        # ---------------------------------------------------------
        # 8. DEMO NOTIFICATIONS
        # ---------------------------------------------------------
        for index, student in enumerate(
            students[:15]
        ):
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

        # ---------------------------------------------------------
        # 9. FINAL SUMMARY
        # ---------------------------------------------------------
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
            f"Classrooms: "
            f"{ClassRoom.objects.filter(school=school).count()}"
        )

        self.stdout.write(
            f"Teachers: "
            f"{Teacher.objects.filter(school=school).count()}"
        )

        self.stdout.write(
            f"Students: "
            f"{Student.objects.filter(school=school).count()}"
        )

        assigned_students = Student.objects.filter(
            school=school,
            classroom__isnull=False,
        ).count()

        unassigned_students = Student.objects.filter(
            school=school,
            classroom__isnull=True,
        ).count()

        self.stdout.write(
            f"Students assigned to classrooms: "
            f"{assigned_students}"
        )

        self.stdout.write(
            f"Students without classrooms: "
            f"{unassigned_students}"
        )

        self.stdout.write(
            f"Competencies: "
            f"{Competency.objects.filter(student__school=school).count()}"
        )

        self.stdout.write(
            f"Fee Payments: "
            f"{FeePayment.objects.filter(student__school=school).count()}"
        )

        self.stdout.write(
            f"Notifications: "
            f"{Notification.objects.filter(school=school).count()}"
        )

        self.stdout.write(
            "Demo teacher password: DemoTeacher123!"
        )