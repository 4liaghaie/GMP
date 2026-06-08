from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

User = get_user_model()


def is_admin_user(user) -> bool:
    return bool(
        user
        and user.is_authenticated
        and (
            getattr(user, "role", "") == "admin"
            or getattr(user, "is_staff", False)
            or getattr(user, "is_superuser", False)
        )
    )


class RegisterSerializer(serializers.ModelSerializer):
    """
    Creates a user with an auto-generated anonymous username.
    """

    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)
    email = serializers.EmailField(required=True)
    phone = serializers.CharField(required=True, allow_blank=False)

    class Meta:
        model = User
        fields = (
            "password",
            "password2",
            "email",
            "first_name",
            "last_name",
            "phone",
        )

    def validate_email(self, value):
        value = (value or "").strip().lower()
        if not value:
            raise serializers.ValidationError("Email is required.")
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already registered.")
        return value

    def validate_phone(self, value):
        value = (value or "").strip()
        if not value:
            raise serializers.ValidationError("Phone number is required.")
        if User.objects.filter(phone=value).exists():
            raise serializers.ValidationError("This phone number is already registered.")
        return value

    def validate(self, attrs):
        pw = attrs.get("password")
        pw2 = attrs.get("password2")
        if pw != pw2:
            raise serializers.ValidationError({"password2": "Passwords do not match."})

        validate_password(pw)
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        password = validated_data.pop("password")
        validated_data["username"] = User.generate_username()

        user = User(**validated_data)
        user.set_password(password)

        if hasattr(user, "role") and not user.role:
            user.role = getattr(User, "Role", None).USER if hasattr(User, "Role") else "user"

        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    """
    Login via email + password.
    """

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class MeSerializer(serializers.ModelSerializer):
    email = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "username", "phone", "first_name", "last_name", "email", "role")
        read_only_fields = ("id", "username", "role")

    def get_email(self, obj):
        request = self.context.get("request")
        if request and (request.user == obj or is_admin_user(request.user)):
            return obj.email
        return None

    def get_phone(self, obj):
        request = self.context.get("request")
        if request and (request.user == obj or is_admin_user(request.user)):
            return obj.phone
        return None


class UpdateProfileSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=True, allow_blank=False, allow_null=False)
    phone = serializers.CharField(required=True, allow_blank=False, allow_null=False)

    class Meta:
        model = User
        fields = ("first_name", "last_name", "email", "phone")

    def validate_phone(self, value):
        value = (value or "").strip()
        if value == "":
            raise serializers.ValidationError("Phone number is required.")

        qs = User.objects.filter(phone=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("This phone number is already registered.")

        return value

    def validate_email(self, value):
        value = (value or "").strip().lower()
        if value == "":
            raise serializers.ValidationError("Email is required.")

        qs = User.objects.filter(email=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("This email is already registered.")

        return value
