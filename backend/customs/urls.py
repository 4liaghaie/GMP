from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    SeasonImportAPIView,
    HeadingImportAPIView,
    HSCodeImportAPIView,
    HSCodeViewSet,
)

router = DefaultRouter()
router.register(r"hs-codes", HSCodeViewSet, basename="hscode")

urlpatterns = [
    # Import endpoints
    path("import/seasons/", SeasonImportAPIView.as_view(), name="import-seasons"),
    path("import/headings/", HeadingImportAPIView.as_view(), name="import-headings"),
    path("import/hscodes/", HSCodeImportAPIView.as_view(), name="import-hscodes"),

    # ViewSet endpoints
    path("", include(router.urls)),
]
