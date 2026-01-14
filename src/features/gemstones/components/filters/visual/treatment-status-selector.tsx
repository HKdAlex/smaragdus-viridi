"use client";

import { useTranslations } from "next-intl";

import type { TreatmentStatus } from "../../../types/filter.types";

interface TreatmentStatusSelectorProps {
  selectedStatuses: TreatmentStatus[];
  onStatusChange: (statuses: TreatmentStatus[]) => void;
}

const TREATMENT_STATUSES: Array<{
  value: TreatmentStatus;
  icon: string;
}> = [
  { value: "natural", icon: "🌿" },
  { value: "heated", icon: "🔥" },
  { value: "oiled", icon: "🫧" },
  { value: "diffused", icon: "💨" },
  { value: "irradiated", icon: "☢️" },
  { value: "filled", icon: "🧪" },
  { value: "coated", icon: "🪞" },
  { value: "untreated", icon: "✨" },
  { value: "unknown", icon: "❔" },
  { value: "other", icon: "🧩" },
];

/**
 * Visual Treatment Status Selector
 *
 * Displays treatment statuses as selectable cards.
 * Part of FILTER-C1.1: Treatment Status filter.
 */
export function TreatmentStatusSelector({
  selectedStatuses,
  onStatusChange,
}: TreatmentStatusSelectorProps) {
  const t = useTranslations("filters");

  const toggleStatus = (status: TreatmentStatus) => {
    if (selectedStatuses.includes(status)) {
      onStatusChange(selectedStatuses.filter((value) => value !== status));
    } else {
      onStatusChange([...selectedStatuses, status]);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">
        {t("visual.treatmentStatus")}
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {TREATMENT_STATUSES.map(({ value, icon }) => {
          const isSelected = selectedStatuses.includes(value);
          return (
            <button
              key={value}
              onClick={() => toggleStatus(value)}
              className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-left transition-all duration-200 ${
                isSelected
                  ? "border-primary bg-primary/10 text-primary shadow-md"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:scale-[1.02]"
              }`}
            >
              <span className="text-base" aria-hidden="true">
                {icon}
              </span>
              <span className="text-xs font-medium">
                {t(`advanced.treatmentStatusOptions.${value}`)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
