from django.db.models import Q
from django_filters import rest_framework as filters

from .models import RegisteredOrder


class RegisteredOrderMarketplaceFilter(filters.FilterSet):
    q = filters.CharFilter(method="filter_q")

    total_value_min = filters.NumberFilter(field_name="total_value", lookup_expr="gte")
    total_value_max = filters.NumberFilter(field_name="total_value", lookup_expr="lte")

    entry_border = filters.CharFilter(field_name="entry_border", lookup_expr="icontains")
    customs = filters.CharFilter(field_name="customs", lookup_expr="icontains")
    currency_supply = filters.CharFilter(field_name="currency_supply", lookup_expr="icontains")
    bank_name = filters.CharFilter(field_name="bank_name", lookup_expr="icontains")
    bank_branch = filters.CharFilter(field_name="bank_branch", lookup_expr="icontains")
    payment_instrument = filters.CharFilter(field_name="payment_instrument", lookup_expr="icontains")
    currency_type = filters.CharFilter(field_name="currency_type", lookup_expr="icontains")
    terms_of_delivery = filters.CharFilter(field_name="terms_of_delivery", lookup_expr="icontains")
    terms_of_payment = filters.CharFilter(field_name="terms_of_payment", lookup_expr="icontains")
    means_of_transport = filters.CharFilter(field_name="means_of_transport", lookup_expr="icontains")
    standard = filters.CharFilter(field_name="standard", lookup_expr="icontains")
    country_of_origin = filters.CharFilter(field_name="country_of_origin", lookup_expr="icontains")

    partial_shipment = filters.BooleanFilter(field_name="partial_shipment")
    hs_code = filters.CharFilter(method="filter_hscode")

    def filter_q(self, queryset, name, value):
        raw = (value or "").strip()
        if not raw:
            return queryset

        parts = [p.strip() for p in raw.replace("،", ",").split(",") if p.strip()]
        if not parts:
            parts = [raw]

        q_obj = Q()
        for term in parts:
            q_obj |= Q(order_number__icontains=term)
            q_obj |= Q(goods__description__icontains=term)
            q_obj |= Q(goods__hs_code__code__icontains=term)

        return queryset.filter(q_obj).distinct()

    def filter_hscode(self, queryset, name, value):
        raw = (value or "").strip()
        if not raw:
            return queryset

        parts = [p.strip() for p in raw.split(",") if p.strip()]
        if not parts:
            return queryset

        return queryset.filter(goods__hs_code__code__in=parts)

    class Meta:
        model = RegisteredOrder
        fields = [
            "entry_border",
            "customs",
            "currency_supply",
            "bank_name",
            "bank_branch",
            "payment_instrument",
            "currency_type",
            "terms_of_delivery",
            "terms_of_payment",
            "partial_shipment",
            "means_of_transport",
            "standard",
            "country_of_origin",
        ]
