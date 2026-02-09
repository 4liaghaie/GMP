from django_filters import rest_framework as filters
from .models import RegisteredOrder
from django.db.models import Q


class RegisteredOrderMarketplaceFilter(filters.FilterSet):
    q = filters.CharFilter(method="filter_q")

    # total value range
    total_value_min = filters.NumberFilter(field_name="total_value", lookup_expr="gte")
    total_value_max = filters.NumberFilter(field_name="total_value", lookup_expr="lte")

    # simple text fields (you can switch to exact if you prefer)
    seller_country = filters.CharFilter(field_name="seller_country", lookup_expr="icontains")
    currency_type = filters.CharFilter(field_name="currency_type", lookup_expr="icontains")
    terms_of_delivery = filters.CharFilter(field_name="terms_of_delivery", lookup_expr="icontains")
    terms_of_payment = filters.CharFilter(field_name="terms_of_payment", lookup_expr="icontains")
    means_of_transport = filters.CharFilter(field_name="means_of_transport", lookup_expr="icontains")
    standard = filters.CharFilter(field_name="standard", lookup_expr="icontains")
    country_of_origin = filters.CharFilter(field_name="country_of_origin", lookup_expr="icontains")

    # boolean
    partial_shipment = filters.BooleanFilter(field_name="partial_shipment")

    # HSCode filter (supports single code OR comma-separated list)
    hs_code = filters.CharFilter(method="filter_hscode")
    def filter_q(self, queryset, name, value):
        raw = (value or "").strip()
        if not raw:
            return queryset

        # if user types "0101, 0201" treat as multiple tokens
        parts = [p.strip() for p in raw.replace("،", ",").split(",") if p.strip()]
        if not parts:
            parts = [raw]

        q_obj = Q()
        for term in parts:
            q_obj |= Q(order_number__icontains=term)
            q_obj |= Q(goods__description__icontains=term)
            q_obj |= Q(goods__hs_code__code__icontains=term)  # or __startswith if you want
            # optional if you want seller name search etc:
            # q_obj |= Q(user__username__icontains=term)

        return queryset.filter(q_obj).distinct()
    def filter_hscode(self, queryset, name, value):
        # allow: ?hscode=01012100  OR  ?hscode=01012100,02011000
        raw = (value or "").strip()
        if not raw:
            return queryset

        parts = [p.strip() for p in raw.split(",") if p.strip()]
        if not parts:
            return queryset

        # HSCode model has "code" in your serializers; assuming HSCode.code exists.
        # Uses exact matching; if you want "startswith", change to code__startswith
        return queryset.filter(goods__hs_code__code__in=parts)

    class Meta:
        model = RegisteredOrder
        fields = [
            "seller_country",
            "currency_type",
            "terms_of_delivery",
            "terms_of_payment",
            "partial_shipment",
            "means_of_transport",
            "standard",
            "country_of_origin",
        ]
