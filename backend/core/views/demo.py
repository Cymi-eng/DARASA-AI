from django.core.management import call_command
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response


class DemoDataViewSet(viewsets.ViewSet):
    """
    Temporary administrative API for Darasa-AI demonstrations.

    This endpoint is intentionally isolated so it can be removed
    after the government demonstration period.
    """

    permission_classes = [IsAdminUser]

    @action(detail=False, methods=["post"], url_path="seed")
    def seed(self, request):
        call_command("seed_demo_data")

        return Response(
            {
                "success": True,
                "message": "Demo data seeded successfully.",
            },
            status=status.HTTP_200_OK,
        )