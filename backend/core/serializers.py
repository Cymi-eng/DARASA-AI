from rest_framework import serializers
from .models import Student, Competency, School, ClassRoom, Teacher, FeePayment


class CompetencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Competency
        fields = '__all__'


class FeePaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeePayment
        fields = '__all__'


class StudentSerializer(serializers.ModelSerializer):
    competencies = CompetencySerializer(many=True, read_only=True)
    fee_payments = FeePaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Student
        fields = '__all__'


class ClassRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassRoom
        fields = '__all__'


class SchoolSerializer(serializers.ModelSerializer):
    classrooms = ClassRoomSerializer(many=True, read_only=True)

    class Meta:
        model = School
        fields = '__all__'


class TeacherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Teacher
        fields = '__all__'