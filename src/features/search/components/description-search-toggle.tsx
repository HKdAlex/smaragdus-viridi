"use client";

import { Checkbox } from "@/shared/components/ui/checkbox";
import { Label } from "@/shared/components/ui/label";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export interface DescriptionSearchToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

export function DescriptionSearchToggle({
  value,
  onChange,
}: DescriptionSearchToggleProps) {
  const t = useTranslations("search.descriptionSearch");
  const [checked, setChecked] = useState<boolean>(value);

  useEffect(() => {
    setChecked(value);
  }, [value]);

  const handleChange = (nextValue: boolean) => {
    setChecked(nextValue);
    onChange(nextValue);
  };

  return (
    <div className="flex items-start space-x-3 rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
      <Checkbox
        id="search-descriptions"
        checked={checked}
        onCheckedChange={handleChange}
        className="mt-1"
      />
      <div>
        <Label
          htmlFor="search-descriptions"
          className="text-sm font-medium cursor-pointer"
        >
          {t("label")}
        </Label>
        <p className="text-xs text-muted-foreground mt-1 max-w-prose">
          {t("helper")}
        </p>
      </div>
    </div>
  );
}
