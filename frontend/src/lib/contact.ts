const DEFAULT_WHATSAPP_NUMBER = "989008116606";

export const SUPPORT_WHATSAPP_NUMBER = (
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || DEFAULT_WHATSAPP_NUMBER
).replace(/\D/g, "");

export const SUPPORT_PHONE_HREF = `tel:+${SUPPORT_WHATSAPP_NUMBER}`;
export const SUPPORT_WHATSAPP_HREF = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}`;

const persianDigits = "۰۱۲۳۴۵۶۷۸۹";

export function formatSupportPhone() {
  const localNumber = SUPPORT_WHATSAPP_NUMBER.startsWith("98")
    ? `0${SUPPORT_WHATSAPP_NUMBER.slice(2)}`
    : SUPPORT_WHATSAPP_NUMBER;
  const grouped =
    localNumber.length === 11
      ? `${localNumber.slice(0, 4)} ${localNumber.slice(4, 7)} ${localNumber.slice(7)}`
      : localNumber;

  return grouped.replace(/\d/g, (digit) => persianDigits[Number(digit)]);
}
