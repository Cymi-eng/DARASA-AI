from collections import defaultdict

from django.db.models import Count

from ..models import Competency


class AdaptiveLearningService:
    """
    Generates adaptive learning recommendations from
    a student's CBC competency history.
    """

    MASTERY_SCORES = {
        "EE": 4,
        "ME": 3,
        "AE": 2,
        "BE": 1,
    }

    MASTERY_LABELS = {
        "EE": "Exceeds Expectation",
        "ME": "Meets Expectation",
        "AE": "Approaches Expectation",
        "BE": "Below Expectation",
    }

    INTERVENTION_LEVELS = {
        "BE": "HIGH",
        "AE": "MEDIUM",
        "ME": "LOW",
        "EE": "LOW",
    }

    def __init__(self, student):
        self.student = student

    def _get_competencies(self):
        return (
            Competency.objects
            .filter(student=self.student)
            .order_by(
                "learning_area",
                "-assessed_on",
                "-id",
            )
        )

    def _latest_by_learning_area(self):
        """
        Keep the latest assessment for each learning area.
        """

        latest = {}

        for competency in self._get_competencies():
            if competency.learning_area not in latest:
                latest[competency.learning_area] = competency

        return latest

    def _calculate_learning_area_summary(self):
        """
        Calculate current mastery information per learning area.
        """

        latest = self._latest_by_learning_area()
        summary = []

        for learning_area, competency in latest.items():
            score = self.MASTERY_SCORES.get(
                competency.mastery_level,
                0,
            )

            summary.append(
                {
                    "learning_area": learning_area,
                    "learning_area_name": competency.get_learning_area_display(),
                    "mastery_level": competency.mastery_level,
                    "mastery_label": self.MASTERY_LABELS.get(
                        competency.mastery_level,
                        "Unknown",
                    ),
                    "score": score,
                    "strand": competency.strand,
                    "sub_strand": competency.sub_strand,
                    "assessed_on": competency.assessed_on,
                    "teacher_notes": competency.teacher_notes,
                }
            )

        return summary

    def _generate_recommendation(self, item):
        """
        Generate a targeted learning recommendation
        from the student's current mastery level.
        """

        mastery_level = item["mastery_level"]

        if mastery_level == "BE":
            action = (
                "Provide foundational instruction and "
                "guided practice before introducing "
                "new concepts."
            )
            priority = "HIGH"
            target = "Reach Approaches Expectation (AE)."

        elif mastery_level == "AE":
            action = (
                "Provide targeted practice on the "
                "identified strand and monitor progress "
                "through short formative assessments."
            )
            priority = "MEDIUM"
            target = "Reach Meets Expectation (ME)."

        elif mastery_level == "ME":
            action = (
                "Provide reinforcement activities and "
                "gradually introduce more challenging "
                "tasks."
            )
            priority = "LOW"
            target = "Maintain Meets Expectation and "
            "progress toward Exceeds Expectation (EE)."

        else:
            action = (
                "Provide enrichment activities, "
                "problem-solving tasks, and opportunities "
                "for deeper application."
            )
            priority = "LOW"
            target = "Maintain Exceeds Expectation (EE)."

        return {
            "priority": priority,
            "action": action,
            "target": target,
            "reason": (
                f"Latest assessment indicates "
                f"{item['mastery_label']} in "
                f"{item['learning_area_name']}."
            ),
        }

    def _build_intervention_list(self, summary):
        """
        Prioritize areas requiring intervention.
        """

        interventions = []

        for item in summary:
            if item["mastery_level"] not in {
                "BE",
                "AE",
            }:
                continue

            recommendation = self._generate_recommendation(
                item
            )

            interventions.append(
                {
                    "learning_area": item["learning_area"],
                    "learning_area_name": item[
                        "learning_area_name"
                    ],
                    "strand": item["strand"],
                    "sub_strand": item["sub_strand"],
                    "mastery_level": item[
                        "mastery_level"
                    ],
                    "mastery_label": item[
                        "mastery_label"
                    ],
                    "priority": recommendation[
                        "priority"
                    ],
                    "action": recommendation[
                        "action"
                    ],
                    "target": recommendation[
                        "target"
                    ],
                    "reason": recommendation[
                        "reason"
                    ],
                }
            )

        priority_order = {
            "HIGH": 0,
            "MEDIUM": 1,
            "LOW": 2,
        }

        interventions.sort(
            key=lambda item: (
                priority_order.get(
                    item["priority"],
                    99,
                ),
                item["learning_area_name"],
            )
        )

        return interventions

    def _calculate_overall_status(self, summary):
        """
        Determine the student's current adaptive status.
        """

        if not summary:
            return {
                "status": "NO_DATA",
                "label": "No assessment data available.",
            }

        scores = [
            item["score"]
            for item in summary
            if item["score"] > 0
        ]

        if not scores:
            return {
                "status": "NO_DATA",
                "label": "No valid mastery data available.",
            }

        average_score = sum(scores) / len(scores)

        if average_score < 2:
            status = "INTENSIVE_SUPPORT"
            label = (
                "Student requires intensive targeted "
                "learning support."
            )

        elif average_score < 3:
            status = "TARGETED_SUPPORT"
            label = (
                "Student requires targeted practice "
                "in identified competency areas."
            )

        elif average_score < 3.5:
            status = "PROGRESSING"
            label = (
                "Student is progressing and should "
                "receive reinforcement and extension "
                "activities."
            )

        else:
            status = "ENRICHMENT"
            label = (
                "Student is demonstrating strong "
                "mastery and can receive enrichment "
                "activities."
            )

        return {
            "status": status,
            "label": label,
            "average_score": round(
                average_score,
                2,
            ),
        }

    def generate_profile(self):
        """
        Generate the student's adaptive learning profile.
        """

        summary = self._calculate_learning_area_summary()

        interventions = self._build_intervention_list(
            summary
        )

        overall_status = self._calculate_overall_status(
            summary
        )

        return {
            "student": {
                "id": self.student.id,
                "name": str(self.student),
                "admission_number": (
                    self.student.admission_number
                ),
            },
            "overall": overall_status,
            "learning_areas": summary,
            "interventions": interventions,
            "intervention_count": len(interventions),
        }

    def generate_recommendations(self):
        """
        Generate actionable adaptive learning
        recommendations for the student.
        """

        profile = self.generate_profile()

        recommendations = []

        for intervention in profile["interventions"]:
            recommendations.append(
                {
                    "learning_area": intervention[
                        "learning_area"
                    ],
                    "learning_area_name": intervention[
                        "learning_area_name"
                    ],
                    "strand": intervention["strand"],
                    "sub_strand": intervention[
                        "sub_strand"
                    ],
                    "priority": intervention["priority"],
                    "recommendation": intervention[
                        "action"
                    ],
                    "target": intervention["target"],
                    "reason": intervention["reason"],
                }
            )

        return {
            "student": profile["student"],
            "overall": profile["overall"],
            "recommendations": recommendations,
            "count": len(recommendations),
        }