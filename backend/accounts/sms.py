import os
import logging

logger = logging.getLogger(__name__)

def send_sms(phone: str, message: str) -> None:
    provider = os.getenv("SMS_PROVIDER", "mock")
    if provider == "mock":
        logger.warning("MOCK SMS to %s: %s", phone, message)
        return

    # TODO: implement Kavenegar/Ghasedak/etc.
    raise NotImplementedError("SMS provider not configured")
