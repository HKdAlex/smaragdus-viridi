import { renderHook } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import { useGemstoneDisplayLabels } from "../use-gemstone-display-labels";

vi.mock("next-intl", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next-intl")>();
  return {
    ...actual,
    useLocale: () => "ru",
  };
});

const messages = {
  gemstones: {
    types: { zircon: "Циркон", sapphire: "Сапфир" },
    colors: { brown: "Коричневый", blue: "Синий" },
    cuts: { round: "Круглый" },
    clarities: { VS1: "VS1" },
  },
};

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="ru" messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

describe("useGemstoneDisplayLabels", () => {
  it("translates enum type codes", () => {
    const { result } = renderHook(() => useGemstoneDisplayLabels(), {
      wrapper,
    });
    expect(
      result.current.getTypeLabel({
        name: "zircon",
        display_name: "zircon",
      })
    ).toBe("Циркон");
  });

  it("keeps custom locale display names", () => {
    const { result } = renderHook(() => useGemstoneDisplayLabels(), {
      wrapper,
    });
    const custom = "Сапфир (лабораторно выращенный)";
    expect(
      result.current.getTypeLabel({
        name: "sapphire",
        name_custom_ru: custom,
      })
    ).toBe(custom);
  });

  it("translates normalized colors", () => {
    const { result } = renderHook(() => useGemstoneDisplayLabels(), {
      wrapper,
    });
    expect(result.current.getColorLabel("brown")).toBe("Коричневый");
  });
});
