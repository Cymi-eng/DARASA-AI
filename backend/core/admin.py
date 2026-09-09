from django.contrib import admin
from .models import Student

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('admission_number', 'first_name', 'last_name', 'grade', 'guardian_phone')
    list_filter = ('grade',)
    search_fields = ('first_name', 'last_name', 'admission_number')