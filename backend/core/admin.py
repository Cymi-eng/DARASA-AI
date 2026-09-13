from django.contrib import admin
from .models import Student, Competency, School, ClassRoom, Teacher, FeePayment

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('admission_number', 'first_name', 'last_name', 'grade', 'school', 'classroom', 'guardian_phone')
    list_filter = ('grade', 'school')
    search_fields = ('first_name', 'last_name', 'admission_number')


@admin.register(Competency)
class CompetencyAdmin(admin.ModelAdmin):
    list_display = ('student', 'learning_area', 'strand', 'mastery_level', 'assessed_on')
    list_filter = ('learning_area', 'mastery_level', 'assessed_on')
    search_fields = ('student__first_name', 'student__last_name', 'student__admission_number', 'strand')


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ('name', 'location', 'phone')
    search_fields = ('name',)


@admin.register(ClassRoom)
class ClassRoomAdmin(admin.ModelAdmin):
    list_display = ('name', 'grade', 'school')
    list_filter = ('school', 'grade')


@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = ('user', 'school', 'phone')
    list_filter = ('school',)


@admin.register(FeePayment)
class FeePaymentAdmin(admin.ModelAdmin):
    list_display = ('student', 'amount', 'status', 'phone_number', 'paid_at')
    list_filter = ('status',)
    search_fields = ('student__first_name', 'student__last_name', 'mpesa_receipt_number')