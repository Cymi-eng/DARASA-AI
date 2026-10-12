
from collections import defaultdict

from django.contrib.auth.models import User

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Competency, Student, Teacher


class AIAssistantView(APIView):
    """
    DARASA-AI contextual assistant.

    The assistant uses the authenticated user's real school data.

    Supported roles:
    - STUDENT: personalised learning progress and study guidance.
    - TEACHER: classroom, learner, competency and intervention insights.

    The endpoint remains:
        POST /api/ai/assistant/
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        message = str(request.data.get("message", "")).strip()

        if not message:
            return Response(
                {
                    "success": False,
                    "message": "Please provide a message.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user

        teacher = self._get_teacher(user)

        if teacher:
            return self._handle_teacher_request(
                message=message,
                teacher=teacher,
            )

        student = self._get_student(user)

        if student:
            return self._handle_student_request(
                message=message,
                student=student,
            )

        return Response(
            {
                "success": False,
                "message": (
                    "Your DARASA-AI account could not be linked to a "
                    "student or teacher profile. Please contact your "
                    "school administrator."
                ),
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    # ==================================================================
    # STUDENT
    # ==================================================================

    def _handle_student_request(self, message, student):
        competencies = list(
            Competency.objects
            .filter(student=student)
            .select_related("student", "school")
            .order_by("-assessed_on", "-created_at")
        )

        response = self._generate_student_response(
            message=message,
            student=student,
            competencies=competencies,
        )

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
                        ).strip(),
                        "admission_number": student.admission_number,
                        "grade": student.grade,
                        "school": (
                            student.school.name
                            if student.school
                            else None
                        ),
                    },
                    "competencies": self._serialize_competencies(
                        competencies
                    ),
                },
                "response": response,
            },
            status=status.HTTP_200_OK,
        )

    def _generate_student_response(
        self,
        message,
        student,
        competencies,
    ):
        name = student.first_name or "there"

        if not competencies:
            return (
                f"Hi {name}! I don't have enough competency assessments "
                "yet to analyse your learning progress. Once your "
                "teachers record assessments, I can help you understand "
                "your strengths, areas to improve, and what to study "
                "next."
            )

        analysis = self._analyse_competencies(competencies)
        normalized_message = message.lower()

        if self._contains_any(
            normalized_message,
            [
                "struggling",
                "weak",
                "weakest",
                "improve",
                "improvement",
                "difficult",
                "difficulty",
                "need help",
                "help me",
            ],
        ):
            return self._weak_area_response(name, analysis)

        if self._contains_any(
            normalized_message,
            [
                "strong",
                "strength",
                "best",
                "good at",
                "doing well",
            ],
        ):
            return self._strength_response(name, analysis)

        if self._contains_any(
            normalized_message,
            [
                "study",
                "revise",
                "revision",
                "today",
                "learn",
                "practice",
                "what should",
                "focus on",
            ],
        ):
            return self._study_plan_response(name, analysis)

        if self._contains_any(
            normalized_message,
            [
                "progress",
                "performance",
                "doing",
                "results",
                "assessment",
                "overall",
            ],
        ):
            return self._progress_response(name, analysis)

        subject = self._find_subject(
            normalized_message,
            analysis["by_learning_area"],
        )

        if subject:
            return self._subject_response(
                name,
                subject,
                analysis["by_learning_area"][subject],
            )

        return self._general_response(name, analysis)

    # ==================================================================
    # TEACHER
    # ==================================================================

    def _handle_teacher_request(self, message, teacher):
        classrooms = list(
            teacher.classrooms.all().order_by("name")
        )

        classroom_ids = [classroom.id for classroom in classrooms]

        students = list(
            Student.objects
            .filter(classroom_id__in=classroom_ids)
            .select_related("school", "classroom", "user")
            .order_by("first_name", "last_name")
        )

        student_ids = [student.id for student in students]

        competencies = list(
            Competency.objects
            .filter(student_id__in=student_ids)
            .select_related("student", "school")
            .order_by("-assessed_on", "-created_at")
        )

        response = self._generate_teacher_response(
            message=message,
            teacher=teacher,
            classrooms=classrooms,
            students=students,
            competencies=competencies,
        )

        return Response(
            {
                "success": True,
                "message": message,
                "context": {
                    "user_role": "TEACHER",
                    "teacher": {
                        "id": teacher.id,
                        "name": (
                            teacher.user.get_full_name()
                            or teacher.user.username
                        ),
                        "school": (
                            teacher.school.name
                            if teacher.school
                            else None
                        ),
                    },
                    "classrooms": [
                        {
                            "id": classroom.id,
                            "name": classroom.name,
                            "grade": getattr(
                                classroom,
                                "grade",
                                None,
                            ),
                        }
                        for classroom in classrooms
                    ],
                    "students": [
                        self._serialize_student(student)
                        for student in students
                    ],
                    "competencies": self._serialize_competencies(
                        competencies
                    ),
                },
                "response": response,
            },
            status=status.HTTP_200_OK,
        )

    def _generate_teacher_response(
        self,
        message,
        teacher,
        classrooms,
        students,
        competencies,
    ):
        teacher_name = (
            teacher.user.first_name
            or teacher.user.get_full_name()
            or teacher.user.username
        )

        if not students:
            return (
                f"Hi {teacher_name}! I couldn't find any learners "
                "assigned to your classrooms yet. Once learners and "
                "their classroom assignments are available, I can "
                "analyse their competency progress and identify "
                "learners who may need support."
            )

        if not competencies:
            return (
                f"Hi {teacher_name}! I found {len(students)} learner"
                f"{'s' if len(students) != 1 else ''} across "
                f"{len(classrooms)} classroom"
                f"{'s' if len(classrooms) != 1 else ''}, but there are "
                "no competency assessments recorded for them yet. "
                "Once assessments are entered, I can analyse mastery, "
                "learning areas, support needs and teaching priorities."
            )

        analysis = self._analyse_teacher_data(
            students=students,
            competencies=competencies,
        )

        normalized_message = message.lower()

        # --------------------------------------------------------------
        # LEARNERS NEEDING SUPPORT
        # --------------------------------------------------------------

        if self._contains_any(
            normalized_message,
            [
                "support",
                "struggling",
                "struggle",
                "weak learners",
                "learners who need",
                "who needs help",
                "intervention",
                "interventions",
                "at risk",
                "behind",
            ],
        ):
            return self._teacher_support_response(
                teacher_name,
                analysis,
            )

        # --------------------------------------------------------------
        # LEARNING AREAS
        # --------------------------------------------------------------

        if self._contains_any(
            normalized_message,
            [
                "learning area",
                "learning areas",
                "subject",
                "subjects",
                "weak area",
                "weakest area",
                "which area",
            ],
        ):
            return self._teacher_learning_area_response(
                teacher_name,
                analysis,
            )

        # --------------------------------------------------------------
        # MASTERY / PERFORMANCE / PROGRESS
        # --------------------------------------------------------------

        if self._contains_any(
            normalized_message,
            [
                "mastery",
                "performance",
                "progress",
                "overall",
                "results",
                "assessment",
                "how are my learners",
                "how is my class",
            ],
        ):
            return self._teacher_progress_response(
                teacher_name,
                analysis,
            )

        # --------------------------------------------------------------
        # LESSON / TEACHING
        # --------------------------------------------------------------

        if self._contains_any(
            normalized_message,
            [
                "lesson",
                "teach",
                "teaching",
                "next lesson",
                "today",
                "focus on",
                "what should i teach",
                "what should we focus",
            ],
        ):
            return self._teacher_lesson_response(
                teacher_name,
                analysis,
            )

        # --------------------------------------------------------------
        # CLASSROOM
        # --------------------------------------------------------------

        if self._contains_any(
            normalized_message,
            [
                "classroom",
                "class",
                "learners",
                "students",
                "how many",
            ],
        ):
            return self._teacher_classroom_response(
                teacher_name,
                classrooms,
                students,
                analysis,
            )

        # --------------------------------------------------------------
        # SPECIFIC SUBJECT
        # --------------------------------------------------------------

        subject = self._find_subject(
            normalized_message,
            analysis["by_learning_area"],
        )

        if subject:
            return self._teacher_subject_response(
                teacher_name,
                subject,
                analysis["by_learning_area"][subject],
            )

        return self._teacher_general_response(
            teacher_name,
            classrooms,
            students,
            analysis,
        )

    # ==================================================================
    # TEACHER ANALYSIS
    # ==================================================================

    @staticmethod
    def _analyse_teacher_data(students, competencies):
        mastery_scores = {
            "BE": 1,
            "AE": 2,
            "ME": 3,
            "EE": 4,
        }

        student_lookup = {
            student.id: student
            for student in students
        }

        by_student = defaultdict(list)
        by_learning_area = defaultdict(list)

        all_scores = []

        for competency in competencies:
            level = str(
                competency.mastery_level or ""
            ).upper().strip()

            score = mastery_scores.get(level)

            record = {
                "student_id": competency.student_id,
                "student_name": (
                    AIAssistantView._student_name(
                        student_lookup.get(competency.student_id)
                    )
                ),
                "learning_area": (
                    competency.get_learning_area_display()
                ),
                "strand": competency.strand,
                "sub_strand": competency.sub_strand,
                "mastery_level": level,
                "mastery_label": (
                    competency.get_mastery_level_display()
                ),
                "score": score,
                "teacher_notes": competency.teacher_notes or "",
                "assessed_on": (
                    competency.assessed_on.isoformat()
                    if competency.assessed_on
                    else None
                ),
            }

            by_student[competency.student_id].append(record)

            learning_area = (
                competency.get_learning_area_display()
            )

            by_learning_area[learning_area].append(record)

            if score:
                all_scores.append(score)

        area_summary = {}

        for learning_area, records in by_learning_area.items():
            scores = [
                record["score"]
                for record in records
                if record["score"]
            ]

            average = (
                sum(scores) / len(scores)
                if scores
                else 0
            )

            support_count = sum(
                1
                for record in records
                if record["mastery_level"] in {"BE", "AE"}
            )

            area_summary[learning_area] = {
                "records": records,
                "average": average,
                "count": len(records),
                "support_count": support_count,
                "level": AIAssistantView._average_to_level(
                    average
                ),
            }

        learner_summary = []

        for student in students:
            records = by_student.get(student.id, [])

            scores = [
                record["score"]
                for record in records
                if record["score"]
            ]

            average = (
                sum(scores) / len(scores)
                if scores
                else 0
            )

            support_records = [
                record
                for record in records
                if record["mastery_level"] in {"BE", "AE"}
            ]

            learner_summary.append(
                {
                    "student": student,
                    "records": records,
                    "average": average,
                    "assessment_count": len(records),
                    "support_count": len(support_records),
                    "level": (
                        AIAssistantView._average_to_level(
                            average
                        )
                    ),
                }
            )

        overall_average = (
            sum(all_scores) / len(all_scores)
            if all_scores
            else 0
        )

        weakest_areas = sorted(
            area_summary.items(),
            key=lambda item: item[1]["average"],
        )

        strongest_areas = sorted(
            area_summary.items(),
            key=lambda item: item[1]["average"],
            reverse=True,
        )

        learners_needing_support = sorted(
            learner_summary,
            key=lambda item: (
                -item["support_count"],
                item["average"],
            ),
        )

        return {
            "total_students": len(students),
            "total_assessments": len(competencies),
            "overall_average": overall_average,
            "overall_level": AIAssistantView._average_to_level(
                overall_average
            ),
            "by_student": learner_summary,
            "by_learning_area": area_summary,
            "weakest_areas": weakest_areas,
            "strongest_areas": strongest_areas,
            "learners_needing_support": [
                item
                for item in learners_needing_support
                if item["support_count"] > 0
            ],
        }

    # ==================================================================
    # TEACHER RESPONSE BUILDERS
    # ==================================================================

    @staticmethod
    def _teacher_support_response(name, analysis):
        learners = analysis["learners_needing_support"]

        if not learners:
            return (
                f"Hi {name}! Based on the competency assessments "
                "currently recorded, I don't see any learners with "
                "BE or AE mastery levels. Continue monitoring "
                "assessment results and record new evidence as "
                "learners progress."
            )

        parts = [
            f"Hi {name}! I found {len(learners)} learner"
            f"{'s' if len(learners) != 1 else ''} who may need "
            "additional support based on BE or AE assessments:",
            "",
        ]

        for item in learners[:5]:
            student_name = AIAssistantView._student_name(
                item["student"]
            )

            support_areas = []

            for record in item["records"]:
                if record["mastery_level"] in {"BE", "AE"}:
                    area = record["learning_area"]

                    if area not in support_areas:
                        support_areas.append(area)

            areas_text = ", ".join(support_areas[:3])

            parts.append(
                f"• {student_name}: "
                f"{item['support_count']} support-level "
                f"assessment(s)"
                + (
                    f" — focus areas: {areas_text}."
                    if areas_text
                    else "."
                )
            )

        if len(learners) > 5:
            parts.append(
                f"...and {len(learners) - 5} more learner"
                f"{'s' if len(learners) - 5 != 1 else ''}."
            )

        parts.extend(
            [
                "",
                "For intervention, group learners with similar "
                "learning needs, reteach one specific competency at "
                "a time, then record a follow-up assessment to check "
                "whether mastery has improved.",
            ]
        )

        return "\n".join(parts)

    @staticmethod
    def _teacher_learning_area_response(name, analysis):
        areas = analysis["weakest_areas"]

        if not areas:
            return (
                f"Hi {name}! There isn't enough learning-area "
                "assessment data to compare performance yet."
            )

        parts = [
            f"Hi {name}! Here is the current learning-area picture "
            "from the recorded competency assessments:",
            "",
        ]

        for learning_area, data in areas[:5]:
            label = AIAssistantView._level_label(
                data["level"]
            )

            parts.append(
                f"• {learning_area}: {label} "
                f"across {data['count']} assessment(s), "
                f"with {data['support_count']} at BE/AE."
            )

        strongest = analysis["strongest_areas"]

        if strongest:
            parts.extend(
                [
                    "",
                    f"The strongest current learning area by "
                    f"average mastery is {strongest[0][0]}.",
                    "Use the lower-performing areas to plan "
                    "targeted revision and differentiated support.",
                ]
            )

        return "\n".join(parts)

    @staticmethod
    def _teacher_progress_response(name, analysis):
        level = AIAssistantView._level_label(
            analysis["overall_level"]
        )

        support_count = len(
            analysis["learners_needing_support"]
        )

        parts = [
            f"Hi {name}! I've analysed "
            f"{analysis['total_assessments']} competency "
            f"assessment(s) across "
            f"{analysis['total_students']} learner(s).",
            "",
            f"Overall recorded mastery: {level}.",
            f"Learners with at least one BE/AE assessment: "
            f"{support_count}.",
        ]

        if analysis["strongest_areas"]:
            parts.append(
                f"Strongest current learning area by average: "
                f"{analysis['strongest_areas'][0][0]}."
            )

        if analysis["weakest_areas"]:
            parts.append(
                f"Learning area requiring the most attention by "
                f"average: {analysis['weakest_areas'][0][0]}."
            )

        parts.append(
            "These insights are based only on competency records "
            "currently entered in DARASA-AI."
        )

        return "\n".join(parts)

    @staticmethod
    def _teacher_lesson_response(name, analysis):
        areas = analysis["weakest_areas"]

        if not areas:
            return (
                f"Hi {name}! I need more competency data before "
                "I can identify a specific teaching priority."
            )

        learning_area, data = areas[0]

        focus = AIAssistantView._get_focus_record(
            data["records"]
        )

        parts = [
            f"Hi {name}! Based on the current assessment data, "
            f"a useful teaching focus is {learning_area}.",
        ]

        if focus:
            parts.append(
                f"The competency needing the most attention in "
                f"that area is {focus}."
            )

        parts.extend(
            [
                "",
                "For the next lesson:",
                "1. Briefly review the concept.",
                "2. Model one example step by step.",
                "3. Give learners guided practice.",
                "4. Check individual understanding.",
                "5. Record a follow-up competency assessment.",
            ]
        )

        return "\n".join(parts)

    @staticmethod
    def _teacher_classroom_response(
        name,
        classrooms,
        students,
        analysis,
    ):
        classroom_names = [
            classroom.name
            for classroom in classrooms
        ]

        parts = [
            f"Hi {name}! Your current teaching workspace "
            f"contains {len(students)} learner(s) across "
            f"{len(classrooms)} classroom(s).",
            "",
        ]

        if classroom_names:
            parts.append(
                "Classrooms: "
                + ", ".join(classroom_names)
                + "."
            )

        parts.append(
            f"Recorded competency assessments: "
            f"{analysis['total_assessments']}."
        )

        parts.append(
            f"Learners with BE/AE assessments: "
            f"{len(analysis['learners_needing_support'])}."
        )

        return "\n".join(parts)

    @staticmethod
    def _teacher_subject_response(name, subject, data):
        level = AIAssistantView._level_label(
            data["level"]
        )

        support_count = data["support_count"]

        parts = [
            f"Hi {name}! Here's what I can see for {subject}:",
            "",
            f"Current average mastery: {level}.",
            f"Assessments recorded: {data['count']}.",
            f"BE/AE assessments: {support_count}.",
        ]

        focus = AIAssistantView._get_focus_record(
            data["records"]
        )

        if focus:
            parts.append(
                f"A useful competency to revisit is {focus}."
            )

        notes = [
            record["teacher_notes"]
            for record in data["records"]
            if record["teacher_notes"]
        ]

        if notes:
            parts.append(
                f"Recent recorded feedback: \"{notes[0]}\""
            )

        return "\n".join(parts)

    @staticmethod
    def _teacher_general_response(
        name,
        classrooms,
        students,
        analysis,
    ):
        parts = [
            f"Hi {name}! I'm your DARASA-AI teaching assistant.",
            "",
            f"I can see {len(students)} learner(s) across "
            f"{len(classrooms)} classroom(s), with "
            f"{analysis['total_assessments']} competency "
            "assessment(s) recorded.",
        ]

        if analysis["learners_needing_support"]:
            parts.append(
                f"{len(analysis['learners_needing_support'])} "
                "learner(s) currently have at least one BE/AE "
                "assessment that may require additional support."
            )

        if analysis["weakest_areas"]:
            parts.append(
                f"The learning area with the lowest current "
                f"average is {analysis['weakest_areas'][0][0]}."
            )

        parts.extend(
            [
                "",
                "You can ask me:",
                "• Which learners need support?",
                "• Which learning areas need attention?",
                "• How are my learners progressing?",
                "• What should I focus on in my next lesson?",
                "• Show me my classroom overview.",
                "• How is Mathematics performing?",
            ]
        )

        return "\n".join(parts)

    # ==================================================================
    # SHARED COMPETENCY ANALYSIS
    # ==================================================================

    @staticmethod
    def _analyse_competencies(competencies):
        mastery_scores = {
            "BE": 1,
            "AE": 2,
            "ME": 3,
            "EE": 4,
        }

        by_learning_area = defaultdict(list)
        all_scores = []

        for competency in competencies:
            learning_area = (
                competency.get_learning_area_display()
            )

            level = str(
                competency.mastery_level or ""
            ).upper().strip()

            score = mastery_scores.get(level)

            record = {
                "strand": competency.strand,
                "sub_strand": competency.sub_strand,
                "mastery_level": level,
                "mastery_label": (
                    competency.get_mastery_level_display()
                ),
                "score": score,
                "teacher_notes": competency.teacher_notes or "",
                "assessed_on": (
                    competency.assessed_on.isoformat()
                    if competency.assessed_on
                    else None
                ),
            }

            by_learning_area[learning_area].append(record)

            if score:
                all_scores.append(score)

        area_summary = {}

        for learning_area, records in by_learning_area.items():
            scores = [
                record["score"]
                for record in records
                if record["score"]
            ]

            average = (
                sum(scores) / len(scores)
                if scores
                else 0
            )

            area_summary[learning_area] = {
                "records": records,
                "average": average,
                "count": len(records),
                "level": AIAssistantView._average_to_level(
                    average
                ),
            }

        overall_average = (
            sum(all_scores) / len(all_scores)
            if all_scores
            else 0
        )

        areas = list(area_summary.items())

        weakest = sorted(
            areas,
            key=lambda item: item[1]["average"],
        )

        strongest = sorted(
            areas,
            key=lambda item: item[1]["average"],
            reverse=True,
        )

        return {
            "total_assessments": len(competencies),
            "overall_average": overall_average,
            "overall_level": AIAssistantView._average_to_level(
                overall_average
            ),
            "by_learning_area": area_summary,
            "weakest": weakest,
            "strongest": strongest,
        }

    # ==================================================================
    # STUDENT RESPONSE BUILDERS
    # ==================================================================

    @staticmethod
    def _weak_area_response(name, analysis):
        weakest = analysis["weakest"]

        if not weakest:
            return (
                f"Hi {name}! I don't have enough performance data "
                "to identify an area that needs improvement yet."
            )

        parts = [
            f"Hi {name}! Based on your competency assessments, "
            "these areas deserve the most attention:",
            "",
        ]

        for learning_area, data in weakest[:3]:
            parts.append(
                f"• {learning_area}: "
                f"{data['level']} across "
                f"{data['count']} assessment(s)."
            )

            focus = AIAssistantView._get_focus_record(
                data["records"]
            )

            if focus:
                parts.append(
                    f"  Focus on {focus}."
                )

        parts.append(
            "Start with one area at a time, practise the specific "
            "skill, and use your teacher's feedback to guide your "
            "next attempt."
        )

        return "\n".join(parts)

    @staticmethod
    def _strength_response(name, analysis):
        strongest = analysis["strongest"]

        if not strongest:
            return (
                f"Hi {name}! I don't have enough assessment data "
                "to identify your strongest areas yet."
            )

        parts = [
            f"Nice work, {name}! Your strongest areas based on "
            "the available competency assessments are:",
            "",
        ]

        for learning_area, data in strongest[:3]:
            parts.append(
                f"• {learning_area}: {data['level']} "
                f"across {data['count']} assessment(s)."
            )

        parts.append(
            "Keep developing these strengths while giving extra "
            "practice time to areas with lower mastery."
        )

        return "\n".join(parts)

    @staticmethod
    def _study_plan_response(name, analysis):
        weakest = analysis["weakest"]

        if not weakest:
            return (
                f"Hi {name}! I need more assessment information "
                "before I can create a personalised study focus."
            )

        parts = [
            f"Here's a simple study plan for you, {name}:",
            "",
        ]

        for index, (learning_area, data) in enumerate(
            weakest[:3],
            start=1,
        ):
            focus = AIAssistantView._get_focus_record(
                data["records"]
            )

            if focus:
                parts.append(
                    f"{index}. {learning_area} — practise "
                    f"{focus}."
                )
            else:
                parts.append(
                    f"{index}. {learning_area} — review your "
                    "recently assessed competencies."
                )

        parts.append(
            "After studying, try practice questions and compare "
            "your work with your teacher's feedback."
        )

        return "\n".join(parts)

    @staticmethod
    def _progress_response(name, analysis):
        level = AIAssistantView._level_label(
            analysis["overall_level"]
        )

        parts = [
            f"Hi {name}! I reviewed "
            f"{analysis['total_assessments']} recent competency "
            "assessment(s).",
            "",
            f"Overall mastery: {level}.",
        ]

        if analysis["strongest"]:
            parts.append(
                f"Your strongest current learning area is "
                f"{analysis['strongest'][0][0]}."
            )

        if analysis["weakest"]:
            weakest_area = analysis["weakest"][0][0]

            strongest_area = (
                analysis["strongest"][0][0]
                if analysis["strongest"]
                else None
            )

            if weakest_area != strongest_area:
                parts.append(
                    f"An area that could use more attention is "
                    f"{weakest_area}."
                )

        parts.append(
            "Your competency levels are based on the assessments "
            "currently recorded by your teachers."
        )

        return "\n".join(parts)

    @staticmethod
    def _subject_response(name, subject, data):
        level = AIAssistantView._level_label(
            data["level"]
        )

        parts = [
            f"Hi {name}! Here's what I can see for {subject}:",
            "",
            f"Current mastery: {level}.",
            f"Assessments available: {data['count']}.",
        ]

        notes = [
            record["teacher_notes"]
            for record in data["records"]
            if record["teacher_notes"]
        ]

        if notes:
            parts.append(
                f"Your latest teacher feedback is: "
                f"\"{notes[0]}\""
            )

        focus = AIAssistantView._get_focus_record(
            data["records"]
        )

        if focus:
            parts.append(
                f"A useful area to focus on next is {focus}."
            )

        return "\n".join(parts)

    @staticmethod
    def _general_response(name, analysis):
        parts = [
            f"Hi {name}! I'm your DARASA-AI learning assistant.",
            "",
            f"I've analysed {analysis['total_assessments']} "
            "recent competency assessment(s).",
        ]

        if analysis["strongest"]:
            parts.append(
                f"You're currently showing stronger performance "
                f"in {analysis['strongest'][0][0]}."
            )

        if analysis["weakest"]:
            parts.append(
                f"One area worth giving extra attention to is "
                f"{analysis['weakest'][0][0]}."
            )

        parts.extend(
            [
                "",
                "You can ask me things like:",
                "• What am I struggling with?",
                "• What are my strongest subjects?",
                "• What should I study today?",
                "• Explain my Mathematics progress.",
                "• How can I improve?",
            ]
        )

        return "\n".join(parts)

    # ==================================================================
    # HELPERS
    # ==================================================================

    @staticmethod
    def _contains_any(message, keywords):
        return any(
            keyword in message
            for keyword in keywords
        )

    @staticmethod
    def _average_to_level(average):
        if average >= 3.5:
            return "EE"

        if average >= 2.5:
            return "ME"

        if average >= 1.5:
            return "AE"

        if average > 0:
            return "BE"

        return "N/A"

    @staticmethod
    def _level_label(level):
        labels = {
            "EE": "Exceeding Expectations",
            "ME": "Meeting Expectations",
            "AE": "Approaching Expectations",
            "BE": "Below Expectations",
            "N/A": "Not enough data",
        }

        return labels.get(level, level)

    @staticmethod
    def _serialize_student(student):
        if not student:
            return {}

        return {
            "id": student.id,
            "name": AIAssistantView._student_name(student),
            "admission_number": student.admission_number,
            "grade": student.grade,
            "classroom": (
                student.classroom.name
                if student.classroom
                else None
            ),
        }

    @staticmethod
    def _student_name(student):
        if not student:
            return "Unknown learner"

        name = (
            f"{student.first_name} "
            f"{student.last_name}"
        ).strip()

        return name or student.admission_number or "Unknown learner"

    @staticmethod
    def _serialize_competencies(competencies):
        return [
            {
                "student_id": competency.student_id,
                "student_name": (
                    AIAssistantView._student_name(
                        getattr(competency, "student", None)
                    )
                ),
                "learning_area": (
                    competency.get_learning_area_display()
                ),
                "strand": competency.strand,
                "sub_strand": competency.sub_strand,
                "mastery_level": competency.mastery_level,
                "mastery_label": (
                    competency.get_mastery_level_display()
                ),
                "assessed_on": (
                    competency.assessed_on.isoformat()
                    if competency.assessed_on
                    else None
                ),
                "teacher_notes": competency.teacher_notes or "",
            }
            for competency in competencies
        ]

    @staticmethod
    def _get_focus_record(records):
        priority = {
            "BE": 1,
            "AE": 2,
            "ME": 3,
            "EE": 4,
        }

        records_with_levels = [
            record
            for record in records
            if record["mastery_level"] in priority
        ]

        if not records_with_levels:
            return None

        record = min(
            records_with_levels,
            key=lambda item: priority[item["mastery_level"]],
        )

        if record["sub_strand"]:
            return record["sub_strand"]

        if record["strand"]:
            return record["strand"]

        return None

    @staticmethod
    def _find_subject(message, learning_areas):
        aliases = {
            "math": "Mathematics",
            "mathematics": "Mathematics",
            "english": "English",
            "kiswahili": "Kiswahili",
            "science": "Science and Technology",
            "technology": "Science and Technology",
            "social": "Social Studies",
            "social studies": "Social Studies",
            "creative": "Creative Arts",
            "arts": "Creative Arts",
        }

        for keyword, learning_area in aliases.items():
            if keyword in message:
                for actual_area in learning_areas:
                    if actual_area.lower() == learning_area.lower():
                        return actual_area

        for learning_area in learning_areas:
            if learning_area.lower() in message:
                return learning_area

        return None

    @staticmethod
    def _get_student(user):
        try:
            return (
                Student.objects
                .select_related(
                    "school",
                    "classroom",
                    "user",
                )
                .get(user=user)
            )
        except Student.DoesNotExist:
            return None

    @staticmethod
    def _get_teacher(user):
        try:
            return (
                Teacher.objects
                .select_related(
                    "school",
                    "user",
                )
                .prefetch_related("classrooms")
                .get(user=user)
            )
        except Teacher.DoesNotExist:
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
