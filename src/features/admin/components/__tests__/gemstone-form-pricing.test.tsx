import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

import { GemstoneForm } from "../gemstone-form";

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

vi.mock("../services/gemstone-admin-service", () => ({
  GemstoneAdminService: {
    validateGemstoneData: () => ({ valid: true, errors: [] }),
    createGemstone: vi.fn(),
    updateGemstone: vi.fn(),
    checkSerialNumberExists: vi.fn().mockResolvedValue(false),
  },
}));

vi.mock("../services/media-upload-service", () => ({
  MediaUploadService: {},
}));

const messages = {
  admin: {
    currencies: { USD: "US Dollar" },
    gemstoneForm: {
      createTitle: "Create",
      editTitle: "Edit",
      tabs: {
        basicInfo: "Basic",
        pricingInventory: "Pricing",
        aiContent: "AI",
        media: "Media",
      },
      sections: {
        basicInformation: "Basic",
        properties: "Properties",
        detailedProperties: "Details",
        dimensions: "Dimensions",
        individualStones: "Stones",
        pricing: "Pricing",
        inventory: "Inventory",
      },
      pricingBasis: {
        title: "Pricing method",
        per_carat: "Per carat",
        per_piece: "Per piece",
        lot_fixed: "Fixed lot",
      },
      labels: {
        serialNumber: "Serial",
        internalCode: "Code",
        type: "Type",
        displayNameEn: "Name EN",
        displayNameRu: "Name RU",
        displayNameHint: "Hint",
        color: "Color",
        cut: "Cut",
        clarity: "Clarity",
        weight: "Weight",
        length: "Length",
        width: "Width",
        depth: "Depth",
        origin: "Origin",
        regularPrice: "Price",
        premiumPrice: "Premium",
        inStock: "In stock",
        metadataStatus: "Metadata",
        quantity: "Quantity",
        deliveryDays: "Delivery",
        totalPrice: "Total",
        pricePerCarat: "Per carat",
        pricePerPiece: "Per piece",
        description: "Description",
        promotionalText: "Promo",
        marketingHighlights: "Highlights",
        mediaUpload: "Media",
        aiGeneratedContent: "AI",
        technicalDescription: "Technical",
        emotionalDescription: "Emotional",
        narrativeStory: "Story",
        individualStones: "Stones",
        totalQuantity: "pcs",
        stoneNumber: "Stone {number}",
        treatmentStatus: "Treatment",
        colorChangeDescription: "Color change",
        qualityClassification: "Quality",
        miningCountry: "Mining",
        cuttingCountry: "Cutting",
        enhancementNotes: "Notes",
      },
      placeholders: {},
      actions: {
        cancel: "Cancel",
        create: "Create",
        update: "Update",
        addHighlight: "Add",
        add: "Add",
        autoCalculatePricePerCarat: "Auto",
      },
      hints: {
        pricePerCaratHelper: "Carat helper",
        pricePerPieceHelper: "Piece helper {quantity}",
        totalPricePerPiece: "{unit} x {quantity}",
        pricingBasis: {
          per_carat: "Carat basis",
          per_piece: "Piece basis",
          lot_fixed: "Lot basis",
        },
        treatmentStatus: "",
        colorChangeDescription: "",
        qualityClassification: "",
        miningCountry: "",
        cuttingCountry: "",
        origin: "",
        originEmpty: "",
      },
      serialNumberPlaceholder: "",
      internalCodePlaceholder: "",
      selectOriginPlaceholder: "",
      selectTypePlaceholder: "",
      selectColorPlaceholder: "",
      colorPickerHint: "",
      selectCutPlaceholder: "",
      selectClarityPlaceholder: "",
      noOriginSpecified: "",
      optionalPlaceholder: "",
      deliveryDaysPlaceholder: "",
      descriptionPlaceholder: "",
      promotionalTextPlaceholder: "",
      marketingHighlightPlaceholder: "",
      technicalDescriptionPlaceholder: "",
      emotionalDescriptionPlaceholder: "",
      narrativeStoryPlaceholder: "",
      metadataStatusNotSet: "Not set",
      metadataStatusOptions: {
        needs_review: "Review",
        needs_updating: "Update",
        updated: "Updated",
        verified: "Verified",
        rejected: "Rejected",
      },
      messages: { singleStoneOnly: "Single only" },
      errors: {},
      aiGeneration: {},
      uploading: "",
      convertingHeic: "",
      heicConversionFailed: "",
      dropFiles: "",
      uploadMedia: "",
      dragDropDescription: "",
      supportedFormats: "",
      uploadedMedia: "",
      descriptions: { individualStones: "" },
    },
  },
};

function renderForm() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <GemstoneForm />
    </NextIntlClientProvider>
  );
}

describe("GemstoneForm pricing basis", () => {
  async function openPricingTab() {
    fireEvent.click(screen.getByRole("button", { name: /pricing/i }));
  }

  it("shows per-piece input when per piece basis is selected", async () => {
    renderForm();
    await openPricingTab();

    fireEvent.click(screen.getByTestId("pricing-basis-per_piece"));

    expect(screen.getByTestId("price-per-piece-input")).toBeInTheDocument();
  });

  it("hides per-piece input for per-carat basis by default", async () => {
    renderForm();
    await openPricingTab();

    expect(
      screen.queryByTestId("price-per-piece-input")
    ).not.toBeInTheDocument();
  });
});
