import base64
from datetime import datetime

import requests
from django.conf import settings


class MpesaError(Exception):
    """Raised when an M-Pesa API operation fails."""


class MpesaService:
    """
    Service for communicating with Safaricom Daraja APIs.

    Credentials and configuration are loaded from Django settings.
    """

    def __init__(self):
        self.consumer_key = getattr(
            settings,
            "MPESA_CONSUMER_KEY",
            "",
        )

        self.consumer_secret = getattr(
            settings,
            "MPESA_CONSUMER_SECRET",
            "",
        )

        self.shortcode = getattr(
            settings,
            "MPESA_SHORTCODE",
            "",
        )

        self.passkey = getattr(
            settings,
            "MPESA_PASSKEY",
            "",
        )

        self.callback_url = getattr(
            settings,
            "MPESA_CALLBACK_URL",
            "",
        )

        self.environment = getattr(
            settings,
            "MPESA_ENVIRONMENT",
            "sandbox",
        ).lower().strip()

        if self.environment == "production":
            self.base_url = (
                "https://api.safaricom.co.ke/"
            )
        else:
            self.base_url = (
                "https://sandbox.safaricom.co.ke/"
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
        Request an OAuth access token from Daraja.
        """

        self._validate_configuration()

        credentials = (
            f"{self.consumer_key}:"
            f"{self.consumer_secret}"
        )

        encoded_credentials = base64.b64encode(
            credentials.encode("utf-8")
        ).decode("utf-8")

        url = (
            f"{self.base_url}"
            "oauth/v1/generate"
            "?grant_type=client_credentials"
        )

        try:
            response = requests.get(
                url,
                headers={
                    "Authorization": (
                        f"Basic {encoded_credentials}"
                    ),
                    "Accept": "application/json",
                },
                timeout=30,
            )
        except requests.RequestException as exc:
            raise MpesaError(
                "Unable to connect to M-Pesa."
            ) from exc

        if not response.ok:
            raise MpesaError(
                "Failed to obtain M-Pesa access token."
            )

        try:
            data = response.json()
        except ValueError as exc:
            raise MpesaError(
                "M-Pesa returned an invalid response."
            ) from exc

        access_token = data.get("access_token")

        if not access_token:
            raise MpesaError(
                "M-Pesa access token was not returned."
            )

        return access_token

    def _generate_password(self, timestamp):
        """
        Generate the Daraja STK password.
        """

        raw = (
            f"{self.shortcode}"
            f"{self.passkey}"
            f"{timestamp}"
        )

        return base64.b64encode(
            raw.encode("utf-8")
        ).decode("utf-8")

    def initiate_stk_push(
        self,
        phone_number,
        amount,
        account_reference,
        transaction_desc,
    ):
        """
        Initiate an M-Pesa STK Push request.

        Returns the Daraja response as a dictionary.
        """

        self._validate_configuration()

        access_token = self.get_access_token()

        timestamp = datetime.now().strftime(
            "%Y%m%d%H%M%S"
        )

        password = self._generate_password(
            timestamp
        )

        url = (
            f"{self.base_url}"
            "mpesa/stkpush/v1/processrequest"
        )

        payload = {
            "BusinessShortCode": self.shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": int(amount),
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
                "Unable to connect to M-Pesa."
            ) from exc

        if not response.ok:
            raise MpesaError(
                "M-Pesa STK Push request failed."
            )

        try:
            data = response.json()
        except ValueError as exc:
            raise MpesaError(
                "M-Pesa returned an invalid response."
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