"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

export interface MiningCountryOption {
  value: string;
  label: string;
  count: number;
}

export interface UseMiningCountryOptionsResult {
  options: MiningCountryOption[];
  loading: boolean;
  error: Error | null;
}

export function useMiningCountryOptions(): UseMiningCountryOptionsResult {
  const [options, setOptions] = useState<MiningCountryOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isActive = true;

    const fetchOptions = async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("gemstones")
        .select("mining_country")
        .not("mining_country", "is", null)
        .neq("mining_country", "");

      if (!isActive) return;

      if (fetchError) {
        setError(
          new Error(
            fetchError.message || "Failed to fetch mining country options"
          )
        );
        setLoading(false);
        return;
      }

      const counts = new Map<string, number>();
      (data || []).forEach((row) => {
        const value = row.mining_country;
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
