from django.db import models
from django.contrib.auth.models import User


class School(models.Model):
    name = models.CharField(max_length=200)
    location = models.CharField(max_length=200, blank=True)
    phone = models.CharField(max_length=15, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Student(models.Model):
    GRADE_CHOICES = [
        ('PP1', 'Pre-Primary 1'),
        ('PP2', 'Pre-Primary 2'),
        ('G1', 'Grade 1'),
        ('G2', 'Grade 2'),
        ('G3', 'Grade 3'),
        ('G4', 'Grade 4'),
        ('G5', 'Grade 5'),
        ('G6', 'Grade 6'),
        # extend as needed for JSS/Senior School
    ]

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    admission_number = models.CharField(max_length=20, unique=True)
    grade = models.CharField(max_length=10, choices=GRADE_CHOICES)
    date_of_birth = models.DateField(null=True, blank=True)
    guardian_name = models.CharField(max_length=150, blank=True)
    guardian_phone = models.CharField(max_length=15, blank=True)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='students', null=True, blank=True)
    classroom = models.ForeignKey('ClassRoom', on_delete=models.SET_NULL, related_name='students', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.admission_number})"


class ClassRoom(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='classrooms')
    name = models.CharField(max_length=50)
    grade = models.CharField(max_length=10, choices=Student.GRADE_CHOICES)

    def __str__(self):
        return f"{self.name} - {self.school.name}"


class Teacher(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='teachers')
    classrooms = models.ManyToManyField(ClassRoom, related_name='teachers', blank=True)
    phone = models.CharField(max_length=15, blank=True)

    def __str__(self):
        return self.user.get_full_name() or self.user.username


class Competency(models.Model):
    LEARNING_AREA_CHOICES = [
        ('MATH', 'Mathematics'),
        ('ENG', 'English'),
        ('KIS', 'Kiswahili'),
        ('SCI', 'Science & Technology'),
        ('SST', 'Social Studies'),
        ('CRE', 'Christian Religious Education'),
        ('CA', 'Creative Arts'),
        ('AGR', 'Agriculture'),
    ]

    MASTERY_LEVELS = [
        ('EE', 'Exceeds Expectation'),
        ('ME', 'Meets Expectation'),
        ('AE', 'Approaches Expectation'),
        ('BE', 'Below Expectation'),
    ]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='competencies')
    learning_area = models.CharField(max_length=10, choices=LEARNING_AREA_CHOICES)
    strand = models.CharField(max_length=150)
    sub_strand = models.CharField(max_length=150, blank=True)
    mastery_level = models.CharField(max_length=2, choices=MASTERY_LEVELS)
    assessed_on = models.DateField()
    teacher_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-assessed_on']

    def __str__(self):
        return f"{self.student} - {self.learning_area} ({self.mastery_level}) on {self.assessed_on}"


class FeePayment(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('CONFIRMED', 'Confirmed'),
        ('FAILED', 'Failed'),
    ]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='fee_payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    mpesa_receipt_number = models.CharField(max_length=30, blank=True)
    phone_number = models.CharField(max_length=15)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    paid_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student} - KES {self.amount} ({self.status})"