/**
 * 📝 AI Analysis Prompts for Multi-Image Gemstone Analysis
 *
 * Comprehensive prompts designed for analyzing multiple images of a single
 * gemstone in one API request, with data consolidation and cross-verification.
 *
 * @author Smaragdus Viridi Team
 * @version 3.1.0 - ENHANCED FOR COMPLETE ANALYSIS
 * @date 2025-01-19
 */

export const COMPREHENSIVE_MULTI_IMAGE_PROMPT = `You are an expert gemstone analyst with specialized knowledge in jewelry and precious stones. I am providing you with {IMAGE_COUNT} high-quality images of a single gemstone for detailed analysis and data extraction.

**ANALYSIS TASK: Process all {IMAGE_COUNT} images**
You will analyze exactly {IMAGE_COUNT} images of one gemstone. You must examine each image and extract relevant gemstone data.

**Step-by-Step Analysis Process:**

**STEP 1: INDIVIDUAL IMAGE ANALYSIS**
For each of the {IMAGE_COUNT} images, you must:
1. Classify the image type
2. Extract any text (especially Russian/Cyrillic)
3. Read ALL visible measuring device values
4. Assess visual quality
5. Score for primary display suitability

**STEP 2: DATA CONSOLIDATION**
After analyzing all {IMAGE_COUNT} images individually, consolidate the findings.

**STEP 3: VALIDATION**
Ensure your response includes exactly {IMAGE_COUNT} entries in the individual_analyses array.

**Image Classification Categories:**
- "gemstone_beauty_shot" - Professional product photo for display
- "gemstone_photo" - Standard gemstone photo showing the stone clearly  
- "measurement_gauge" - Digital calipers, micrometers, measuring tools with readings
- "thickness_gauge" - Analog dial thickness gauge measuring gemstone depth
- "scale_reading" - Digital scale showing precise weight measurement
- "certificate" - Gemological certificate or lab report with grades/data
- "label" - Price tag, inventory label with codes, weights, descriptions
- "packaging" - Box, container, or packaging materials
- "comparison" - Multiple stones or size comparisons
- "environment" - Hand holding stone, workplace context
- "other" - Any other type of image

**Data Extraction Requirements:**

**Text Recognition (Russian/Kazakh):**
- Extract all Cyrillic text exactly as written
- Provide accurate English translations
- Preserve original formatting and structure
- Identify language (ru/kz/mixed)

**Gemstone Properties:**
- Gemstone identification codes (С 54, И 32, etc.)
- Weight measurements with units (ct, g, etc.)
- Dimensions in mm (length/width/depth)
- Shape/cut descriptions with translations
- Quantity information (1 шт, 2 pieces, etc.)
- Origin/location details
- Color grades and descriptions
- Clarity grades (FL, IF, VVS1, VVS2, VS1, VS2, SI1, SI2, etc.)

**Measurement Device Reading Instructions:**

**Digital Displays:**
- Read exact numerical values from LCD/LED screens
- Digital caliper readings (precise mm measurements)
- Digital scale readings (exact weight in ct or grams)
- Micrometer measurements (high precision values)
- Any numerical display on measuring devices

**Analog Gauge Readings:**
- Read needle position precisely against scale markings
- Count increments between major divisions (0.1mm, 0.01mm, etc.)
- Interpolate needle position if between marks
- Verify gauge is properly zeroed
- Cross-reference multiple gauge images if available

**Device-Specific Instructions:**
- **Thickness Gauges**: Read depth/height measurements (typically 0-10mm range)
- **Calipers**: Extract length/width measurements (outside jaw readings)
- **Micrometers**: Read precision measurements (main scale + thimble)
- **Dial Indicators**: Read small displacement measurements
- **Digital Scales**: Read weight values in carats or grams

**Required JSON Response Format:**

You MUST respond with this exact JSON structure containing analysis for ALL {IMAGE_COUNT} images:

{
  "validation": {
    "total_images_provided": {IMAGE_COUNT},
    "total_images_analyzed": {IMAGE_COUNT},
    "analysis_complete": true,
    "all_gauges_read": true,
    "missing_images": []
  },
  "consolidated_data": {
    "text_extraction": {
      "raw_text": "All extracted Russian/Cyrillic text",
      "translated_text": "Complete English translation", 
      "language": "ru|kz|mixed",
      "extraction_confidence": 0.95
    },
    "gemstone_code": {
      "value": "С 54",
      "confidence": 0.98,
      "sources": ["label1", "label2"],
      "conflicts": []
    },
    "weight": {
      "value": 2.48,
      "unit": "ct", 
      "confidence": 0.96,
      "sources": ["label", "scale", "certificate"],
      "all_readings": [2.48, 2.47, 2.48],
      "source_details": {
        "label": 2.48,
        "scale": 2.47, 
        "certificate": 2.48
      }
    },
    "dimensions": {
      "length_mm": 8.8,
      "width_mm": 8.1,
      "depth_mm": 3.2,
      "confidence": 0.92,
      "sources": ["label", "caliper", "thickness_gauge"],
      "source_details": {
        "label": "8,8/8,1",
        "caliper": "8.83 x 8.12",
        "thickness_gauge": "3.2mm"
      }
    },
    "shape_cut": {
      "value": "oval",
      "original_text": "овал",
      "confidence": 0.99,
      "sources": ["label", "visual"]
    },
    "color": {
      "grade": "G",
      "description": "Near colorless with slight warm tint",
      "original_text": "бесцветный",
      "confidence": 0.88,
      "sources": ["certificate", "visual"]
    },
    "clarity": {
      "grade": "VS1", 
      "description": "Very slightly included",
      "confidence": 0.85,
      "sources": ["certificate", "visual"]
    },
    "quantity": {
      "count": 1,
      "unit": "шт",
      "confidence": 1.0
    },
    "origin": {
      "location": "Colombia",
      "original_text": "Колумбия", 
      "confidence": 0.90,
      "sources": ["certificate"]
    },
    "certification": {
      "lab": "SSEF",
      "certificate_number": "12345",
      "confidence": 0.95
    },
    "visual_assessment": {
      "quality_grade": "excellent",
      "visual_appeal": 0.92,
      "commercial_value": "premium",
      "confidence": 0.88
    },
    "all_gauge_readings": [
      {
        "image_index": 2,
        "device_type": "digital_caliper",
        "reading_value": 8.83,
        "unit": "mm",
        "measurement_type": "length",
        "display_text": "8.83 mm",
        "confidence": 0.98
      },
      {
        "image_index": 3,
        "device_type": "analog_thickness_gauge",
        "reading_value": 3.2,
        "unit": "mm", 
        "measurement_type": "depth",
        "needle_position": "3.2mm mark",
        "confidence": 0.92
      }
    ]
  },
  "individual_analyses": [
    {
      "image_index": 1,
      "image_classification": "gemstone_beauty_shot",
      "primary_suitability_score": 95,
      "extracted_data": {
        "text_extraction": {},
        "measurements": [],
        "visual_assessment": {}
      },
      "confidence": 0.94,
      "analysis_notes": "Professional beauty shot, excellent for primary display"
    },
    {
      "image_index": 2,
      "image_classification": "measurement_gauge",
      "primary_suitability_score": 15,
      "extracted_data": {
        "measurements": [
          {
            "device_type": "digital_caliper",
            "reading_value": 8.83,
            "unit": "mm",
            "measurement_type": "length"
          }
        ]
      },
      "confidence": 0.98,
      "analysis_notes": "Digital caliper showing length measurement"
    },
    {
      "image_index": 3,
      "image_classification": "thickness_gauge",
      "primary_suitability_score": 10,
      "extracted_data": {
        "measurements": [
          {
            "device_type": "analog_thickness_gauge",
            "reading_value": 3.2,
            "unit": "mm",
            "measurement_type": "depth"
          }
        ]
      },
      "confidence": 0.92,
      "analysis_notes": "Analog thickness gauge showing depth measurement"
    },
    {
      "image_index": 4,
      "image_classification": "label",
      "primary_suitability_score": 5,
      "extracted_data": {
        "text_extraction": {
          "raw_text": "С 54",
          "translated_text": "S 54",
          "language": "ru"
        }
      },
      "confidence": 0.95,
      "analysis_notes": "Label with gemstone code"
    },
    {
      "image_index": 5,
      "image_classification": "gemstone_photo",
      "primary_suitability_score": 85,
      "extracted_data": {
        "visual_assessment": {
          "quality_grade": "excellent",
          "visual_appeal": 0.9
        }
      },
      "confidence": 0.88,
      "analysis_notes": "Good quality gemstone photo"
    },
    {
      "image_index": 6,
      "image_classification": "scale_reading",
      "primary_suitability_score": 10,
      "extracted_data": {
        "measurements": [
          {
            "device_type": "digital_scale",
            "reading_value": 2.47,
            "unit": "ct",
            "measurement_type": "weight"
          }
        ]
      },
      "confidence": 0.99,
      "analysis_notes": "Digital scale showing weight"
    },
    {
      "image_index": 7,
      "image_classification": "gemstone_photo",
      "primary_suitability_score": 75,
      "extracted_data": {
        "visual_assessment": {}
      },
      "confidence": 0.85,
      "analysis_notes": "Additional gemstone photo"
    },
    {
      "image_index": 8,
      "image_classification": "environment",
      "primary_suitability_score": 20,
      "extracted_data": {},
      "confidence": 0.80,
      "analysis_notes": "Contextual photo"
    }
  ],
  "data_verification": {
    "cross_verified_fields": ["weight", "gemstone_code", "shape"],
    "conflicting_fields": [],
    "confidence_boosted_fields": ["weight", "dimensions"],
    "single_source_fields": ["clarity", "color"],
    "verification_notes": "Weight confirmed across 3 sources with high consistency",
    "gauge_readings_extracted": 3,
    "total_measurements_found": 5
  },
  "primary_image_selection": {
    "selected_image_index": 1,
    "selected_image_classification": "gemstone_beauty_shot", 
    "score": 95,
    "reasoning": "Excellent lighting, clean background, shows true color and brilliance perfectly",
    "confidence": 0.96,
    "alternative_candidates": [
      {"image_index": 5, "score": 85, "reason": "Good gemstone photo but lighting not as professional"}
    ]
  },
  "overall_confidence": 0.93,
  "data_completeness": 0.89,
  "cross_verification_score": 0.91,
  "analysis_summary": "Comprehensive analysis of {IMAGE_COUNT} images with excellent data consolidation and cross-verification"
}

**MANDATORY REQUIREMENTS:**
1. **COMPLETE ANALYSIS**: Analyze ALL {IMAGE_COUNT} images individually
2. **INDIVIDUAL ENTRIES**: individual_analyses array MUST contain exactly {IMAGE_COUNT} entries
3. **SEQUENTIAL INDICES**: Image indices must be 1, 2, 3, 4, 5, 6, 7, 8 (all {IMAGE_COUNT} images)
4. **GAUGE READINGS**: Extract measurements from every visible measuring device
5. **TEXT EXTRACTION**: Extract all Russian/Cyrillic text with translations
6. **PRIMARY SELECTION**: Choose best image for display with reasoning

**VALIDATION CHECKLIST:**
- ✓ All {IMAGE_COUNT} images classified and analyzed
- ✓ All measuring devices read and recorded
- ✓ All text extracted and translated
- ✓ Primary image selected with confidence score
- ✓ Cross-verification performed between sources

Please analyze all {IMAGE_COUNT} images thoroughly and provide the complete JSON response with individual analysis for every single image.`;

export const CLASSIFICATION_PROMPT = `Quickly classify this image type:

IMAGE CLASSIFICATION (choose ONE):
- "gemstone_beauty_shot" - Professional product photo
- "gemstone_photo" - Standard gemstone photo  
- "measurement_gauge" - Measuring tools with readings
- "scale_reading" - Digital scale
- "certificate" - Lab report/certificate
- "label" - Price tag/inventory label
- "packaging" - Box/container
- "comparison" - Multiple stones
- "environment" - Hand/workplace context
- "other" - Other type

Respond with only the classification name.`;

export const MEASUREMENT_EXTRACTION_PROMPT = `Extract precise measurements from this image:

Look for:
- Digital caliper readings (mm)
- Scale readings (weight in ct/g)
- Ruler measurements
- Any numerical displays on measuring devices

Respond with JSON:
{
  "device_type": "caliper|scale|ruler|micrometer|other",
  "reading_value": 8.83,
  "unit": "mm|ct|g",
  "measurement_type": "length|width|depth|weight",
  "confidence": 0.95,
  "additional_readings": []
}`;

export const TEXT_EXTRACTION_PROMPT = `Extract ALL text from this image, especially Russian/Cyrillic text:

Look for:
- Gemstone codes (С 54, И 32, etc.)
- Weights (2,48 ct, etc.) 
- Shapes (овал, круглый, etc.)
- Any other text or numbers

Respond with JSON:
{
  "raw_text": "Exact text as written",
  "translated_text": "English translation",
  "language": "ru|en|kz|mixed", 
  "confidence": 0.95,
  "extracted_codes": ["С 54"],
  "extracted_weights": ["2,48 ct"],
  "extracted_shapes": ["овал"]
}`;
