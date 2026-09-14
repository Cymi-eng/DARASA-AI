from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from .models import School, Student, UserProfile


User = get_user_model()


class SchoolIsolationTests(APITestCase):
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

        self.user_a = User.objects.create_user(
            username="admin_a",
            password="StrongPassword123!",
        )

        self.user_b = User.objects.create_user(
            username="admin_b",
            password="StrongPassword123!",
        )

        UserProfile.objects.create(
            user=self.user_a,
            school=self.school_a,
            role="ADMIN",
        )

        UserProfile.objects.create(
            user=self.user_b,
            school=self.school_b,
            role="ADMIN",
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

    def authenticate(self, user):
        refresh = RefreshToken.for_user(user)

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}"
        )

    def test_user_only_sees_students_from_own_school(self):
        self.authenticate(self.user_a)

        response = self.client.get(
            reverse("student-list")
        )

        self.assertEqual(response.status_code, 200)

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
        self.authenticate(self.user_a)

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

    def test_school_a_user_cannot_create_student_for_school_b(self):
        self.authenticate(self.user_a)

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
            201,
        )

        student = Student.objects.get(
            admission_number="DARASA003"
        )

        self.assertEqual(
            student.school_id,
            self.school_a.id,
        )

        self.assertNotEqual(
            student.school_id,
            self.school_b.id,
        )