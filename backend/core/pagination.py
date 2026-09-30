from rest_framework.pagination import PageNumberPagination


class FlexiblePagination(PageNumberPagination):
    """Page number pagination that honours ?page_size=N (up to 1000)."""

    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 1000