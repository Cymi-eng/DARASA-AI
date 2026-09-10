from rest_framework import serializers
from .models import Student, Competency

class CompetencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Competency
        fields = '__all__'


class StudentSerializer(serializers.ModelSerializer):
    competencies = CompetencySerializer(many=True, read_only=True)

    class Meta:
        model = Student
        fields = '__all__'