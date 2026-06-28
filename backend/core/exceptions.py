from rest_framework.views import exception_handler


EXACT_TRANSLATIONS = {
    "Authentication credentials were not provided.": "برای ادامه باید وارد حساب کاربری شوید.",
    "Given token not valid for any token type": "نشست شما معتبر نیست. دوباره وارد شوید.",
    "Invalid token.": "نشست شما معتبر نیست. دوباره وارد شوید.",
    "Token is invalid or expired": "نشست شما منقضی شده است. دوباره وارد شوید.",
    "You do not have permission to perform this action.": "شما مجوز انجام این عملیات را ندارید.",
    "Not found.": "موردی پیدا نشد.",
    "This field is required.": "این فیلد الزامی است.",
    "This field may not be blank.": "این فیلد نمی‌تواند خالی باشد.",
    "This field may not be null.": "این فیلد نمی‌تواند خالی باشد.",
    "Enter a valid email address.": "ایمیل معتبر وارد کنید.",
    "A valid number is required.": "عدد معتبر وارد کنید.",
    "A valid integer is required.": "عدد صحیح معتبر وارد کنید.",
    "Invalid pk \"0\" - object does not exist.": "مقدار انتخاب‌شده معتبر نیست.",
    "No active account found with the given credentials": "ایمیل یا رمز عبور اشتباه است.",
}

SUBSTRING_TRANSLATIONS = (
    ("Ensure this field has at least", "مقدار واردشده کوتاه‌تر از حد مجاز است."),
    ("Ensure this field has no more than", "مقدار واردشده طولانی‌تر از حد مجاز است."),
    ("Ensure this value is greater than or equal to", "مقدار واردشده باید بزرگ‌تر یا مساوی حد مجاز باشد."),
    ("Ensure this value is less than or equal to", "مقدار واردشده باید کوچک‌تر یا مساوی حد مجاز باشد."),
    ("Invalid pk", "مقدار انتخاب‌شده معتبر نیست."),
    ("object does not exist", "مورد انتخاب‌شده وجود ندارد."),
)


def translate_message(value):
    if isinstance(value, str):
        if value in EXACT_TRANSLATIONS:
            return EXACT_TRANSLATIONS[value]
        for needle, replacement in SUBSTRING_TRANSLATIONS:
            if needle in value:
                return replacement
        return value

    if isinstance(value, list):
        return [translate_message(item) for item in value]

    if isinstance(value, dict):
        return {key: translate_message(item) for key, item in value.items()}

    return value


def persian_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        response.data = translate_message(response.data)
    return response
