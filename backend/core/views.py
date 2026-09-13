from rest_framework import viewsets, permissions
from .models import Student, Competency, School, ClassRoom, Teacher, FeePayment
from .serializers import (
    StudentSerializer, CompetencySerializer, SchoolSerializer,
    ClassRoomSerializer, TeacherSerializer, FeePaymentSerializer
)


class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]


class CompetencyViewSet(viewsets.ModelViewSet):
    queryset = Competency.objects.all()
    serializer_class = CompetencySerializer
    permission_classes = [permissions.IsAuthenticated]


class SchoolViewSet(viewsets.ModelViewSet):
    queryset = School.objects.all()
    serializer_class = SchoolSerializer
    permission_classes = [permissions.IsAuthenticated]


class ClassRoomViewSet(viewsets.ModelViewSet):
    queryset = ClassRoom.objects.all()
    serializer_class = ClassRoomSerializer
    permission_classes = [permissions.IsAuthenticated]


class TeacherViewSet(viewsets.ModelViewSet):
    queryset = Teacher.objects.all()
    serializer_class = TeacherSerializer
    permission_classes = [permissions.IsAuthenticated]


class FeePaymentViewSet(viewsets.ModelViewSet):
    queryset = FeePayment.objects.all()
    serializer_class = FeePaymentSerializer
    permission_classes = [permissions.IsAuthenticated]