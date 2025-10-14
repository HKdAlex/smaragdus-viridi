import { supabaseAdmin } from "@/lib/supabase";

type TranslationTable =
  | "gemstone_type_translations"
  | "gem_color_translations"
  | "gem_cut_translations"
  | "gem_clarity_translations";

type TranslationCodeColumn =
  | "type_code"
  | "color_code"
  | "cut_code"
  | "clarity_code";

type TranslationConfig = {
  table: TranslationTable;
  codeColumn: TranslationCodeColumn;
};

type TranslationRecord = {
  code: string;
  name: string;
  description: string | null;
};

const TABLE_CONFIG: Record<string, TranslationConfig> = {
  type: { table: "gemstone_type_translations", codeColumn: "type_code" },
  color: { table: "gem_color_translations", codeColumn: "color_code" },
  cut: { table: "gem_cut_translations", codeColumn: "cut_code" },
  clarity: { table: "gem_clarity_translations", codeColumn: "clarity_code" },
};

type TranslationRow = {
  name: string;
  description: string | null;
} & Partial<Record<TranslationCodeColumn, string | null>>;

export class TranslationService {
  private static cache = new Map<string, Map<string, TranslationRecord>>();

  static async getGemstoneTypes(
    locale: string
  ): Promise<Map<string, TranslationRecord>> {
    return this.getTranslations("type", locale);
  }

  static async getGemColors(
    locale: string
  ): Promise<Map<string, TranslationRecord>> {
    return this.getTranslations("color", locale);
  }

  static async getGemCuts(
    locale: string
  ): Promise<Map<string, TranslationRecord>> {
    return this.getTranslations("cut", locale);
  }

  static async getGemClarities(
    locale: string
  ): Promise<Map<string, TranslationRecord>> {
    return this.getTranslations("clarity", locale);
  }

  static async findTypeByName(
    name: string,
    locale: string
  ): Promise<string | null> {
    const translations = await this.getTranslations("type", locale);
    const entry = Array.from(translations.values()).find(
      (record) =>
        record.name.localeCompare(name, locale, { sensitivity: "accent" }) === 0
    );
    return entry?.code ?? null;
  }

  static clearCache() {
    this.cache.clear();
  }

  private static async getTranslations(
    kind: "type" | "color" | "cut" | "clarity",
    locale: string
  ): Promise<Map<string, TranslationRecord>> {
    const config = TABLE_CONFIG[kind];
    if (!config) {
      throw new Error(`Translation config not found for ${kind}`);
    }

    const cacheKey = `${config.table}:${locale}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    if (!supabaseAdmin) {
      throw new Error("Supabase admin client is not initialized");
    }

    const { data, error } = await supabaseAdmin
      .from(config.table)
      .select(`${config.codeColumn}, name, description`)
      .eq("locale", locale);

    if (error) {
      throw new Error(
        `Failed to load translations for ${config.table}: ${error.message}`
      );
    }

    const map = new Map<string, TranslationRecord>();

    const rows = (data ?? []) as unknown as TranslationRow[];

    rows.forEach((row) => {
      const code = row[config.codeColumn];
      if (!code) {
        return;
      }
      map.set(code, {
        code,
        name: row.name,
        description: row.description ?? null,
      });
    });

    this.cache.set(cacheKey, map);
    return map;
  }
}
