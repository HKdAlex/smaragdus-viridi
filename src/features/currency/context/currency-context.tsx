"use client";

import type { CurrencyCode } from "@/shared/types";
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { PreferencesService } from "@/features/cart/services/preferences-service";
import { Logger } from "@/shared/utils/logger";

const logger = new Logger("CurrencyContext");

interface CurrencyContextType {
  selectedCurrency: CurrencyCode;
  changeCurrency: (currency: CurrencyCode) => Promise<void>;
  convertPrice: (amount: number, fromCurrency?: CurrencyCode) => number;
  formatPrice: (amount: number, currency?: CurrencyCode) => string;
  isLoading: boolean;
  rates: Record<CurrencyCode, number>;
  refreshRates: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined
);

interface CurrencyProviderProps {
  children: ReactNode;
  userId?: string;
  defaultCurrency?: CurrencyCode;
}

export function CurrencyProvider({
  children,
  userId,
  defaultCurrency = "USD",
}: CurrencyProviderProps) {
  const [selectedCurrency, setSelectedCurrency] =
    useState<CurrencyCode>(defaultCurrency);
  const [isLoading, setIsLoading] = useState(true);
  const [rates, setRates] = useState<Record<CurrencyCode, number>>({
    USD: 1,
    EUR: 0.95,
    RUB: 92.7,
    KZT: 463.5,
    GBP: 0.79,
    CHF: 0.88,
    JPY: 150,
  });

  const preferencesService = useMemo(
    () => new PreferencesService(),
    []
  );

  // Load user's preferred currency and exchange rates
  useEffect(() => {
    const loadCurrency = async () => {
      setIsLoading(true);
      try {
        // Load user's preferred currency if logged in
        if (userId) {
          const preferences = await preferencesService.getUserPreferences(
            userId
          );
          if (preferences?.preferred_currency) {
            setSelectedCurrency(preferences.preferred_currency);
            logger.info("Loaded user currency preference", {
              currency: preferences.preferred_currency,
            });
          }
        } else {
          // Try to load from localStorage for guest users
          const savedCurrency = localStorage.getItem("preferred_currency");
          if (
            savedCurrency &&
            ["USD", "EUR", "RUB", "KZT"].includes(savedCurrency)
          ) {
            setSelectedCurrency(savedCurrency as CurrencyCode);
          }
        }

        // Load exchange rates
        await refreshRates();
      } catch (error) {
        logger.error("Failed to load currency", error as Error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCurrency();
  }, [userId, preferencesService]);

  // Refresh exchange rates from API
  const refreshRates = useCallback(async () => {
    try {
      const response = await fetch("/api/currency/rates");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.rates) {
          // Update rates, keeping USD at 1
          setRates((prev) => ({
            ...prev,
            EUR: data.rates.EUR || prev.EUR,
            RUB: data.rates.RUB || prev.RUB,
            KZT: data.rates.KZT || prev.KZT,
          }));
          logger.info("Refreshed exchange rates", { rates: data.rates });
        }
      }
    } catch (error) {
      logger.error("Failed to refresh rates", error as Error);
      // Keep existing rates on error
    }
  }, []);

  // Change currency and save preference
  const changeCurrency = useCallback(
    async (currency: CurrencyCode) => {
      setSelectedCurrency(currency);

      // Save to localStorage for guest users
      localStorage.setItem("preferred_currency", currency);

      // Save to user preferences if logged in
      if (userId) {
        try {
          await preferencesService.updateCurrency(userId, currency);
          logger.info("Updated user currency preference", { currency, userId });
        } catch (error) {
          logger.error("Failed to save currency preference", error as Error, {
            currency,
            userId,
          });
        }
      }
    },
    [userId, preferencesService]
  );

  // Convert price from one currency to another
  // IMPORTANT: amount is in CENTS, exchange rates are per DOLLAR
  // So we need to: convert cents -> dollars -> convert -> cents
  const convertPrice = useCallback(
    (amount: number, fromCurrency: CurrencyCode = "USD"): number => {
      // If same currency, no conversion needed
      if (fromCurrency === selectedCurrency) {
        return amount;
      }

      // Convert cents to dollars, apply exchange rate, convert back to cents
      // Exchange rates are per dollar, so we divide by 100 first, multiply by rate, then multiply by 100
      // This is equivalent to: amount * rate, but we're being explicit about the conversion
      
      // If converting from USD (base currency)
      if (fromCurrency === "USD") {
        const rate = rates[selectedCurrency] || 1;
        // amount is in cents, rate is per dollar
        // Convert: (amount / 100) * rate * 100 = amount * rate
        return Math.round(amount * rate);
      }

      // If converting from another currency to USD first, then to target
      // This shouldn't happen in our use case (all prices are in USD)
      // But handle it for completeness
      const fromRate = rates[fromCurrency] || 1;
      const toRate = rates[selectedCurrency] || 1;
      // Convert from source currency cents to USD cents, then to target currency cents
      // amount is in cents of fromCurrency
      // Convert to USD cents: (amount / fromRate)
      // Convert to target currency cents: (amount / fromRate) * toRate
      const usdAmount = amount / fromRate;
      return Math.round(usdAmount * toRate);
    },
    [selectedCurrency, rates]
  );

  // Format price with proper locale
  // currency parameter is the SOURCE currency (what currency the amount is stored in)
  // The result will be formatted in selectedCurrency
  // IMPORTANT: amount MUST be in CENTS (smallest currency unit)
  const formatPrice = useCallback(
    (amount: number, currency?: CurrencyCode): string => {
      // Convert from source currency (or USD if not provided) to selected currency
      const sourceCurrency = currency || "USD";
      
      // convertPrice expects and returns amounts in CENTS
      const convertedAmount = convertPrice(amount, sourceCurrency);

      // Determine locale based on selected currency (target currency)
      let locale = "en-US";
      if (selectedCurrency === "KZT") {
        locale = "kk-KZ"; // Kazakh locale
      } else if (selectedCurrency === "RUB") {
        locale = "ru-RU"; // Russian locale
      } else if (selectedCurrency === "EUR") {
        locale = "en-US"; // Can use en-US or specific EU locale
      }

      // convertedAmount is in CENTS, so divide by 100 to get the base unit (dollars, euros, etc.)
      const amountInBaseUnit = convertedAmount / 100;
      
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: selectedCurrency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amountInBaseUnit);
    },
    [selectedCurrency, convertPrice]
  );

  const value: CurrencyContextType = useMemo(
    () => ({
      selectedCurrency,
      changeCurrency,
      convertPrice,
      formatPrice,
      isLoading,
      rates,
      refreshRates,
    }),
    [
      selectedCurrency,
      changeCurrency,
      convertPrice,
      formatPrice,
      isLoading,
      rates,
      refreshRates,
    ]
  );

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextType {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}

