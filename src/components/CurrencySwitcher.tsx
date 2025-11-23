"use client";

import { useCurrency } from "@/features/currency/hooks/use-currency";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import type { CurrencyCode } from "@/shared/types";
import { getCurrencySymbol } from "@/shared/utils/currency-utils";
import { ChevronDown } from "lucide-react";

const SUPPORTED_CURRENCIES: CurrencyCode[] = ["USD", "RUB", "EUR", "KZT"];

export function CurrencySwitcher() {
  const { selectedCurrency, changeCurrency, isLoading } = useCurrency();

  const handleCurrencyChange = async (currency: CurrencyCode) => {
    if (currency !== selectedCurrency && !isLoading) {
      await changeCurrency(currency);
    }
  };

  const selectedSymbol = getCurrencySymbol(selectedCurrency);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isLoading}
          className="text-xs min-w-[70px] sm:min-w-[80px] h-9 px-2 sm:px-3 gap-1.5"
          aria-label="Select currency"
        >
          <span className="font-medium">{selectedSymbol}</span>
          <span className="hidden sm:inline text-muted-foreground">
            {selectedCurrency}
          </span>
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[140px]">
        <DropdownMenuRadioGroup
          value={selectedCurrency}
          onValueChange={(value) => handleCurrencyChange(value as CurrencyCode)}
        >
          {SUPPORTED_CURRENCIES.map((currency) => {
            const symbol = getCurrencySymbol(currency);
            return (
              <DropdownMenuRadioItem
                key={currency}
                value={currency}
                className="cursor-pointer"
              >
                <span className="font-medium mr-2">{symbol}</span>
                <span className="text-muted-foreground">{currency}</span>
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

