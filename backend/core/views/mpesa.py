from django.db import transaction
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ..models import FeeLedgerEntry, FeePayment


def _get_callback_item(metadata, item_name):
    """
    Extract a value from Daraja CallbackMetadata.
    """

    for item in metadata or []:
        if item.get("Name") == item_name:
            return item.get("Value")

    return None


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def mpesa_callback(request):
    """
    Receive and process an M-Pesa STK Push callback.

    Successful payments are confirmed and recorded
    in the fee ledger.
    """

    body = request.data

    stk_callback = (
        body.get("Body", {})
        .get("stkCallback", {})
    )

    checkout_request_id = stk_callback.get(
        "CheckoutRequestID"
    )

    merchant_request_id = stk_callback.get(
        "MerchantRequestID"
    )

    result_code = stk_callback.get(
        "ResultCode"
    )

    result_description = stk_callback.get(
        "ResultDesc",
        "",
    )

    if not checkout_request_id:
        return Response(
            {
                "ResultCode": 1,
                "ResultDesc": (
                    "CheckoutRequestID is required."
                ),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        payment = FeePayment.objects.select_related(
            "student"
        ).get(
            checkout_request_id=checkout_request_id
        )
    except FeePayment.DoesNotExist:
        return Response(
            {
                "ResultCode": 1,
                "ResultDesc": (
                    "Payment transaction not found."
                ),
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    callback_metadata = (
        stk_callback.get(
            "CallbackMetadata",
            {},
        ).get(
            "Item",
            [],
        )
    )

    receipt_number = _get_callback_item(
        callback_metadata,
        "MpesaReceiptNumber",
    )

    phone_number = _get_callback_item(
        callback_metadata,
        "PhoneNumber",
    )

    with transaction.atomic():
        if result_code == 0:
            payment.status = "CONFIRMED"

            if receipt_number:
                payment.mpesa_receipt_number = str(
                    receipt_number
                )

                payment.transaction_id = str(
                    receipt_number
                )

            if merchant_request_id:
                payment.merchant_request_id = (
                    merchant_request_id
                )

            if phone_number:
                payment.phone_number = str(
                    phone_number
                )

            payment.failure_reason = ""

            if payment.paid_at is None:
                payment.paid_at = timezone.now()

            payment.save(
                update_fields=[
                    "status",
                    "mpesa_receipt_number",
                    "transaction_id",
                    "merchant_request_id",
                    "phone_number",
                    "failure_reason",
                    "paid_at",
                    "updated_at",
                ]
            )

            ledger_exists = FeeLedgerEntry.objects.filter(
                payment=payment,
                entry_type="PAYMENT",
            ).exists()

            if not ledger_exists:
                FeeLedgerEntry.objects.create(
                    payment=payment,
                    student=payment.student,
                    entry_type="PAYMENT",
                    amount=payment.amount,
                    reference=(
                        payment.mpesa_receipt_number
                        or payment.transaction_id
                        or payment.checkout_request_id
                    ),
                    description=(
                        "M-Pesa school fee payment"
                    ),
                )

        else:
            payment.status = "FAILED"

            payment.failure_reason = (
                result_description
                or "M-Pesa transaction failed."
            )

            if merchant_request_id:
                payment.merchant_request_id = (
                    merchant_request_id
                )

            payment.save(
                update_fields=[
                    "status",
                    "failure_reason",
                    "merchant_request_id",
                    "updated_at",
                ]
            )

    return Response(
        {
            "ResultCode": 0,
            "ResultDesc": (
                "Callback processed successfully."
            ),
        },
        status=status.HTTP_200_OK,
    )