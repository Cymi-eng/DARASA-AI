from rest_framework import serializers

from ..models import FeePayment


class FeePaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeePayment
        fields = [
            "id",
            "student",
            "amount",
            "mpesa_receipt_number",
            "phone_number",
            "transaction_id",
            "checkout_request_id",
            "merchant_request_id",
            "status",
            "failure_reason",
            "paid_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "mpesa_receipt_number",
            "transaction_id",
            "checkout_request_id",
            "merchant_request_id",
            "status",
            "failure_reason",
            "paid_at",
            "updated_at",
        ]

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Payment amount must be greater than zero."
            )

        return value

    def validate_phone_number(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Phone number is required."
            )

        return value

    def validate(self, attrs):
        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError(
                "Authentication is required."
            )

        if request.user.is_superuser:
            return attrs

        profile = getattr(
            request.user,
            "profile",
            None,
        )

        if not profile or not profile.school_id:
            raise serializers.ValidationError(
                "Your account is not associated with a school."
            )

        student = attrs.get("student")

        if student and student.school_id != profile.school_id:
            raise serializers.ValidationError(
                {
                    "student": (
                        "Student does not belong "
                        "to your school."
                    )
                }
            )

        return attrs