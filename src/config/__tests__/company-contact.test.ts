import { describe, expect, it } from "vitest";

import {
  COMPANY_CONTACT,
  companyInstagramHref,
  companyMailtoHref,
  companyTelHref,
  companyWhatsAppHref,
} from "../company-contact";

describe("company-contact", () => {
  it("returns mailto href for company email", () => {
    expect(companyMailtoHref()).toBe(
      `mailto:${COMPANY_CONTACT.email}`
    );
  });

  it("returns tel href for company phone", () => {
    expect(companyTelHref()).toBe(`tel:${COMPANY_CONTACT.phone.tel}`);
  });

  it("returns WhatsApp href with encoded message", () => {
    const href = companyWhatsAppHref("Hello");
    expect(href).toContain("https://wa.me/");
    expect(href).toContain(COMPANY_CONTACT.whatsapp.number);
    expect(href).toContain(encodeURIComponent("Hello"));
  });

  it("returns Instagram profile URL", () => {
    expect(companyInstagramHref()).toBe(COMPANY_CONTACT.instagram.url);
    expect(companyInstagramHref()).toBe(
      "https://www.instagram.com/crystallique_/"
    );
  });
});
