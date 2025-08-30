import { GemstoneCatalogOptimized } from "@/features/gemstones/components/gemstone-catalog-optimized";

export default function CatalogPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <GemstoneCatalogOptimized />
      </div>
    </div>
  );
}
