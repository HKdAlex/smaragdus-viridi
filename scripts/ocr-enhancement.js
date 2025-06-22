#!/usr/bin/env node

/**
 * OCR Enhancement Module for Gemstone Import
 *
 * This module provides advanced OCR and computer vision capabilities to:
 * - Extract gemstone attributes from label photos
 * - Parse measurements from ruler/scale images
 * - Recognize gemstone properties in various languages (Russian/English)
 */

const Tesseract = require("tesseract.js");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs").promises;

class GemstoneOCR {
  constructor() {
    this.ocrWorker = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    console.log("🔧 Initializing OCR engine...");
    this.ocrWorker = await Tesseract.createWorker();

    // Load both Russian and English languages for better recognition
    await this.ocrWorker.loadLanguage("rus+eng");
    await this.ocrWorker.initialize("rus+eng");

    // Configure OCR parameters for better accuracy
    await this.ocrWorker.setParameters({
      tessedit_char_whitelist:
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя0123456789.,:-+()[]{}",
      tessedit_pageseg_mode: Tesseract.PSM.AUTO,
    });

    this.isInitialized = true;
    console.log("✅ OCR engine initialized");
  }

  async extractLabelData(imagePath) {
    await this.initialize();

    try {
      console.log(`🔍 Processing label image: ${path.basename(imagePath)}`);

      // Preprocess image for better OCR accuracy
      const preprocessedBuffer = await this.preprocessLabelImage(imagePath);

      // Perform OCR
      const { data } = await this.ocrWorker.recognize(preprocessedBuffer);
      const text = data.text;

      console.log(`📝 Extracted text: ${text.substring(0, 100)}...`);

      // Parse the extracted text to identify gemstone attributes
      const parsedData = this.parseLabelText(text);

      return parsedData;
    } catch (error) {
      console.warn(`Failed to process label ${imagePath}: ${error.message}`);
      return {};
    }
  }

  async preprocessLabelImage(imagePath) {
    try {
      // Read and preprocess the image for better OCR accuracy
      const buffer = await sharp(imagePath)
        .greyscale() // Convert to grayscale
        .normalize() // Normalize histogram
        .sharpen() // Sharpen text
        .resize({
          width: 1200,
          height: 1600,
          fit: "inside",
          withoutEnlargement: false,
        }) // Increase resolution
        .png() // Convert to PNG for OCR
        .toBuffer();

      return buffer;
    } catch (error) {
      console.warn(`Image preprocessing failed: ${error.message}`);
      // Return original image if preprocessing fails
      return await fs.readFile(imagePath);
    }
  }

  parseLabelText(text) {
    const data = {
      weight_carats: null,
      cut: null,
      color: null,
      clarity: null,
      origin: null,
      length_mm: null,
      width_mm: null,
      depth_mm: null,
      price_amount: null,
    };

    // Normalize text for easier parsing
    const normalizedText = text.toLowerCase().replace(/\s+/g, " ");

    // Extract weight in carats
    const weightPatterns = [
      /(\d+(?:\.\d+)?)\s*(?:ct|kar|кар|карат|carat)/i,
      /вес:?\s*(\d+(?:\.\d+)?)/i,
      /weight:?\s*(\d+(?:\.\d+)?)/i,
    ];

    for (const pattern of weightPatterns) {
      const match = normalizedText.match(pattern);
      if (match) {
        data.weight_carats = parseFloat(match[1]);
        break;
      }
    }

    // Extract cut information
    const cutPatterns = {
      round: /(?:круг|round|круглый)/i,
      oval: /(?:овал|oval|овальный)/i,
      emerald: /(?:изумруд|emerald|прямоугольный)/i,
      princess: /(?:принцесса|princess|квадрат)/i,
      cushion: /(?:подушка|cushion|кушон)/i,
      pear: /(?:груша|pear|капля)/i,
      marquise: /(?:маркиз|marquise)/i,
      radiant: /(?:радиант|radiant)/i,
    };

    for (const [cutType, pattern] of Object.entries(cutPatterns)) {
      if (pattern.test(normalizedText)) {
        data.cut = cutType;
        break;
      }
    }

    // Extract color information
    const colorPatterns = {
      red: /(?:красный|red|красн)/i,
      blue: /(?:синий|blue|голуб)/i,
      green: /(?:зелёный|зеленый|green)/i,
      yellow: /(?:жёлтый|желтый|yellow)/i,
      pink: /(?:розовый|pink)/i,
      white: /(?:белый|white)/i,
      colorless: /(?:бесцветный|colorless|прозрачный)/i,
      D: /\bd\b/i,
      E: /\be\b/i,
      F: /\bf\b/i,
      G: /\bg\b/i,
      H: /\bh\b/i,
      I: /\bi\b/i,
      J: /\bj\b/i,
    };

    for (const [colorType, pattern] of Object.entries(colorPatterns)) {
      if (pattern.test(normalizedText)) {
        data.color = colorType;
        break;
      }
    }

    // Extract clarity information
    const clarityPatterns = {
      FL: /\bfl\b/i,
      IF: /\bif\b/i,
      VVS1: /\bvvs1\b/i,
      VVS2: /\bvvs2\b/i,
      VS1: /\bvs1\b/i,
      VS2: /\bvs2\b/i,
      SI1: /\bsi1\b/i,
      SI2: /\bsi2\b/i,
      I1: /\bi1\b/i,
    };

    for (const [clarityType, pattern] of Object.entries(clarityPatterns)) {
      if (pattern.test(normalizedText)) {
        data.clarity = clarityType;
        break;
      }
    }

    // Extract dimensions (mm)
    const dimensionPatterns = [
      /(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*(?:mm|мм)/i,
      /(?:размер|size|dimensions?):?\s*(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/i,
    ];

    for (const pattern of dimensionPatterns) {
      const match = normalizedText.match(pattern);
      if (match) {
        data.length_mm = parseFloat(match[1]);
        data.width_mm = parseFloat(match[2]);
        data.depth_mm = parseFloat(match[3]);
        break;
      }
    }

    // Extract price information
    const pricePatterns = [
      /(?:цена|price|стоимость):?\s*(\d+(?:[\s,]\d{3})*(?:\.\d{2})?)\s*(?:руб|rub|usd|\$|€|eur)/i,
      /(\d+(?:[\s,]\d{3})*(?:\.\d{2})?)\s*(?:руб|rub|usd|\$|€|eur)/i,
    ];

    for (const pattern of pricePatterns) {
      const match = normalizedText.match(pattern);
      if (match) {
        const priceStr = match[1].replace(/[\s,]/g, "");
        data.price_amount = parseFloat(priceStr) * 100; // Convert to cents
        break;
      }
    }

    // Extract origin information
    const originPatterns = {
      "sri lanka": /(?:шри-ланка|sri\s*lanka|цейлон)/i,
      myanmar: /(?:мьянма|myanmar|бирма)/i,
      thailand: /(?:таиланд|thailand)/i,
      brazil: /(?:бразилия|brazil)/i,
      madagascar: /(?:мадагаскар|madagascar)/i,
      tanzania: /(?:танзания|tanzania)/i,
      russia: /(?:россия|russia|урал)/i,
      afghanistan: /(?:афганистан|afghanistan)/i,
      pakistan: /(?:пакистан|pakistan)/i,
    };

    for (const [originType, pattern] of Object.entries(originPatterns)) {
      if (pattern.test(normalizedText)) {
        data.origin = originType;
        break;
      }
    }

    console.log(`📊 Parsed label data:`, data);
    return data;
  }

  async extractMeasurements(imagePath) {
    await this.initialize();

    try {
      console.log(
        `📏 Processing measurement image: ${path.basename(imagePath)}`
      );

      // Preprocess image for measurement extraction
      const preprocessedBuffer = await this.preprocessMeasurementImage(
        imagePath
      );

      // Perform OCR to extract numbers from the measuring device
      const { data } = await this.ocrWorker.recognize(preprocessedBuffer);
      const text = data.text;

      console.log(
        `📝 Extracted measurement text: ${text.substring(0, 100)}...`
      );

      // Parse measurements from the OCR text
      const measurements = this.parseMeasurementText(text);

      return measurements;
    } catch (error) {
      console.warn(
        `Failed to process measurement ${imagePath}: ${error.message}`
      );
      return {};
    }
  }

  async preprocessMeasurementImage(imagePath) {
    try {
      // Preprocess specifically for measurement extraction
      const buffer = await sharp(imagePath)
        .greyscale()
        .normalize()
        .sharpen()
        .threshold(128) // High contrast for ruler markings
        .resize({
          width: 1600,
          height: 1200,
          fit: "inside",
          withoutEnlargement: false,
        })
        .png()
        .toBuffer();

      return buffer;
    } catch (error) {
      console.warn(`Measurement image preprocessing failed: ${error.message}`);
      return await fs.readFile(imagePath);
    }
  }

  parseMeasurementText(text) {
    const measurements = {
      length_mm: null,
      width_mm: null,
      depth_mm: null,
    };

    // Extract numerical measurements in mm
    const numberPattern = /(\d+(?:\.\d+)?)/g;
    const numbers = text.match(numberPattern);

    if (numbers && numbers.length >= 2) {
      // Assume first few numbers are the main measurements
      const values = numbers.slice(0, 3).map((n) => parseFloat(n));

      // Sort to get length >= width >= depth
      values.sort((a, b) => b - a);

      if (values[0] > 0 && values[0] < 100) {
        // Reasonable range for gemstones
        measurements.length_mm = values[0];
      }
      if (values[1] > 0 && values[1] < 100) {
        measurements.width_mm = values[1];
      }
      if (values[2] > 0 && values[2] < 100) {
        measurements.depth_mm = values[2];
      }
    }

    console.log(`📐 Parsed measurements:`, measurements);
    return measurements;
  }

  async detectImageType(imagePath) {
    await this.initialize();

    try {
      // Quick OCR to determine image type
      const { data } = await this.ocrWorker.recognize(imagePath);
      const text = data.text.toLowerCase();

      if (
        text.includes("вес") ||
        text.includes("weight") ||
        text.includes("карат") ||
        text.includes("carat")
      ) {
        return "label";
      }

      if (
        text.match(/\d+/) &&
        (text.includes("mm") || text.includes("мм") || text.includes("см"))
      ) {
        return "measurement";
      }

      return "gemstone_photo";
    } catch (error) {
      console.warn(`Failed to detect image type: ${error.message}`);
      return "unknown";
    }
  }

  async cleanup() {
    if (this.ocrWorker) {
      await this.ocrWorker.terminate();
      this.ocrWorker = null;
      this.isInitialized = false;
      console.log("🧹 OCR engine cleaned up");
    }
  }
}

// Usage example and test function
async function testOCR(imagePath) {
  const ocr = new GemstoneOCR();

  try {
    const imageType = await ocr.detectImageType(imagePath);
    console.log(`🏷️  Detected image type: ${imageType}`);

    if (imageType === "label") {
      const labelData = await ocr.extractLabelData(imagePath);
      console.log("Label data:", labelData);
    } else if (imageType === "measurement") {
      const measurements = await ocr.extractMeasurements(imagePath);
      console.log("Measurements:", measurements);
    }
  } finally {
    await ocr.cleanup();
  }
}

// CLI interface for testing
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
OCR Enhancement Module Test

Usage: node scripts/ocr-enhancement.js <image-path>

Example:
  node scripts/ocr-enhancement.js "/path/to/label.jpg"
    `);
    process.exit(0);
  }

  const imagePath = args[0];
  await testOCR(imagePath);
}

if (require.main === module) {
  main().catch((error) => {
    console.error("❌ OCR test failed:", error);
    process.exit(1);
  });
}

module.exports = { GemstoneOCR };
