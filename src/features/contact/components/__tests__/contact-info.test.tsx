import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

import { ContactMethods } from "../contact-info";

const messages = {
  contact: {
    info: {
      email: { title: "Email Us", general: "General Inquiries" },
      phone: { title: "Call Us", main: "Main Office" },
      messaging: {
        title: "Instant Messaging",
        whatsapp: "WhatsApp",
        instagram: "Instagram",
      },
    },
  },
};

function renderContactMethods() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ContactMethods />
    </NextIntlClientProvider>
  );
}

describe("ContactMethods", () => {
  it("renders Instagram handle and link", () => {
    renderContactMethods();

    expect(screen.getByText("Instagram")).toBeInTheDocument();
    expect(screen.getByText("@crystallique_")).toBeInTheDocument();
  });

  it("opens Instagram in external link when action button is clicked", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    renderContactMethods();

    const instagramButtons = screen.getAllByRole("button");
    const instagramAction = instagramButtons.find((btn) =>
      btn.closest("div")?.textContent?.includes("@crystallique_")
    );
    expect(instagramAction).toBeDefined();
    instagramAction?.click();

    expect(openSpy).toHaveBeenCalledWith(
      "https://www.instagram.com/crystallique_/",
      "_blank",
      "noopener,noreferrer"
    );
    openSpy.mockRestore();
  });
});
