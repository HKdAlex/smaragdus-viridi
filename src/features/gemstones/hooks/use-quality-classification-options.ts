"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

export interface QualityClassificationOption {
  value: string;
  label: string;
  count: number;
}

export interface UseQualityClassificationOptionsResult {
  options: QualityClassificationOption[];
  loading: boolean;
  error: Error | null;
}

export function useQualityClassificationOptions(): UseQualityClassificationOptionsResult {
  const [options, setOptions] = useState<QualityClassificationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isActive = true;

    const fetchOptions = async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("gemstones")
        .select("quality_classification")
        .not("quality_classification", "is", null)
        .neq("quality_classification", "");

      if (!isActive) return;

      if (fetchError) {
        setError(
          new Error(
            fetchError.message ||
              "Failed to fetch quality classification options"
          )
        );
        setLoading(false);
        return;
      }

      const counts = new Map<string, number>();
      (data || []).forEach((row) => {
        const value = row.quality_classification;
        if (!value) return;
        counts.set(value, (counts.get(value) || 0) + 1);
      });

      const nextOptions = Array.from(counts.entries())
        .map(([value, count]) => ({
          value,
          label: value,
          count,
        }))
        .sort((a, b) => b.count - a.count);

      setOptions(nextOptions);
      setLoading(false);
    };

    fetchOptions();

    return () => {
      isActive = false;
    };
  }, []);

  return { options, loading, error };
}
