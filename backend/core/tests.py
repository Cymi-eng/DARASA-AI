from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    ClassRoom,
    Competency,
    FeePayment,
    School,
    Student,
    Teacher,
    UserProfile,
)


User = get_user_model()


class DarasaAPITestCase(APITestCase):
    def setUp(self):
        self.school_a = School.objects.create(
            name="Darasa Academy",
            location="Nairobi",
            phone="0700000001",
        )

        self.school_b = School.objects.create(
            name="Future Scholars",
            location="Mombasa",
            phone="0700000002",
        )

        self.admin = self.create_user(
            "admin_a",
            "ADMIN",
            self.school_a,
        )

        self.teacher = self.create_user(
            "teacher_a",
            "TEACHER",
            self.school_a,
        )

        self.bursar = self.create_user(
            "bursar_a",
            "BURSAR",
            self.school_a,
        )

        self.other_school_admin = self.create_user(
            "admin_b",
            "ADMIN",
            self.school_b,
        )

        self.student_a = Student.objects.create(
            first_name="John",
            last_name="Kamau",
            admission_number="DARASA001",
            grade="G1",
            school=self.school_a,
        )

        self.student_b = Student.objects.create(
            first_name="Mary",
            last_name="Achieng",
            admission_number="DARASA002",
            grade="G1",
            school=self.school_b,
        )

        self.classroom_a = ClassRoom.objects.create(
            school=self.school_a,
            name="Grade 1 Blue",
            grade="G1",
        )

        self.classroom_b = ClassRoom.objects.create(
            school=self.school_b,
            name="Grade 1 Red",
            grade="G1",
        )

        self.teacher_record = Teacher.objects.create(
            user=self.teacher,
            school=self.school_a,
            phone="0711111111",
        )

        self.payment_a = FeePayment.objects.create(
            student=self.student_a,
            amount="5000.00",
            status="CONFIRMED",
        )

    def create_user(self, username, role, school):
        user = User.objects.create_user(
            username=username,
            password="StrongPassword123!",
        )

        UserProfile.objects.create(
            user=user,
            school=school,
            role=role,
        )

        return user

    def authenticate(self, user):
        refresh = RefreshToken.for_user(user)

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}"
        )


class SchoolIsolationTests(DarasaAPITestCase):

    def test_user_only_sees_students_from_own_school(self):
        self.authenticate(self.admin)

        response = self.client.get(
            reverse("student-list")
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        student_ids = [
            student["id"]
            for student in response.data
        ]

        self.assertIn(
            self.student_a.id,
            student_ids,
        )

        self.assertNotIn(
            self.student_b.id,
            student_ids,
        )

    def test_user_cannot_access_student_from_another_school(self):
        self.authenticate(self.admin)

        response = self.client.get(
            reverse(
                "student-detail",
                args=[self.student_b.id],
            )
        )

        self.assertEqual(
            response.status_code,
            404,
        )

    def test_user_cannot_create_student_for_another_school(self):
        self.authenticate(self.admin)

        response = self.client.post(
            reverse("student-list"),
            {
                "first_name": "Peter",
                "last_name": "Otieno",
                "admission_number": "DARASA003",
                "grade": "G1",
                "school": self.school_b.id,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.assertIn(
            "school",
            response.data,
        )

        self.assertEqual(
            Student.objects.filter(
                admission_number="DARASA003"
            ).count(),
            0,
        )


class RoleAccessTests(DarasaAPITestCase):

    def test_admin_can_access_students(self):
        self.authenticate(self.admin)

        response = self.client.get(
            reverse("student-list")
        )

        self.assertEqual(
            response.status_code,
            200,
        )

    def test_teacher_can_access_students(self):
        self.authenticate(self.teacher)

        response = self.client.get(
            reverse("student-list")
        )

        self.assertEqual(
            response.status_code,
            200,
        )

    def test_bursar_can_access_fee_payments(self):
        self.authenticate(self.bursar)

        response = self.client.get(
            reverse("feepayment-list")
        )

        self.assertEqual(
            response.status_code,
            200,
        )

    def test_teacher_cannot_access_fee_payments(self):
        self.authenticate(self.teacher)

        response = self.client.get(
            reverse("feepayment-list")
        )

        self.assertEqual(
            response.status_code,
            403,
        )

    def test_bursar_cannot_access_competencies(self):
        self.authenticate(self.bursar)

        response = self.client.get(
            reverse("competency-list")
        )

        self.assertEqual(
            response.status_code,
            403,
        )

    def test_teacher_cannot_manage_teachers(self):
        self.authenticate(self.teacher)

        response = self.client.get(
            reverse("teacher-list")
        )

        self.assertEqual(
            response.status_code,
            403,
        )

    def test_bursar_cannot_manage_teachers(self):
        self.authenticate(self.bursar)

        response = self.client.get(
            reverse("teacher-list")
        )

        self.assertEqual(
            response.status_code,
            403,
        )

    def test_admin_can_access_teachers(self):
        self.authenticate(self.admin)

        response = self.client.get(
            reverse("teacher-list")
        )

        self.assertEqual(
            response.status_code,
            200,
        )


class CrossSchoolSecurityTests(DarasaAPITestCase):

    def test_school_b_admin_cannot_see_school_a_students(self):
        self.authenticate(self.other_school_admin)

        response = self.client.get(
            reverse("student-list")
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        student_ids = [
            student["id"]
            for student in response.data
        ]

        self.assertNotIn(
            self.student_a.id,
            student_ids,
        )

    def test_school_b_admin_cannot_access_school_a_classroom(self):
        self.authenticate(self.other_school_admin)

        response = self.client.get(
            reverse(
                "classroom-detail",
                args=[self.classroom_a.id],
            )
        )

        self.assertEqual(
            response.status_code,
            404,
        )

    def test_school_b_admin_cannot_access_school_a_payment(self):
        self.authenticate(self.other_school_admin)

        response = self.client.get(
            reverse(
                "feepayment-detail",
                args=[self.payment_a.id],
            )
        )

        self.assertEqual(
            response.status_code,
            404,
        )


class AuthenticationTests(DarasaAPITestCase):

    def test_unauthenticated_user_cannot_access_students(self):
        response = self.client.get(
            reverse("student-list")
        )

        self.assertEqual(
            response.status_code,
            401,
        )

    def test_unauthenticated_user_cannot_access_dashboard(self):
        response = self.client.get(
            reverse("dashboard")
        )

        self.assertEqual(
            response.status_code,
            401,
        )