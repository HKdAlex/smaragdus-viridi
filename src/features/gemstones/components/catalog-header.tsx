/**
 * Catalog Header Component
 *
 * Displays the title and description for catalog pages.
 * Reusable across different catalog views.
 */

"use client";

export interface CatalogHeaderProps {
  title: string;
  description?: string;
  className?: string;
}

export function CatalogHeader({
  title,
  description,
  className = "",
}: CatalogHeaderProps) {
  return (
    <div className={`text-center px-4 ${className}`}>
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4">
        {title}
      </h1>
      {description && (
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
