from django.db import models

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
    guardian_phone = models.CharField(max_length=15, blank=True)  # for M-Pesa/Daraja matching later
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.admission_number})"


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
        # extend per CBC subject list as needed
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