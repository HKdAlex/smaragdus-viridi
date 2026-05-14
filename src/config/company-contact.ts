export const COMPANY_CONTACT = {
  email: "crystallique1.0@gmail.com",
  phone: {
    display: "+7 775 108 90 41",
    tel: "+77751089041",
  },
  whatsapp: {
    display: "+7 775 108 9041",
    number: "77751089041",
  },
} as const;

export function companyMailtoHref(
  email: string = COMPANY_CONTACT.email
): string {
  return `mailto:${email}`;
}

export function companyTelHref(
  phone: string = COMPANY_CONTACT.phone.tel
): string {
  return `tel:${phone}`;
}

export function companyWhatsAppHref(
  message = "Hello Crystallique team"
): string {
  return `https://wa.me/${COMPANY_CONTACT.whatsapp.number}?text=${encodeURIComponent(message)}`;
}
