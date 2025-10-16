import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Download,
  Eye,
  Gem,
  Lightbulb,
  Play,
  RotateCcw,
  Settings,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Gemstone } from "@/shared/types";
import { Lazy3DVisualizer } from "@/features/visualization";
import { Metadata } from "next";
import { VisualizationDemo } from "@/features/visualization/components/visualization-demo";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "demo" });

  return {
    title: t("3dVisualizerDemo.title"),
    description: t("3dVisualizerDemo.description"),
  };
}

// Sample gemstone data for demo
const sampleGemstones: Gemstone[] = [
  {
    id: "demo-1",
    name: "diamond",
    color: "D",
    cut: "round",
    clarity: "FL",
    type_code: "diamond",
    color_code: "D",
    cut_code: "round",
    clarity_code: "FL",
    search_vector_en: null,
    search_vector_ru: null,
    description_vector_en: null,
    description_vector_ru: null,
    weight_carats: 1.5,
    length_mm: 7.4,
    width_mm: 7.4,
    depth_mm: 4.5,
    price_amount: 1500000, // $15,000 in cents
    price_currency: "USD",
    premium_price_amount: null,
    premium_price_currency: null,
    price_per_carat: null,
    quantity: 1,
    in_stock: true,
    delivery_days: 3,
    internal_code: "DEMO-001",
    serial_number: "DIA-001-FL",
    origin_id: null,
    ai_analyzed: false,
    ai_confidence_score: null,
    ai_analysis_date: null,
    ai_data_completeness: null,
    metadata_status: null,
    // AI v5 fields
    ai_analysis_v5: false,
    ai_analysis_v5_date: null,
    ai_clarity: null,
    ai_color: null,
    ai_cut: null,
    ai_depth_mm: null,
    ai_length_mm: null,
    ai_width_mm: null,
    ai_weight_carats: null,
    ai_origin: null,
    ai_quality_grade: null,
    ai_treatment: null,
    ai_description_cost_usd: null,
    ai_description_date: null,
    ai_description_model: null,
    ai_extracted_date: null,
    ai_extraction_confidence: null,
    // AI v6 fields
    ai_text_generated_v6: false,
    ai_text_generated_v6_date: null,
    description_emotional_en: null,
    description_emotional_ru: null,
    description_technical_en: null,
    description_technical_ru: null,
    narrative_story_en: null,
    narrative_story_ru: null,
    description: null,
    promotional_text: null,
    marketing_highlights: null,
    import_batch_id: null,
    import_folder_path: null,
    import_notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    // Enhanced properties
    dimensions: {
      length_mm: 7.4,
      width_mm: 7.4,
      depth_mm: 4.5,
    },
    price: {
      amount: 1500000,
      currency: "USD",
    },
  },
  {
    id: "demo-2",
    name: "emerald",
    color: "green",
    cut: "emerald",
    clarity: "VVS1",
    type_code: "emerald",
    color_code: "green",
    cut_code: "emerald",
    clarity_code: "VVS1",
    search_vector_en: null,
    search_vector_ru: null,
    description_vector_en: null,
    description_vector_ru: null,
    weight_carats: 2.0,
    length_mm: 8.5,
    width_mm: 6.2,
    depth_mm: 5.1,
    price_amount: 800000, // $8,000 in cents
    price_currency: "USD",
    premium_price_amount: null,
    premium_price_currency: null,
    price_per_carat: null,
    quantity: 1,
    in_stock: true,
    delivery_days: 5,
    internal_code: "DEMO-002",
    serial_number: "EMR-002-VVS1",
    origin_id: null,
    ai_analyzed: false,
    ai_confidence_score: null,
    ai_analysis_date: null,
    ai_data_completeness: null,
    metadata_status: null,
    // AI v5 fields
    ai_analysis_v5: false,
    ai_analysis_v5_date: null,
    ai_clarity: null,
    ai_color: null,
    ai_cut: null,
    ai_depth_mm: null,
    ai_length_mm: null,
    ai_width_mm: null,
    ai_weight_carats: null,
    ai_origin: null,
    ai_quality_grade: null,
    ai_treatment: null,
    ai_description_cost_usd: null,
    ai_description_date: null,
    ai_description_model: null,
    ai_extracted_date: null,
    ai_extraction_confidence: null,
    // AI v6 fields
    ai_text_generated_v6: false,
    ai_text_generated_v6_date: null,
    description_emotional_en: null,
    description_emotional_ru: null,
    description_technical_en: null,
    description_technical_ru: null,
    narrative_story_en: null,
    narrative_story_ru: null,
    description: null,
    promotional_text: null,
    marketing_highlights: null,
    import_batch_id: null,
    import_folder_path: null,
    import_notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    // Enhanced properties
    dimensions: {
      length_mm: 8.5,
      width_mm: 6.2,
      depth_mm: 5.1,
    },
    price: {
      amount: 800000,
      currency: "USD",
    },
  },
  {
    id: "demo-3",
    name: "ruby",
    color: "red",
    cut: "oval",
    clarity: "VS1",
    type_code: "ruby",
    color_code: "red",
    cut_code: "oval",
    clarity_code: "VS1",
    search_vector_en: null,
    search_vector_ru: null,
    description_vector_en: null,
    description_vector_ru: null,
    weight_carats: 1.8,
    length_mm: 9.2,
    width_mm: 6.8,
    depth_mm: 4.2,
    price_amount: 1200000, // $12,000 in cents
    price_currency: "USD",
    premium_price_amount: null,
    premium_price_currency: null,
    price_per_carat: null,
    quantity: 1,
    in_stock: true,
    delivery_days: 4,
    internal_code: "DEMO-003",
    serial_number: "RUB-003-VS1",
    origin_id: null,
    ai_analyzed: false,
    ai_confidence_score: null,
    ai_analysis_date: null,
    ai_data_completeness: null,
    metadata_status: null,
    // AI v5 fields
    ai_analysis_v5: false,
    ai_analysis_v5_date: null,
    ai_clarity: null,
    ai_color: null,
    ai_cut: null,
    ai_depth_mm: null,
    ai_length_mm: null,
    ai_width_mm: null,
    ai_weight_carats: null,
    ai_origin: null,
    ai_quality_grade: null,
    ai_treatment: null,
    ai_description_cost_usd: null,
    ai_description_date: null,
    ai_description_model: null,
    ai_extracted_date: null,
    ai_extraction_confidence: null,
    // AI v6 fields
    ai_text_generated_v6: false,
    ai_text_generated_v6_date: null,
    description_emotional_en: null,
    description_emotional_ru: null,
    description_technical_en: null,
    description_technical_ru: null,
    narrative_story_en: null,
    narrative_story_ru: null,
    description: null,
    promotional_text: null,
    marketing_highlights: null,
    import_batch_id: null,
    import_folder_path: null,
    import_notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    // Enhanced properties
    dimensions: {
      length_mm: 9.2,
      width_mm: 6.8,
      depth_mm: 4.2,
    },
    price: {
      amount: 1200000,
      currency: "USD",
    },
  },
  {
    id: "demo-4",
    name: "sapphire",
    color: "blue",
    cut: "cushion",
    clarity: "VVS2",
    type_code: "sapphire",
    color_code: "blue",
    cut_code: "cushion",
    clarity_code: "VVS2",
    search_vector_en: null,
    search_vector_ru: null,
    description_vector_en: null,
    description_vector_ru: null,
    weight_carats: 2.5,
    length_mm: 8.8,
    width_mm: 7.2,
    depth_mm: 5.8,
    price_amount: 1800000, // $18,000 in cents
    price_currency: "USD",
    premium_price_amount: null,
    premium_price_currency: null,
    price_per_carat: null,
    quantity: 1,
    in_stock: true,
    delivery_days: 6,
    internal_code: "DEMO-004",
    serial_number: "SAP-004-VVS2",
    origin_id: null,
    ai_analyzed: false,
    ai_confidence_score: null,
    ai_analysis_date: null,
    ai_data_completeness: null,
    metadata_status: null,
    // AI v5 fields
    ai_analysis_v5: false,
    ai_analysis_v5_date: null,
    ai_clarity: null,
    ai_color: null,
    ai_cut: null,
    ai_depth_mm: null,
    ai_length_mm: null,
    ai_width_mm: null,
    ai_weight_carats: null,
    ai_origin: null,
    ai_quality_grade: null,
    ai_treatment: null,
    ai_description_cost_usd: null,
    ai_description_date: null,
    ai_description_model: null,
    ai_extracted_date: null,
    ai_extraction_confidence: null,
    // AI v6 fields
    ai_text_generated_v6: false,
    ai_text_generated_v6_date: null,
    description_emotional_en: null,
    description_emotional_ru: null,
    description_technical_en: null,
    description_technical_ru: null,
    narrative_story_en: null,
    narrative_story_ru: null,
    description: null,
    promotional_text: null,
    marketing_highlights: null,
    import_batch_id: null,
    import_folder_path: null,
    import_notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    // Enhanced properties
    dimensions: {
      length_mm: 8.8,
      width_mm: 7.2,
      depth_mm: 5.8,
    },
    price: {
      amount: 1800000,
      currency: "USD",
    },
  },
  {
    id: "demo-5",
    name: "diamond",
    color: "fancy-yellow",
    cut: "princess",
    clarity: "SI1",
    type_code: "diamond",
    color_code: "fancy-yellow",
    cut_code: "princess",
    clarity_code: "SI1",
    search_vector_en: null,
    search_vector_ru: null,
    description_vector_en: null,
    description_vector_ru: null,
    weight_carats: 3.0,
    length_mm: 9.1,
    width_mm: 9.1,
    depth_mm: 6.2,
    price_amount: 2500000, // $25,000 in cents
    price_currency: "USD",
    premium_price_amount: null,
    premium_price_currency: null,
    price_per_carat: null,
    quantity: 1,
    in_stock: true,
    delivery_days: 7,
    internal_code: "DEMO-005",
    serial_number: "DIA-005-FY",
    origin_id: null,
    ai_analyzed: false,
    ai_confidence_score: null,
    ai_analysis_date: null,
    ai_data_completeness: null,
    metadata_status: null,
    // AI v5 fields
    ai_analysis_v5: false,
    ai_analysis_v5_date: null,
    ai_clarity: null,
    ai_color: null,
    ai_cut: null,
    ai_depth_mm: null,
    ai_length_mm: null,
    ai_width_mm: null,
    ai_weight_carats: null,
    ai_origin: null,
    ai_quality_grade: null,
    ai_treatment: null,
    ai_description_cost_usd: null,
    ai_description_date: null,
    ai_description_model: null,
    ai_extracted_date: null,
    ai_extraction_confidence: null,
    // AI v6 fields
    ai_text_generated_v6: false,
    ai_text_generated_v6_date: null,
    description_emotional_en: null,
    description_emotional_ru: null,
    description_technical_en: null,
    description_technical_ru: null,
    narrative_story_en: null,
    narrative_story_ru: null,
    description: null,
    promotional_text: null,
    marketing_highlights: null,
    import_batch_id: null,
    import_folder_path: null,
    import_notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    // Enhanced properties
    dimensions: {
      length_mm: 9.1,
      width_mm: 9.1,
      depth_mm: 6.2,
    },
    price: {
      amount: 2500000,
      currency: "USD",
    },
  },
  {
    id: "demo-6",
    name: "amethyst",
    color: "pink",
    cut: "heart",
    clarity: "VS2",
    type_code: "amethyst",
    color_code: "pink",
    cut_code: "heart",
    clarity_code: "VS2",
    search_vector_en: null,
    search_vector_ru: null,
    description_vector_en: null,
    description_vector_ru: null,
    weight_carats: 1.2,
    length_mm: 6.8,
    width_mm: 6.8,
    depth_mm: 4.1,
    price_amount: 150000, // $1,500 in cents
    price_currency: "USD",
    premium_price_amount: null,
    premium_price_currency: null,
    price_per_carat: null,
    quantity: 1,
    in_stock: true,
    delivery_days: 2,
    internal_code: "DEMO-006",
    serial_number: "AMT-006-VS2",
    origin_id: null,
    ai_analyzed: false,
    ai_confidence_score: null,
    ai_analysis_date: null,
    ai_data_completeness: null,
    metadata_status: null,
    // AI v5 fields
    ai_analysis_v5: false,
    ai_analysis_v5_date: null,
    ai_clarity: null,
    ai_color: null,
    ai_cut: null,
    ai_depth_mm: null,
    ai_length_mm: null,
    ai_width_mm: null,
    ai_weight_carats: null,
    ai_origin: null,
    ai_quality_grade: null,
    ai_treatment: null,
    ai_description_cost_usd: null,
    ai_description_date: null,
    ai_description_model: null,
    ai_extracted_date: null,
    ai_extraction_confidence: null,
    // AI v6 fields
    ai_text_generated_v6: false,
    ai_text_generated_v6_date: null,
    description_emotional_en: null,
    description_emotional_ru: null,
    description_technical_en: null,
    description_technical_ru: null,
    narrative_story_en: null,
    narrative_story_ru: null,
    description: null,
    promotional_text: null,
    marketing_highlights: null,
    import_batch_id: null,
    import_folder_path: null,
    import_notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    // Enhanced properties
    dimensions: {
      length_mm: 6.8,
      width_mm: 6.8,
      depth_mm: 4.1,
    },
    price: {
      amount: 150000,
      currency: "USD",
    },
  },
];

export default async function VisualizerDemoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "demo" });

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Gem className="w-8 h-8 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-900">
            3D Stone Visualizer Demo
          </h1>
          <Sparkles className="w-8 h-8 text-yellow-500" />
        </div>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Experience our cutting-edge 3D visualization technology. Interact with
          realistic gemstone models, explore different lighting modes, and see
          how your stones will look in real life.
        </p>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="text-center">
          <CardContent className="pt-6">
            <Eye className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Interactive 3D View</h3>
            <p className="text-sm text-gray-600">
              Rotate, zoom, and explore gemstones from every angle
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-6">
            <Lightbulb className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Professional Lighting</h3>
            <p className="text-sm text-gray-600">
              Studio, natural, and dramatic lighting modes
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-6">
            <Download className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">High-Quality Export</h3>
            <p className="text-sm text-gray-600">
              Download high-resolution images of your stones
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-6">
            <Settings className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Customizable Views</h3>
            <p className="text-sm text-gray-600">
              Multiple view angles and control options
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Demo Section */}
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Featured Gemstone Collection
          </h2>
          <p className="text-lg text-gray-600">
            Click on any gemstone below to explore it in 3D
          </p>
        </div>

        {/* Gemstone Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sampleGemstones.map((gemstone) => (
            <Card
              key={gemstone.id}
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg capitalize">
                    {gemstone.name} - {gemstone.serial_number}
                  </CardTitle>
                  <Badge variant="outline" className="capitalize">
                    {gemstone.cut}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Gemstone Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Weight:</span>
                    <span className="ml-2 font-medium">
                      {gemstone.weight_carats}ct
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Color:</span>
                    <span className="ml-2 font-medium capitalize">
                      {gemstone.color}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Clarity:</span>
                    <span className="ml-2 font-medium">{gemstone.clarity}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Price:</span>
                    <span className="ml-2 font-medium">
                      ${(gemstone.price_amount / 100).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* 3D Visualizer */}
                <div className="border rounded-lg overflow-hidden">
                  <Lazy3DVisualizer gemstone={gemstone} className="w-full" />
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Interactive Demo Section */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Interactive Demo
          </h2>
          <p className="text-lg text-gray-600">
            Try the full-featured visualizer with all controls
          </p>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">
              Premium Diamond - Round Brilliant Cut
            </CardTitle>
            <div className="flex justify-center gap-2">
              <Badge variant="secondary">D Color</Badge>
              <Badge variant="secondary">FL Clarity</Badge>
              <Badge variant="secondary">1.5ct</Badge>
            </div>
          </CardHeader>

          <CardContent>
            <VisualizationDemo
              gemstone={sampleGemstones[0]}
              className="w-full"
            />
          </CardContent>
        </Card>
      </div>

      {/* Technical Specifications */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Technical Features
          </h2>
          <p className="text-lg text-gray-600">
            Powered by advanced 3D rendering technology
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-blue-600" />
                Real-time Rendering
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• 60 FPS smooth animation</li>
                <li>• WebGL 2.0 acceleration</li>
                <li>• Adaptive quality settings</li>
                <li>• Memory-optimized rendering</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                Realistic Materials
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Physically-based rendering</li>
                <li>• Accurate IOR values</li>
                <li>• Clarity-based opacity</li>
                <li>• Professional lighting</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-600" />
                Interactive Controls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Orbit controls</li>
                <li>• Multiple view modes</li>
                <li>• Lighting presets</li>
                <li>• Screenshot export</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Browser Compatibility */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Browser Compatibility</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
                <span className="text-green-600 font-bold">Chrome</span>
              </div>
              <p className="text-sm text-gray-600">80+</p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto">
                <span className="text-orange-600 font-bold">Firefox</span>
              </div>
              <p className="text-sm text-gray-600">75+</p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
                <span className="text-blue-600 font-bold">Safari</span>
              </div>
              <p className="text-sm text-gray-600">13+</p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto">
                <span className="text-purple-600 font-bold">Edge</span>
              </div>
              <p className="text-sm text-gray-600">80+</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <div className="text-center space-y-4 py-8">
        <h2 className="text-3xl font-bold text-gray-900">
          Ready to Experience 3D Visualization?
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Integrate our 3D visualizer into your gemstone catalog and provide
          customers with an immersive shopping experience.
        </p>
        <div className="flex justify-center gap-4">
          <Button size="lg" className="px-8">
            <Play className="w-5 h-5 mr-2" />
            Start Integration
          </Button>
          <Button variant="outline" size="lg" className="px-8">
            <Download className="w-5 h-5 mr-2" />
            Download SDK
          </Button>
        </div>
      </div>
    </div>
  );
}
