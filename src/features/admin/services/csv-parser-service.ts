"use client";

import type { BulkImportData } from './gemstone-admin-service';

// Simple logger for now
const logger = {
  info: (message: string, data?: any) => console.log(`[CSV-PARSER] ${message}`, data),
  error: (message: string, error?: any) => console.error(`[CSV-PARSER ERROR] ${message}`, error),
  warn: (message: string, data?: any) => console.warn(`[CSV-PARSER WARN] ${message}`, data),
};

export interface CSVParseResult {
  success: boolean;
  data: BulkImportData[];
  errors: Array<{ row: number; error: string; rawData?: string }>;
  warnings: Array<{ row: number; warning: string }>;
}

export interface CSVHeaders {
  serialNumber: string;
  name: string;
  color: string;
  cut: string;
  clarity: string;
  weight_carats: string;
  length_mm?: string;
  width_mm?: string;
  depth_mm?: string;
  origin_id?: string;
  price_amount: string;
  price_currency: string;
  premium_price_amount?: string;
  premium_price_currency?: string;
  in_stock: string;
  delivery_days?: string;
  internal_code?: string;
  description?: string;
  promotional_text?: string;
  marketing_highlights?: string;
}

export class CSVParserService {
  private static readonly REQUIRED_HEADERS = [
    'serialNumber',
    'name',
    'color',
    'cut',
    'clarity',
    'weight_carats',
    'price_amount',
    'price_currency',
    'in_stock'
  ] as const;

  private static readonly OPTIONAL_HEADERS = [
    'length_mm',
    'width_mm',
    'depth_mm',
    'origin_id',
    'premium_price_amount',
    'premium_price_currency',
    'delivery_days',
    'internal_code',
    'description',
    'promotional_text',
    'marketing_highlights'
  ] as const;

  /**
   * Parse CSV file content into gemstone import data
   */
  static parseCSV(csvContent: string): CSVParseResult {
    logger.info('Starting CSV parsing');

    const result: CSVParseResult = {
      success: false,
      data: [],
      errors: [],
      warnings: []
    };

    try {
      const lines = csvContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);

      if (lines.length < 2) {
        result.errors.push({ row: 0, error: 'CSV file must contain at least a header row and one data row' });
        return result;
      }

      // Parse header row
      const headerRow = this.parseCSVRow(lines[0]);
      const headers = this.validateAndMapHeaders(headerRow);

      if (!headers) {
        result.errors.push({ row: 1, error: 'Invalid or missing required headers' });
        return result;
      }

      logger.info('Headers validated', { headers });

      // Parse data rows
      for (let i = 1; i < lines.length; i++) {
        const rowNumber = i + 1; // 1-indexed for user display
        const rawRow = lines[i];

        try {
          const rowData = this.parseCSVRow(rawRow);

          if (rowData.length === 0) {
            result.warnings.push({
              row: rowNumber,
              warning: 'Empty row skipped'
            });
            continue;
          }

          const gemstoneData = this.mapRowToGemstoneData(rowData, headers, rowNumber);

          if (gemstoneData) {
            result.data.push(gemstoneData);
          }

        } catch (error) {
          result.errors.push({
            row: rowNumber,
            error: `Failed to parse row: ${(error as Error).message}`,
            rawData: rawRow
          });
        }
      }

      result.success = result.errors.length === 0;
      logger.info('CSV parsing completed', {
        rowsProcessed: lines.length - 1,
        validRows: result.data.length,
        errors: result.errors.length,
        warnings: result.warnings.length,
        success: result.success
      });

      return result;

    } catch (error) {
      logger.error('Unexpected error in CSV parsing', error as Error);
      result.errors.push({
        row: 0,
        error: `System error: ${(error as Error).message}`
      });
      return result;
    }
  }

  /**
   * Parse a single CSV row, handling quoted values and commas
   */
  private static parseCSVRow(row: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];

      if (char === '"') {
        if (inQuotes && row[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    // Add the last field
    result.push(current.trim());

    return result;
  }

  /**
   * Validate and map CSV headers to expected format
   */
  private static validateAndMapHeaders(headerRow: string[]): CSVHeaders | null {
    const headers: Partial<CSVHeaders> = {};

    // Create a map of header positions
    const headerMap = new Map<string, number>();
    headerRow.forEach((header, index) => {
      headerMap.set(header.toLowerCase().trim(), index);
    });

    // Check required headers
    for (const requiredHeader of this.REQUIRED_HEADERS) {
      const position = headerMap.get(requiredHeader.toLowerCase());
      if (position === undefined) {
        logger.error(`Missing required header: ${requiredHeader}`);
        return null;
      }
      (headers as any)[requiredHeader] = headerRow[position];
    }

    // Map optional headers
    for (const optionalHeader of this.OPTIONAL_HEADERS) {
      const position = headerMap.get(optionalHeader.toLowerCase());
      if (position !== undefined) {
        (headers as any)[optionalHeader] = headerRow[position];
      }
    }

    return headers as CSVHeaders;
  }

  /**
   * Map CSV row data to gemstone import format
   */
  private static mapRowToGemstoneData(
    rowData: string[],
    headers: CSVHeaders,
    rowNumber: number
  ): BulkImportData | null {
    try {
      // Helper function to get value by header name
      const getValue = (headerName: keyof CSVHeaders): string => {
        const header = headers[headerName];
        const position = Object.values(headers).indexOf(header);
        return position >= 0 && position < rowData.length ? rowData[position] : '';
      };

      // Parse and validate data
      const gemstoneData: BulkImportData = {
        serialNumber: getValue('serialNumber').trim(),
        name: this.parseGemstoneType(getValue('name')),
        color: this.parseColor(getValue('color')),
        cut: this.parseCut(getValue('cut')),
        clarity: this.parseClarity(getValue('clarity')),
        weight_carats: this.parseNumber(getValue('weight_carats'), 'weight'),
        price_amount: Math.round(this.parseNumber(getValue('price_amount'), 'price') * 100), // Convert to cents
        price_currency: this.parseCurrency(getValue('price_currency')),
        in_stock: this.parseBoolean(getValue('in_stock')),
      };

      // Optional fields
      const lengthStr = getValue('length_mm');
      if (lengthStr) {
        gemstoneData.length_mm = this.parseNumber(lengthStr, 'length');
      }

      const widthStr = getValue('width_mm');
      if (widthStr) {
        gemstoneData.width_mm = this.parseNumber(widthStr, 'width');
      }

      const depthStr = getValue('depth_mm');
      if (depthStr) {
        gemstoneData.depth_mm = this.parseNumber(depthStr, 'depth');
      }

      const originIdStr = getValue('origin_id');
      if (originIdStr) {
        gemstoneData.origin_id = originIdStr.trim();
      }

      const premiumPriceStr = getValue('premium_price_amount');
      if (premiumPriceStr) {
        gemstoneData.premium_price_amount = Math.round(this.parseNumber(premiumPriceStr, 'premium price') * 100);
      }

      const premiumCurrencyStr = getValue('premium_price_currency');
      if (premiumCurrencyStr) {
        gemstoneData.premium_price_currency = this.parseCurrency(premiumCurrencyStr);
      }

      const deliveryDaysStr = getValue('delivery_days');
      if (deliveryDaysStr) {
        gemstoneData.delivery_days = Math.round(this.parseNumber(deliveryDaysStr, 'delivery days'));
      }

      const internalCodeStr = getValue('internal_code');
      if (internalCodeStr) {
        gemstoneData.internal_code = internalCodeStr.trim();
      }

      const descriptionStr = getValue('description');
      if (descriptionStr) {
        gemstoneData.description = descriptionStr.trim();
      }

      const promotionalTextStr = getValue('promotional_text');
      if (promotionalTextStr) {
        gemstoneData.promotional_text = promotionalTextStr.trim();
      }

      const marketingHighlightsStr = getValue('marketing_highlights');
      if (marketingHighlightsStr) {
        gemstoneData.marketing_highlights = marketingHighlightsStr
          .split(',')
          .map(h => h.trim())
          .filter(h => h.length > 0);
      }

      return gemstoneData;

    } catch (error) {
      throw new Error(`Data mapping error: ${(error as Error).message}`);
    }
  }

  /**
   * Parse gemstone type from string
   */
  private static parseGemstoneType(value: string): BulkImportData['name'] {
    const normalized = value.toLowerCase().trim();
    const typeMap: Record<string, BulkImportData['name']> = {
      'diamond': 'diamond',
      'emerald': 'emerald',
      'ruby': 'ruby',
      'sapphire': 'sapphire',
      'amethyst': 'amethyst',
      'topaz': 'topaz',
      'garnet': 'garnet',
      'peridot': 'peridot',
      'citrine': 'citrine',
      'tanzanite': 'tanzanite'
    };

    const result = typeMap[normalized];
    if (!result) {
      throw new Error(`Invalid gemstone type: ${value}`);
    }

    return result;
  }

  /**
   * Parse color from string
   */
  private static parseColor(value: string): BulkImportData['color'] {
    const normalized = value.toLowerCase().trim();
    const colorMap: Record<string, BulkImportData['color']> = {
      'd': 'D', 'e': 'E', 'f': 'F', 'g': 'G', 'h': 'H', 'i': 'I', 'j': 'J', 'k': 'K', 'l': 'L', 'm': 'M',
      'fancy-yellow': 'fancy-yellow', 'fancy-blue': 'fancy-blue', 'fancy-pink': 'fancy-pink', 'fancy-green': 'fancy-green',
      'red': 'red', 'blue': 'blue', 'green': 'green', 'yellow': 'yellow', 'pink': 'pink',
      'white': 'white', 'black': 'black', 'colorless': 'colorless'
    };

    const result = colorMap[normalized];
    if (!result) {
      throw new Error(`Invalid color: ${value}`);
    }

    return result;
  }

  /**
   * Parse cut from string
   */
  private static parseCut(value: string): BulkImportData['cut'] {
    const normalized = value.toLowerCase().trim();
    const cutMap: Record<string, BulkImportData['cut']> = {
      'round': 'round', 'princess': 'princess', 'emerald': 'emerald', 'oval': 'oval',
      'marquise': 'marquise', 'pear': 'pear', 'cushion': 'cushion', 'radiant': 'radiant',
      'fantasy': 'fantasy'
    };

    const result = cutMap[normalized];
    if (!result) {
      throw new Error(`Invalid cut: ${value}`);
    }

    return result;
  }

  /**
   * Parse clarity from string
   */
  private static parseClarity(value: string): BulkImportData['clarity'] {
    const normalized = value.toLowerCase().trim();
    const clarityMap: Record<string, BulkImportData['clarity']> = {
      'fl': 'FL', 'if': 'IF', 'vvs1': 'VVS1', 'vvs2': 'VVS2',
      'vs1': 'VS1', 'vs2': 'VS2', 'si1': 'SI1', 'si2': 'SI2', 'i1': 'I1'
    };

    const result = clarityMap[normalized];
    if (!result) {
      throw new Error(`Invalid clarity: ${value}`);
    }

    return result;
  }

  /**
   * Parse currency from string
   */
  private static parseCurrency(value: string): BulkImportData['price_currency'] {
    const normalized = value.toUpperCase().trim();
    const validCurrencies = ['USD', 'EUR', 'GBP', 'RUB', 'CHF', 'JPY'];

    if (!validCurrencies.includes(normalized)) {
      throw new Error(`Invalid currency: ${value}`);
    }

    return normalized as BulkImportData['price_currency'];
  }

  /**
   * Parse number from string
   */
  private static parseNumber(value: string, fieldName: string): number {
    const trimmed = value.trim();
    if (!trimmed) {
      throw new Error(`${fieldName} cannot be empty`);
    }

    const num = parseFloat(trimmed);
    if (isNaN(num)) {
      throw new Error(`Invalid ${fieldName}: ${value}`);
    }

    return num;
  }

  /**
   * Parse boolean from string
   */
  private static parseBoolean(value: string): boolean {
    const normalized = value.toLowerCase().trim();
    if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no', 'n', 'off'].includes(normalized)) {
      return false;
    }
    throw new Error(`Invalid boolean value: ${value}`);
  }

  /**
   * Generate CSV template with sample data
   */
  static generateCSVTemplate(): string {
    const headers = [
      'serialNumber', 'name', 'color', 'cut', 'clarity', 'weight_carats',
      'price_amount', 'price_currency', 'in_stock', 'length_mm', 'width_mm', 'depth_mm',
      'origin_id', 'premium_price_amount', 'premium_price_currency', 'delivery_days',
      'internal_code', 'description', 'promotional_text', 'marketing_highlights'
    ];

    const sampleData = [
      'DM-001', 'diamond', 'D', 'round', 'FL', '1.25', '12500', 'USD', 'true',
      '6.5', '6.5', '4.1', '', '14000', 'USD', '7', 'DM001-INT', 'Beautiful round brilliant diamond',
      'Premium investment grade stone', 'Premium Quality, Investment Grade, Excellent Cut'
    ];

    return [headers.join(','), sampleData.join(',')].join('\n');
  }

  /**
   * Validate CSV file before parsing
   */
  static validateCSVFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return { valid: false, error: 'File must be a CSV file' };
    }

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return { valid: false, error: 'File size must be less than 10MB' };
    }

    return { valid: true };
  }
}
