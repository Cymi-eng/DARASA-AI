from rest_framework import viewsets
from rest_framework.exceptions import ValidationError

from ..models import FeePayment
from ..permissions import IsAdminOrBursar
from ..serializers import FeePaymentSerializer
from .base import SchoolScopedViewSet


class FeePaymentViewSet(SchoolScopedViewSet):
    """
    School fee payment API.

    Only school administrators and bursars can
    manage fee payments.

    Supports filtering by:

    - student
    - payment status
    """

    queryset = FeePayment.objects.all()
    serializer_class = FeePaymentSerializer

    def get_permissions(self):
        return [IsAdminOrBursar()]

    def get_queryset(self):
        school = self.get_school()

        queryset = FeePayment.objects.all().select_related(
            "student",
            "student__school",
        )

        # Superusers can access payments across
        # all schools.
        if school is not None:
            queryset = queryset.filter(
                student__school=school
            )

        # Filter by student.
        student = self.request.query_params.get(
            "student"
        )

        if student:
            queryset = queryset.filter(
                student_id=student
            )

        # Filter by payment status.
        payment_status = self.request.query_params.get(
            "status"
        )

        if payment_status:
            queryset = queryset.filter(
                status=payment_status
            )

        return queryset.order_by(
            "-paid_at",
            "-id",
        )

    def perform_create(self, serializer):
        """
        Create a payment.

        Normal users can only create payments for
        students belonging to their own school.
        """

        school = self.get_school()

        if school is None:
            serializer.save()
            return

        student = serializer.validated_data["student"]

        if student.school_id != school.id:
            raise ValidationError(
                {
                    "student": (
                        "Student does not belong "
                        "to your school."
                    )
                }
            )

        serializer.save()

    def perform_update(self, serializer):
        """
        Update a payment.

        The student's school is checked again before
        saving to prevent cross-school reassignment.
        """

        school = self.get_school()

        if school is None:
            serializer.save()
            return

        student = serializer.validated_data.get(
            "student",
            serializer.instance.student,
        )

        if student.school_id != school.id:
            raise ValidationError(
                {
                    "student": (
                        "Student does not belong "
                        "to your school."
                    )
                }
            )

        serializer.save()