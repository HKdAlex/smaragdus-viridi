# Smaragdus Viridi Development Rules & Architecture Guide

## 🎯 Project Overview

**Platform**: Next.js 15 + TypeScript + Supabase jewelry e-commerce platform  
**Target**: Intuitive gemstone marketplace for jewelers, cutters, and end customers  
**Key Features**: Advanced filtering, real-time chat, 3D visualization, multi-currency, file management

---

## 🚫 CRITICAL: Lessons from Profitronic - What NOT to Do

### Build Quality Rules (MANDATORY)

- **NEVER write more than 3 files without running `npm run build`**
- **NEVER commit code that doesn't compile with zero errors**
- **NEVER use `any` types - jewelry data is complex and needs strict typing**
- **NEVER hardcode gemstone attributes - use database enums and types**
- **NEVER use JSONB for structured jewelry data (cut, clarity, origin, etc.)**

### TypeScript Quality Gates

```typescript
// ❌ FORBIDDEN: Gemstone attributes as any
const gemstone: any = { color: "red", cut: "oval" };

// ✅ REQUIRED: Strict gemstone typing
interface Gemstone {
  readonly id: string;
  readonly name: GemstoneType;
  readonly color: GemColor;
  readonly cut: GemCut;
  readonly weight: number; // carats
  readonly dimensions: GemDimensions;
  readonly origin: GemOrigin;
  readonly certification: Certification[];
  readonly clarity: GemClarity;
  readonly price: Money;
  readonly pricePerCarat: Money;
  readonly inStock: boolean;
  readonly deliveryDays: number;
}

type GemColor =
  | "red"
  | "blue"
  | "green"
  | "yellow"
  | "pink"
  | "white"
  | "black"
  | "colorless";
type GemCut =
  | "round"
  | "oval"
  | "marquise"
  | "pear"
  | "emerald"
  | "princess"
  | "cushion"
  | "radiant"
  | "fantasy";
```

---

## 🏗️ Database Design Rules - Jewelry Specific

### MANDATORY: Normalized Gemstone Schema

```sql
-- ✅ CORRECT: Separate tables for complex relationships
CREATE TABLE gemstones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  weight_carats DECIMAL(8,3) NOT NULL,
  length_mm DECIMAL(6,2) NOT NULL,
  width_mm DECIMAL(6,2) NOT NULL,
  depth_mm DECIMAL(6,2) NOT NULL,
  color gem_color NOT NULL,
  cut gem_cut NOT NULL,
  clarity gem_clarity NOT NULL,
  origin_id UUID REFERENCES origins(id),
  price_amount INTEGER NOT NULL, -- store in smallest currency unit
  price_currency currency_code NOT NULL,
  in_stock BOOLEAN DEFAULT TRUE,
  delivery_days INTEGER,
  internal_code TEXT UNIQUE, -- for admin identification
  serial_number TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE gemstone_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gemstone_id UUID NOT NULL REFERENCES gemstones(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_order INTEGER NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE
);

CREATE TABLE gemstone_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gemstone_id UUID NOT NULL REFERENCES gemstones(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  video_order INTEGER NOT NULL
);

CREATE TABLE certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gemstone_id UUID NOT NULL REFERENCES gemstones(id) ON DELETE CASCADE,
  certificate_type TEXT NOT NULL, -- 'GIA', 'Gübelin', etc.
  certificate_number TEXT,
  certificate_url TEXT, -- Link to certificate image/PDF
  issued_date DATE
);

-- ❌ FORBIDDEN: JSONB for structured gemstone data
-- Don't do this:
-- gemstone_attributes JSONB, -- Bad!
-- media_files JSONB, -- Bad!
-- pricing_data JSONB -- Bad!
```

### User Roles & Permissions

```sql
CREATE TYPE user_role AS ENUM ('admin', 'regular_customer', 'premium_customer', 'guest');

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  role user_role DEFAULT 'regular_customer',
  discount_percentage DECIMAL(5,2) DEFAULT 0, -- for premium customers
  preferred_currency currency_code DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🎨 Feature-Based Architecture

### Directory Structure

```
src/
├── features/
│   ├── auth/                    # Authentication system
│   ├── gemstones/              # Gemstone catalog & filtering
│   │   ├── components/
│   │   │   ├── gemstone-card.tsx
│   │   │   ├── gemstone-grid.tsx
│   │   │   ├── advanced-filters.tsx
│   │   │   ├── color-filter.tsx
│   │   │   ├── cut-filter.tsx
│   │   │   └── price-range-slider.tsx
│   │   ├── hooks/
│   │   │   ├── use-gemstone-search.ts
│   │   │   ├── use-filters.ts
│   │   │   └── use-advanced-search.ts
│   │   ├── services/
│   │   │   ├── gemstone-service.ts
│   │   │   ├── filter-service.ts
│   │   │   └── search-service.ts
│   │   ├── types/
│   │   │   ├── gemstone.types.ts
│   │   │   ├── filter.types.ts
│   │   │   └── search.types.ts
│   │   └── utils/
│   │       ├── gemstone-validators.ts
│   │       └── price-formatters.ts
│   ├── chat/                   # Real-time chat system
│   ├── cart/                   # Shopping cart functionality
│   ├── orders/                 # Order management
│   ├── media/                  # File upload/download
│   ├── currency/               # Multi-currency system
│   ├── visualization/          # 3D ring visualization
│   └── admin/                  # Admin panel functionality
```

---

## ⚡ Next.js 15 Patterns for Jewelry Platform

### Gemstone Detail Pages

```typescript
// app/[locale]/gemstones/[id]/page.tsx
interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function GemstonePage({ params }: PageProps) {
  const { id, locale } = await params; // Must await params

  const supabase = await createClient();
  const { data: gemstone, error } = await supabase
    .from("gemstones")
    .select(
      `
      *,
      origin:origins(*),
      images:gemstone_images(*),
      videos:gemstone_videos(*),
      certifications:certifications(*)
    `
    )
    .eq("id", id)
    .single();

  if (error || !gemstone) {
    notFound();
  }

  return <GemstoneDetails gemstone={gemstone} locale={locale} />;
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: gemstone } = await supabase
    .from("gemstones")
    .select("name, color, cut, weight_carats, serial_number")
    .eq("id", id)
    .single();

  if (!gemstone) return { title: "Gemstone Not Found" };

  return {
    title: `${gemstone.color} ${gemstone.name} ${gemstone.cut} ${gemstone.weight_carats}ct - ${gemstone.serial_number}`,
    description: `Premium ${gemstone.color} ${gemstone.name} with ${gemstone.cut} cut, ${gemstone.weight_carats} carats. Professional gemstone for jewelers.`,
  };
}
```

### Advanced Filtering with Real-time Updates

```typescript
// features/gemstones/hooks/use-advanced-filters.ts
"use client";

import { useState, useCallback, useMemo } from "react";
import { useDebounce } from "@/features/shared/hooks/use-debounce";

interface GemstoneFilters {
  search: string;
  colors: GemColor[];
  cuts: GemCut[];
  priceRange: [number, number];
  origins: string[];
  inStockOnly: boolean;
  weightRange: [number, number]; // carats
}

export function useAdvancedFilters() {
  const [filters, setFilters] = useState<GemstoneFilters>({
    search: "",
    colors: [],
    cuts: [],
    priceRange: [0, 100000000],
    origins: [],
    inStockOnly: false,
    weightRange: [0, 50],
  });

  const debouncedFilters = useDebounce(filters, 300);

  const updateFilter = useCallback(
    <K extends keyof GemstoneFilters>(key: K, value: GemstoneFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFilters({
      search: "",
      colors: [],
      cuts: [],
      priceRange: [0, 100000000],
      origins: [],
      inStockOnly: false,
      weightRange: [0, 50],
    });
  }, []);

  // Memoize filter query for performance
  const filterQuery = useMemo(() => {
    return {
      search: debouncedFilters.search,
      colors: debouncedFilters.colors,
      cuts: debouncedFilters.cuts,
      minPrice: debouncedFilters.priceRange[0],
      maxPrice: debouncedFilters.priceRange[1],
      origins: debouncedFilters.origins,
      inStockOnly: debouncedFilters.inStockOnly,
      minWeight: debouncedFilters.weightRange[0],
      maxWeight: debouncedFilters.weightRange[1],
    };
  }, [debouncedFilters]);

  return {
    filters,
    filterQuery,
    updateFilter,
    resetFilters,
  };
}
```

---

## 💰 Multi-Currency System

### Currency Service Pattern

```typescript
// features/currency/services/currency-service.ts
export class CurrencyService {
  private exchangeRates: Map<string, number> = new Map();

  constructor(private logger: Logger) {}

  async convertPrice(
    amount: number,
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode
  ): Promise<Result<ConvertedPrice, CurrencyError>> {
    try {
      if (fromCurrency === toCurrency) {
        return { data: { amount, currency: toCurrency, rate: 1 } };
      }

      const rate = await this.getExchangeRate(fromCurrency, toCurrency);
      const convertedAmount = Math.round(amount * rate);

      this.logger.info("Currency conversion performed", {
        fromCurrency,
        toCurrency,
        originalAmount: amount,
        convertedAmount,
        rate,
      });

      return {
        data: {
          amount: convertedAmount,
          currency: toCurrency,
          rate,
          originalAmount: amount,
          originalCurrency: fromCurrency,
        },
      };
    } catch (error) {
      this.logger.error("Currency conversion failed", error as Error, {
        fromCurrency,
        toCurrency,
        amount,
      });
      return {
        error: new CurrencyError("CONVERSION_FAILED", (error as Error).message),
      };
    }
  }

  private async getExchangeRate(
    from: CurrencyCode,
    to: CurrencyCode
  ): Promise<number> {
    const cacheKey = `${from}-${to}`;

    // Check cache first
    if (this.exchangeRates.has(cacheKey)) {
      return this.exchangeRates.get(cacheKey)!;
    }

    // Fetch from external API
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${from}`
    );
    const data = await response.json();

    if (!data.rates[to]) {
      throw new Error(`Exchange rate not available for ${from} to ${to}`);
    }

    const rate = data.rates[to];
    this.exchangeRates.set(cacheKey, rate);

    // Cache for 1 hour
    setTimeout(() => this.exchangeRates.delete(cacheKey), 3600000);

    return rate;
  }
}
```

---

## 💬 Real-Time Chat System

### Chat with Supabase Realtime

```typescript
// features/chat/hooks/use-chat.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export function useChat(userId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (!userId) return;

    // Fetch existing messages
    supabase
      .from("chat_messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setMessages(data);
      });

    // Subscribe to new messages
    const subscription = supabase
      .channel(`chat-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .on("presence", { event: "sync" }, () => setIsConnected(true))
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, supabase]);

  const sendMessage = useCallback(
    async (content: string, attachments?: File[]) => {
      if (!userId) return;

      try {
        // Upload attachments if any
        const attachmentUrls = attachments
          ? await uploadChatAttachments(attachments)
          : [];

        const { error } = await supabase.from("chat_messages").insert({
          user_id: userId,
          content,
          attachments: attachmentUrls,
          sender_type: "user",
        });

        if (error) throw error;

        // Auto-response if admin not available
        setTimeout(async () => {
          const { error } = await supabase.from("chat_messages").insert({
            user_id: userId,
            content: "Ответим вам, как только освободимся",
            sender_type: "admin",
            is_auto_response: true,
          });
        }, 600000); // 10 minutes
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    },
    [userId, supabase]
  );

  return {
    messages,
    isTyping,
    isConnected,
    sendMessage,
  };
}
```

---

## 📁 Media Management System

### File Upload with Watermarking

```typescript
// features/media/services/media-service.ts
export class MediaService {
  constructor(private s3Service: S3Service, private logger: Logger) {}

  async uploadGemstoneImages(
    gemstoneId: string,
    files: File[],
    serialNumber: string
  ): Promise<Result<MediaUploadResult[], MediaError>> {
    try {
      const results: MediaUploadResult[] = [];

      for (const file of files) {
        // Add serial number watermark
        const watermarkedFile = await this.addSerialNumberWatermark(
          file,
          serialNumber
        );

        // Upload to S3
        const uploadResult = await this.s3Service.upload(
          `gemstones/${gemstoneId}/images/${file.name}`,
          watermarkedFile
        );

        // Save to database
        const { data: imageRecord, error } = await this.supabase
          .from("gemstone_images")
          .insert({
            gemstone_id: gemstoneId,
            image_url: uploadResult.url,
            image_order: results.length + 1,
          })
          .select()
          .single();

        if (error) throw error;

        results.push({
          id: imageRecord.id,
          url: uploadResult.url,
          originalName: file.name,
          serialNumber,
        });

        this.logger.info("Gemstone image uploaded", {
          gemstoneId,
          imageId: imageRecord.id,
          fileName: file.name,
          serialNumber,
        });
      }

      return { data: results };
    } catch (error) {
      this.logger.error("Media upload failed", error as Error, { gemstoneId });
      return {
        error: new MediaError("UPLOAD_FAILED", (error as Error).message),
      };
    }
  }

  private async addSerialNumberWatermark(
    file: File,
    serialNumber: string
  ): Promise<File> {
    // Implementation using canvas or image processing library
    // Add serial number to corner of image/video frames
    return file; // Placeholder
  }

  async generateDownloadZip(
    gemstoneId: string
  ): Promise<Result<string, MediaError>> {
    try {
      const { data: images } = await this.supabase
        .from("gemstone_images")
        .select("image_url")
        .eq("gemstone_id", gemstoneId);

      const { data: videos } = await this.supabase
        .from("gemstone_videos")
        .select("video_url")
        .eq("gemstone_id", gemstoneId);

      // Create ZIP file with all media
      const zipUrl = await this.createMediaZip([
        ...(images?.map((i) => i.image_url) || []),
        ...(videos?.map((v) => v.video_url) || []),
      ]);

      this.logger.info("Media download zip created", { gemstoneId, zipUrl });

      return { data: zipUrl };
    } catch (error) {
      return {
        error: new MediaError("ZIP_CREATION_FAILED", (error as Error).message),
      };
    }
  }
}
```

---

## 🎯 3D Visualization System

### Ring Size Visualizer

```typescript
// features/visualization/components/ring-size-visualizer.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import * as THREE from "three";

interface RingSizeVisualizerProps {
  gemstone: Gemstone;
  onSizeChange?: (size: RingSize) => void;
}

export function RingSizeVisualizer({
  gemstone,
  onSizeChange,
}: RingSizeVisualizerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedSize, setSelectedSize] = useState<RingSize>("7");
  const [fingerType, setFingerType] = useState<FingerType>("average");
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();

  useEffect(() => {
    if (!mountRef.current) return;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 400 / 300, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    renderer.setSize(400, 300);
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);

    // Create finger model
    const fingerGeometry = createFingerGeometry(selectedSize, fingerType);
    const fingerMaterial = new THREE.MeshLambertMaterial({
      color: 0xfdbcb4, // skin tone
      transparent: true,
      opacity: 0.8,
    });
    const finger = new THREE.Mesh(fingerGeometry, fingerMaterial);
    scene.add(finger);

    // Create gemstone model
    const gemGeometry = createGemstoneGeometry(gemstone);
    const gemMaterial = new THREE.MeshPhongMaterial({
      color: getGemstoneColor(gemstone.color),
      transparent: true,
      opacity: 0.9,
      shininess: 100,
    });
    const gem = new THREE.Mesh(gemGeometry, gemMaterial);

    // Position gemstone on finger
    gem.position.set(0, fingerGeometry.parameters.radiusTop + 2, 0);
    scene.add(gem);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    scene.add(directionalLight);

    camera.position.set(0, 5, 15);
    camera.lookAt(0, 0, 0);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      gem.rotation.y += 0.01; // Rotate gemstone
      renderer.render(scene, camera);
    };

    animate();

    sceneRef.current = scene;
    rendererRef.current = renderer;

    return () => {
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [gemstone, selectedSize, fingerType]);

  const handleSizeChange = (size: RingSize) => {
    setSelectedSize(size);
    onSizeChange?.(size);
  };

  return (
    <div className="space-y-4">
      <div ref={mountRef} className="border rounded-lg overflow-hidden" />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Ring Size</label>
          <select
            value={selectedSize}
            onChange={(e) => handleSizeChange(e.target.value as RingSize)}
            className="w-full p-2 border rounded"
          >
            <option value="5">5 (15.7mm)</option>
            <option value="6">6 (16.5mm)</option>
            <option value="7">7 (17.3mm)</option>
            <option value="8">8 (18.2mm)</option>
            <option value="9">9 (19.0mm)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Finger Type</label>
          <select
            value={fingerType}
            onChange={(e) => setFingerType(e.target.value as FingerType)}
            className="w-full p-2 border rounded"
          >
            <option value="slim">Slim</option>
            <option value="average">Average</option>
            <option value="wide">Wide</option>
          </select>
        </div>
      </div>
    </div>
  );
}
```

---

## 📊 Structured Logging for Jewelry Platform

### Business Events Logging

```typescript
// lib/logger.ts - Jewelry-specific logging
export const gemstoneLogger = createLogger("gemstone-service");
export const orderLogger = createLogger("order-service");
export const chatLogger = createLogger("chat-service");

// Usage examples:
gemstoneLogger.info("Gemstone viewed", {
  event: "gemstone_viewed",
  gemstoneId: gemstone.id,
  serialNumber: gemstone.serialNumber,
  userId: user?.id,
  userRole: user?.role,
  color: gemstone.color,
  cut: gemstone.cut,
  weight: gemstone.weight,
  price: gemstone.price,
  referrer: req.headers.referer,
});

orderLogger.info("Order placed", {
  event: "order_placed",
  orderId: order.id,
  userId: order.userId,
  totalAmount: order.totalAmount,
  currency: order.currency,
  itemCount: order.items.length,
  gemstonIds: order.items.map((item) => item.gemstoneId),
  paymentMethod: order.paymentMethod,
  deliveryAddress: order.deliveryCity,
});

chatLogger.info("Chat message sent", {
  event: "chat_message_sent",
  userId: message.userId,
  messageType: message.senderType,
  hasAttachments: message.attachments.length > 0,
  responseTime: message.responseTimeMs,
  adminId: message.adminId,
});
```

---

## 🔧 Performance Optimization Rules

### Image Optimization for Gemstones

```typescript
// components/gemstone-image.tsx
import Image from "next/image";
import { useState } from "react";

interface GemstoneImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  serialNumber: string;
}

export function GemstoneImage({
  src,
  alt,
  width,
  height,
  priority = false,
  serialNumber,
}: GemstoneImageProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="relative overflow-hidden rounded-lg">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className={`transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        onLoadingComplete={() => setIsLoading(false)}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />

      {/* Serial number watermark */}
      <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
        {serialNumber}
      </div>

      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  );
}
```

### Memoization for Filter Components

```typescript
// features/gemstones/components/gemstone-grid.tsx
"use client";

import { useMemo, useCallback } from "react";

interface GemstoneGridProps {
  gemstones: Gemstone[];
  filters: GemstoneFilters;
  userRole: UserRole;
}

export function GemstoneGrid({
  gemstones,
  filters,
  userRole,
}: GemstoneGridProps) {
  // Memoize expensive filtering operations
  const filteredGemstones = useMemo(() => {
    return gemstones.filter((gemstone) => {
      if (
        filters.colors.length > 0 &&
        !filters.colors.includes(gemstone.color)
      ) {
        return false;
      }
      if (filters.cuts.length > 0 && !filters.cuts.includes(gemstone.cut)) {
        return false;
      }
      if (filters.priceRange) {
        const price = getPriceForRole(gemstone, userRole);
        if (price < filters.priceRange[0] || price > filters.priceRange[1]) {
          return false;
        }
      }
      if (filters.inStockOnly && !gemstone.inStock) {
        return false;
      }
      return true;
    });
  }, [gemstones, filters, userRole]);

  // Memoize price calculation for role
  const getPriceForRole = useCallback((gemstone: Gemstone, role: UserRole) => {
    if (role === "premium_customer" && gemstone.premiumPrice) {
      return gemstone.premiumPrice;
    }
    return gemstone.price;
  }, []);

  const handleAddToCart = useCallback((gemstoneId: string) => {
    // Handle cart addition
  }, []);

  const handleToggleFavorite = useCallback((gemstoneId: string) => {
    // Handle favorite toggle
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredGemstones.map((gemstone) => (
        <GemstoneCard
          key={gemstone.id}
          gemstone={gemstone}
          userRole={userRole}
          onAddToCart={handleAddToCart}
          onToggleFavorite={handleToggleFavorite}
        />
      ))}
    </div>
  );
}
```

---

## 🔐 Security Rules

### File Upload Security

```typescript
// features/media/utils/file-validators.ts
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"] as const;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function validateImageFile(file: File): Result<File, ValidationError> {
  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as any)) {
    return {
      error: new ValidationError(
        "Invalid file type. Only JPEG, PNG, and WebP are allowed."
      ),
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      error: new ValidationError("File too large. Maximum size is 50MB."),
    };
  }

  // Check file name for malicious content
  if (!/^[a-zA-Z0-9._-]+$/.test(file.name)) {
    return {
      error: new ValidationError(
        "Invalid file name. Only alphanumeric characters, dots, underscores, and hyphens are allowed."
      ),
    };
  }

  return { data: file };
}

export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .toLowerCase();
}
```

### Admin Route Protection

```typescript
// lib/auth/admin-guard.ts
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/unauthorized");
  }

  return { user, profile };
}
```

---

## ✅ Quality Gates & Testing

### Pre-Commit Checklist

- [ ] `npm run build` exits with code 0
- [ ] `npm run lint` shows no errors or warnings
- [ ] All gemstone filter combinations work correctly
- [ ] Chat functionality tested in different browsers
- [ ] Currency conversion works for all supported currencies
- [ ] File upload/download tested with various file types
- [ ] 3D visualization loads without errors
- [ ] Mobile responsiveness verified
- [ ] Database queries optimized (no N+1 problems)

### Build Quality Standards

```typescript
// Type coverage requirement: 100%
// No any types allowed
// All database types must be generated and aligned
// All business logic must have proper error handling
// All user inputs must be validated with Zod schemas
```

---

## 🚀 Deployment Checklist

### Environment Variables

```env
# Database
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# File Storage
AWS_S3_BUCKET_NAME=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=

# Currency API
EXCHANGE_RATE_API_KEY=

# Chat & Notifications
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=

# Security
JWT_SECRET=
ENCRYPTION_KEY=

# Logging
LOG_LEVEL=info
LOGTAIL_SOURCE_TOKEN=
```

### Performance Targets

- **Page Load Time**: < 2 seconds
- **Image Loading**: Progressive with lazy loading
- **Search Response**: < 500ms
- **Chat Message Delivery**: < 100ms
- **Currency Conversion**: Cached for 1 hour
- **Filter Updates**: Real-time with debouncing

---

## 📝 Documentation Requirements

### API Documentation

- Document all filter parameters
- Include currency conversion endpoints
- Chat API for admin integration
- File upload/download endpoints
- 3D visualization configuration

### User Guides

- Gemstone search and filtering
- Chat usage instructions
- Order placement process
- File download instructions
- Ring size visualization guide

Remember: **Follow these rules strictly to avoid the cascading error issues we experienced in Profitronic. Build incrementally, test frequently, and maintain type safety throughout the jewelry platform development.**
