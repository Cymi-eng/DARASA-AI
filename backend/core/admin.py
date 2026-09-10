from django.contrib import admin
from .models import Student, Competency

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('admission_number', 'first_name', 'last_name', 'grade', 'guardian_phone')
    list_filter = ('grade',)
    search_fields = ('first_name', 'last_name', 'admission_number')


@admin.register(Competency)
class CompetencyAdmin(admin.ModelAdmin):
    list_display = ('student', 'learning_area', 'strand', 'mastery_level', 'assessed_on')
    list_filter = ('learning_area', 'mastery_level', 'assessed_on')
    search_fields = ('student__first_name', 'student__last_name', 'student__admission_number', 'strand')