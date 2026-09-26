import base64
from datetime import datetime

import requests
from django.conf import settings


class MpesaError(Exception):
    """Raised when an M-Pesa API operation fails."""


class MpesaService:
    """
    Service for communicating with Safaricom Daraja APIs.
    """

    def __init__(self):
        self.consumer_key = getattr(
            settings,
            "MPESA_CONSUMER_KEY",
            "",
        ).strip()

        self.consumer_secret = getattr(
            settings,
            "MPESA_CONSUMER_SECRET",
            "",
        ).strip()

        self.shortcode = getattr(
            settings,
            "MPESA_SHORTCODE",
            "",
        ).strip()

        self.passkey = getattr(
            settings,
            "MPESA_PASSKEY",
            "",
        ).strip()

        self.callback_url = getattr(
            settings,
            "MPESA_CALLBACK_URL",
            "",
        ).strip()

        self.environment = getattr(
            settings,
            "MPESA_ENVIRONMENT",
            "sandbox",
        ).lower().strip()

        if self.environment == "production":
            self.base_url = (
                "https://api.safaricom.co.ke"
            )
        else:
            self.base_url = (
                "https://sandbox.safaricom.co.ke"
            )

    def _validate_configuration(self):
        required = {
            "MPESA_CONSUMER_KEY": self.consumer_key,
            "MPESA_CONSUMER_SECRET": self.consumer_secret,
            "MPESA_SHORTCODE": self.shortcode,
            "MPESA_PASSKEY": self.passkey,
            "MPESA_CALLBACK_URL": self.callback_url,
        }

        missing = [
            name
            for name, value in required.items()
            if not value
        ]

        if missing:
            raise MpesaError(
                "Missing M-Pesa configuration: "
                + ", ".join(missing)
            )

        if self.environment not in {
            "sandbox",
            "production",
        }:
            raise MpesaError(
                "MPESA_ENVIRONMENT must be "
                "'sandbox' or 'production'."
            )

    def get_access_token(self):
        """
        Generate a Daraja OAuth access token.
        """

        self._validate_configuration()

        url = (
            f"{self.base_url}"
            "/oauth/v1/generate"
            "?grant_type=client_credentials"
        )

        credentials = (
            f"{self.consumer_key}:"
            f"{self.consumer_secret}"
        )

        encoded_credentials = base64.b64encode(
            credentials.encode("utf-8")
        ).decode("utf-8")

        headers = {
            "Authorization": (
                f"Basic {encoded_credentials}"
            ),
            "Accept": "application/json",
        }

        try:
            response = requests.get(
                url,
                headers=headers,
                timeout=30,
            )

        except requests.RequestException as exc:
            raise MpesaError(
                "Unable to connect to M-Pesa OAuth service."
            ) from exc

        if response.status_code != 200:
            response_body = response.text.strip()

            raise MpesaError(
                "M-Pesa OAuth failed "
                f"(HTTP {response.status_code}). "
                f"Response: {response_body or 'empty response'}"
            )

        try:
            data = response.json()

        except ValueError as exc:
            raise MpesaError(
                "M-Pesa OAuth returned invalid JSON: "
                f"{response.text[:500]}"
            ) from exc

        access_token = data.get(
            "access_token"
        )

        if not access_token:
            raise MpesaError(
                "M-Pesa OAuth response did not "
                "contain an access token."
            )

        return access_token

    def _generate_password(self, timestamp):
        """
        Generate the Base64 encoded STK Push password.
        """

        raw = (
            f"{self.shortcode}"
            f"{self.passkey}"
            f"{timestamp}"
        )

        return base64.b64encode(
            raw.encode("utf-8")
        ).decode("utf-8")

    def _normalize_phone_number(
        self,
        phone_number,
    ):
        """
        Convert Kenyan phone numbers to:
        2547XXXXXXXX
        """

        phone = str(phone_number).strip()

        phone = (
            phone.replace(" ", "")
            .replace("-", "")
        )

        if phone.startswith("+254"):
            phone = phone[1:]

        elif phone.startswith("07") or phone.startswith(
            "01"
        ):
            phone = "254" + phone[1:]

        elif phone.startswith("7") or phone.startswith(
            "1"
        ):
            phone = "254" + phone

        if not phone.isdigit():
            raise MpesaError(
                "Invalid M-Pesa phone number."
            )

        if (
            len(phone) != 12
            or not phone.startswith("254")
        ):
            raise MpesaError(
                "M-Pesa phone number must be a valid "
                "Kenyan number."
            )

        return phone

    def initiate_stk_push(
        self,
        phone_number,
        amount,
        account_reference,
        transaction_desc,
    ):
        """
        Initiate an M-Pesa STK Push request.
        """

        self._validate_configuration()

        phone_number = self._normalize_phone_number(
            phone_number
        )

        try:
            amount = int(amount)

        except (TypeError, ValueError) as exc:
            raise MpesaError(
                "Payment amount must be a valid number."
            ) from exc

        if amount <= 0:
            raise MpesaError(
                "Payment amount must be greater than zero."
            )

        account_reference = str(
            account_reference
        ).strip()[:12]

        transaction_desc = str(
            transaction_desc
        ).strip()[:13]

        if not account_reference:
            raise MpesaError(
                "Account reference is required."
            )

        if not transaction_desc:
            raise MpesaError(
                "Transaction description is required."
            )

        access_token = self.get_access_token()

        timestamp = datetime.now().strftime(
            "%Y%m%d%H%M%S"
        )

        password = self._generate_password(
            timestamp
        )

        url = (
            f"{self.base_url}"
            "/mpesa/stkpush/v1/processrequest"
        )

        payload = {
            "BusinessShortCode": self.shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": (
                "CustomerPayBillOnline"
            ),
            "Amount": amount,
            "PartyA": phone_number,
            "PartyB": self.shortcode,
            "PhoneNumber": phone_number,
            "CallBackURL": self.callback_url,
            "AccountReference": account_reference,
            "TransactionDesc": transaction_desc,
        }

        try:
            response = requests.post(
                url,
                json=payload,
                headers={
                    "Authorization": (
                        f"Bearer {access_token}"
                    ),
                    "Content-Type": (
                        "application/json"
                    ),
                    "Accept": "application/json",
                },
                timeout=30,
            )

        except requests.RequestException as exc:
            raise MpesaError(
                "Unable to connect to M-Pesa STK service."
            ) from exc

        if not response.ok:
            response_body = response.text.strip()

            raise MpesaError(
                "M-Pesa STK Push failed "
                f"(HTTP {response.status_code}). "
                f"Response: {response_body or 'empty response'}"
            )

        try:
            data = response.json()

        except ValueError as exc:
            raise MpesaError(
                "M-Pesa returned invalid STK response: "
                f"{response.text[:500]}"
            ) from exc

        response_code = data.get(
            "ResponseCode"
        )

        if response_code not in (
            None,
            "0",
            0,
        ):
            raise MpesaError(
                data.get(
                    "ResponseDescription",
                    "M-Pesa STK Push was rejected.",
                )
            )

        return data