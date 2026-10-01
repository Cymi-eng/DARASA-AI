
from django.contrib.auth.models import User

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Competency, Student


class AIAssistantView(APIView):
    """
    DARASA-AI Assistant API.

    First phase:
    - Requires authentication.
    - Identifies the authenticated user's student/school context.
    - Retrieves relevant competency data.
    - Returns structured context for the AI layer.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        message = request.data.get("message", "").strip()

        if not message:
            return Response(
                {
                    "success": False,
                    "message": "Please provide a message.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user
        student = self._get_student(user)

        if student:
            competencies = (
                Competency.objects
                .filter(student=student)
                .select_related("student")
                .order_by("-assessed_on", "-created_at")[:20]
            )

            competency_context = [
                {
                    "learning_area": competency.get_learning_area_display(),
                    "strand": competency.strand,
                    "sub_strand": competency.sub_strand,
                    "mastery_level": competency.mastery_level,
                    "mastery_label": competency.get_mastery_level_display(),
                    "assessed_on": competency.assessed_on.isoformat(),
                    "teacher_notes": competency.teacher_notes,
                }
                for competency in competencies
            ]

            return Response(
                {
                    "success": True,
                    "message": message,
                    "context": {
                        "user_role": "STUDENT",
                        "student": {
                            "id": student.id,
                            "name": (
                                f"{student.first_name} "
                                f"{student.last_name}"
                            ),
                            "admission_number": student.admission_number,
                            "grade": student.grade,
                            "school": (
                                student.school.name
                                if student.school
                                else None
                            ),
                        },
                        "competencies": competency_context,
                    },
                    "response": (
                        "I have reviewed your competency data. "
                        "The AI response layer will be connected next."
                    ),
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {
                "success": True,
                "message": message,
                "context": {
                    "user_role": "SCHOOL_USER",
                    "school": self._get_school_context(user),
                },
                "response": (
                    "I have received your request. "
                    "The school data context is ready for the AI layer."
                ),
            },
            status=status.HTTP_200_OK,
        )

    @staticmethod
    def _get_student(user):
        try:
            return Student.objects.select_related(
                "school",
                "classroom",
                "user",
            ).get(user=user)
        except Student.DoesNotExist:
            return None

    @staticmethod
    def _get_school_context(user):
        try:
            profile = user.profile
            school = getattr(profile, "school", None)

            if school:
                return {
                    "id": school.id,
                    "name": school.name,
                    "location": school.location,
                }

        except AttributeError:
            pass

        return None

