from rest_framework import status, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from ..models import FeePayment
from ..permissions import IsAdminOrBursar
from ..serializers import FeePaymentSerializer
from ..services.mpesa import MpesaError, MpesaService
from .base import SchoolScopedViewSet


class FeePaymentViewSet(SchoolScopedViewSet):
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

        if school is not None:
            queryset = queryset.filter(
                student__school=school
            )

        student = self.request.query_params.get("student")

        if student:
            queryset = queryset.filter(
                student_id=student
            )

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
        payment = None

        try:
            school = self.get_school()

            student = serializer.validated_data["student"]

            if (
                school is not None
                and student.school_id != school.id
            ):
                raise ValidationError(
                    {
                        "student": (
                            "Student does not belong "
                            "to your school."
                        )
                    }
                )

            payment = serializer.save(
                status="PENDING"
            )

            mpesa = MpesaService()

            response = mpesa.initiate_stk_push(
                phone_number=payment.phone_number,
                amount=payment.amount,
                account_reference=(
                    payment.student.admission_number
                ),
                transaction_desc="School fee",
            )

            checkout_request_id = response.get(
                "CheckoutRequestID"
            )

            merchant_request_id = response.get(
                "MerchantRequestID"
            )

            if not checkout_request_id:
                payment.status = "FAILED"
                payment.failure_reason = (
                    "M-Pesa did not return a "
                    "CheckoutRequestID."
                )
                payment.save(
                    update_fields=[
                        "status",
                        "failure_reason",
                    ]
                )

                raise ValidationError(
                    {
                        "mpesa": (
                            "M-Pesa did not return a "
                            "CheckoutRequestID."
                        )
                    }
                )

            payment.checkout_request_id = (
                checkout_request_id
            )

            if merchant_request_id:
                payment.merchant_request_id = (
                    merchant_request_id
                )

            payment.save(
                update_fields=[
                    "checkout_request_id",
                    "merchant_request_id",
                ]
            )

        except MpesaError as exc:
            if payment is not None:
                payment.status = "FAILED"
                payment.failure_reason = str(exc)

                payment.save(
                    update_fields=[
                        "status",
                        "failure_reason",
                    ]
                )

            raise ValidationError(
                {
                    "mpesa": str(exc)
                }
            )

        except ValidationError:
            raise

        except Exception as exc:
            if payment is not None:
                try:
                    payment.status = "FAILED"
                    payment.failure_reason = (
                        "Unexpected payment error."
                    )
                    payment.save(
                        update_fields=[
                            "status",
                            "failure_reason",
                        ]
                    )
                except Exception:
                    pass

            raise ValidationError(
                {
                    "payment_error": (
                        f"{type(exc).__name__}: {str(exc)}"
                    )
                }
            )

    def perform_update(self, serializer):
        school = self.get_school()

        student = serializer.validated_data.get(
            "student",
            serializer.instance.student,
        )

        if (
            school is not None
            and student.school_id != school.id
        ):
            raise ValidationError(
                {
                    "student": (
                        "Student does not belong "
                        "to your school."
                    )
                }
            )

        serializer.save()