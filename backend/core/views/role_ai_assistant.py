
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Competency, Student, Teacher


class RoleAIAssistantView(APIView):
    """
    Built-in AI assistant for student and teacher accounts.
    Does not modify the existing admin assistant.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        message = str(request.data.get("message", "")).strip()

        if not message:
            return Response(
                {"success": False, "message": "Please enter a question."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user

        student = Student.objects.filter(user=user).select_related(
            "school", "classroom"
        ).first()

        if student:
            return self.student_response(message, student)

        teacher = Teacher.objects.filter(user=user).select_related(
            "school", "user"
        ).prefetch_related("classrooms").first()

        if teacher:
            return self.teacher_response(message, teacher)

        return Response(
            {
                "success": False,
                "message": "This assistant is available to linked student and teacher accounts.",
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    def student_response(self, message, student):
        records = list(
            Competency.objects.filter(student=student)
            .order_by("-assessed_on", "-created_at")[:100]
        )

        name = student.first_name or "learner"
        question = message.lower()

        if not records:
            answer = (
                f"Hello {name}! I'm your DARASA-AI study assistant. "
                "There are no competency assessments recorded yet. "
                "You can start by reviewing today's lessons, practising "
                "questions, and asking your teacher for feedback."
            )
        else:
            levels = {"BE": 1, "AE": 2, "ME": 3, "EE": 4}
            scored = [
                (record, levels.get(str(record.mastery_level).upper()))
                for record in records
            ]
            scored = [(record, score) for record, score in scored if score]

            weaker = [
                record for record, score in scored if score <= 2
            ]
            stronger = [
                record for record, score in scored if score >= 3
            ]

            if any(word in question for word in [
                "weak", "struggling", "improve", "difficult", "help"
            ]):
                areas = list(dict.fromkeys(
                    record.get_learning_area_display()
                    for record in weaker
                ))
                answer = (
                    f"Hello {name}! Based on your recorded assessments, "
                    + (
                        "focus first on " + ", ".join(areas[:3]) + ". "
                        if areas
                        else "your recorded results do not show a BE/AE area right now. "
                    )
                    + "Revise one concept at a time, practise questions, "
                    "and ask your teacher to check your understanding."
                )
            elif any(word in question for word in [
                "strong", "strength", "best", "good at"
            ]):
                areas = list(dict.fromkeys(
                    record.get_learning_area_display()
                    for record in stronger
                ))
                answer = (
                    "Your recorded assessments show stronger results in "
                    + (", ".join(areas[:3]) if areas else "areas that need more assessment")
                    + ". Keep practising while reviewing topics you find difficult."
                )
            elif any(word in question for word in [
                "study", "revision", "revise", "today", "practice"
            ]):
                areas = list(dict.fromkeys(
                    record.get_learning_area_display()
                    for record in weaker
                ))
                focus = areas[:2] or list(dict.fromkeys(
                    record.get_learning_area_display() for record in records
                ))[:2]
                answer = (
                    "Here is your study plan: spend 10 minutes reviewing "
                    "your notes, 20 minutes practising questions, and 5 minutes "
                    "checking your answers. Prioritise "
                    + (", ".join(focus) if focus else "your most recent lessons")
                    + ". Ask your teacher about anything you cannot explain."
                )
            else:
                answer = (
                    f"Hello {name}! I can help you plan revision, understand "
                    "your competency results, and choose what to practise next. "
                    "Try asking: 'What should I study?', 'Where can I improve?', "
                    "or 'What are my strengths?'"
                )

        return Response({
            "success": True,
            "response": answer,
            "context": {"user_role": "STUDENT"},
        })

    def teacher_response(self, message, teacher):
        classrooms = list(teacher.classrooms.all())
        students = list(
            Student.objects.filter(classroom__in=classrooms).distinct()
        )
        competencies = list(
            Competency.objects.filter(student__in=students)
            .order_by("-assessed_on", "-created_at")[:500]
        )

        question = message.lower()
        support = [
            record for record in competencies
            if str(record.mastery_level).upper() in {"BE", "AE"}
        ]

        if any(word in question for word in [
            "support", "struggling", "intervention", "at risk", "weak learners"
        ]):
            if not support:
                answer = (
                    "The recorded assessments do not currently identify BE/AE "
                    "mastery levels. Continue monitoring learner progress and "
                    "record follow-up assessments where needed."
                )
            else:
                areas = list(dict.fromkeys(
                    record.get_learning_area_display() for record in support
                ))
                answer = (
                    f"There are {len(support)} BE/AE assessment records across "
                    f"{len(students)} learners. Consider targeted small-group "
                    "support in " + ", ".join(areas[:4]) +
                    ". Check each learner's latest evidence before planning intervention."
                )
        elif any(word in question for word in [
            "lesson", "teach", "teaching", "next lesson", "plan"
        ]):
            answer = (
                "Suggested lesson structure: 1) State the CBC learning outcome. "
                "2) Connect it to prior knowledge. 3) Model the skill. "
                "4) Guide learners through an activity. 5) Let learners practise "
                "independently. 6) Use a short formative assessment and record "
                "the evidence. Adapt the activity to your learners' grade and needs."
            )
        elif any(word in question for word in [
            "class", "classroom", "learner", "student", "overview", "progress"
        ]):
            answer = (
                f"Your linked teaching workspace contains {len(classrooms)} "
                f"classroom(s) and {len(students)} learner(s), with "
                f"{len(competencies)} recent competency record(s) available. "
                f"{len(support)} records are at BE/AE levels. Review these records "
                "to identify specific learners and competencies needing follow-up."
            )
        else:
            answer = (
                "Hello! I'm your DARASA-AI teaching assistant. I can help with "
                "CBC lesson planning, classroom overviews, competency results, "
                "and intervention ideas. Try asking: 'Which learners need support?' "
                "or 'Help me plan my next lesson.'"
            )

        return Response({
            "success": True,
            "response": answer,
            "context": {
                "user_role": "TEACHER",
                "classroom_count": len(classrooms),
                "student_count": len(students),
                "assessment_count": len(competencies),
            },
        })
