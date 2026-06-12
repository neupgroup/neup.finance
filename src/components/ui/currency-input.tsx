"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type CurrencyCountry = {
  aliases: string[];
  code: string;
  country: string;
  flag: string;
};

const CURRENCY_COUNTRIES: CurrencyCountry[] = [
  { country: "United States", code: "USD", flag: "🇺🇸", aliases: ["united states", "usa", "us", "america"] },
  { country: "Canada", code: "CAD", flag: "🇨🇦", aliases: ["canada", "ca"] },
  { country: "Mexico", code: "MXN", flag: "🇲🇽", aliases: ["mexico", "mx"] },
  { country: "Brazil", code: "BRL", flag: "🇧🇷", aliases: ["brazil", "br"] },
  { country: "United Kingdom", code: "GBP", flag: "🇬🇧", aliases: ["united kingdom", "uk", "great britain", "britain", "gb"] },
  { country: "European Union", code: "EUR", flag: "🇪🇺", aliases: ["european union", "eurozone", "eu", "eur"] },
  { country: "France", code: "EUR", flag: "🇫🇷", aliases: ["france", "fr"] },
  { country: "Germany", code: "EUR", flag: "🇩🇪", aliases: ["germany", "de"] },
  { country: "Spain", code: "EUR", flag: "🇪🇸", aliases: ["spain", "es"] },
  { country: "Italy", code: "EUR", flag: "🇮🇹", aliases: ["italy", "it"] },
  { country: "Netherlands", code: "EUR", flag: "🇳🇱", aliases: ["netherlands", "nl", "holland"] },
  { country: "Portugal", code: "EUR", flag: "🇵🇹", aliases: ["portugal", "pt"] },
  { country: "Austria", code: "EUR", flag: "🇦🇹", aliases: ["austria", "at"] },
  { country: "Belgium", code: "EUR", flag: "🇧🇪", aliases: ["belgium", "be"] },
  { country: "Finland", code: "EUR", flag: "🇫🇮", aliases: ["finland", "fi"] },
  { country: "Ireland", code: "EUR", flag: "🇮🇪", aliases: ["ireland", "ie"] },
  { country: "India", code: "INR", flag: "🇮🇳", aliases: ["india", "in", "bharat"] },
  { country: "Nepal", code: "NPR", flag: "🇳🇵", aliases: ["nepal", "np", "nepali"] },
  { country: "Japan", code: "JPY", flag: "🇯🇵", aliases: ["japan", "jp"] },
  { country: "China", code: "CNY", flag: "🇨🇳", aliases: ["china", "cn"] },
  { country: "South Korea", code: "KRW", flag: "🇰🇷", aliases: ["south korea", "korea", "kr"] },
  { country: "Australia", code: "AUD", flag: "🇦🇺", aliases: ["australia", "au"] },
  { country: "New Zealand", code: "NZD", flag: "🇳🇿", aliases: ["new zealand", "nz"] },
  { country: "Singapore", code: "SGD", flag: "🇸🇬", aliases: ["singapore", "sg"] },
  { country: "Pakistan", code: "PKR", flag: "🇵🇰", aliases: ["pakistan", "pk"] },
  { country: "Bangladesh", code: "BDT", flag: "🇧🇩", aliases: ["bangladesh", "bd"] },
  { country: "Sri Lanka", code: "LKR", flag: "🇱🇰", aliases: ["sri lanka", "lk"] },
  { country: "Thailand", code: "THB", flag: "🇹🇭", aliases: ["thailand", "th"] },
  { country: "Vietnam", code: "VND", flag: "🇻🇳", aliases: ["vietnam", "vn"] },
  { country: "United Arab Emirates", code: "AED", flag: "🇦🇪", aliases: ["uae", "united arab emirates", "ae"] },
  { country: "Saudi Arabia", code: "SAR", flag: "🇸🇦", aliases: ["saudi arabia", "ksa", "sa"] },
  { country: "South Africa", code: "ZAR", flag: "🇿🇦", aliases: ["south africa", "za"] },
  { country: "Switzerland", code: "CHF", flag: "🇨🇭", aliases: ["switzerland", "ch"] },
];

const NORMALIZED_CURRENCIES = CURRENCY_COUNTRIES.map((entry) => ({
  ...entry,
  aliases: Array.from(new Set([entry.country, entry.code, ...entry.aliases].map((alias) => normalizeLookup(alias)))),
}));

function normalizeLookup(value: string) {
  return value.trim().toLowerCase().replace(/[\s._-]+/g, " ");
}

function findCurrencyByCountryName(value: string) {
  const normalized = normalizeLookup(value);
  if (!normalized) {
    return null;
  }

  return NORMALIZED_CURRENCIES.find((entry) => entry.aliases.includes(normalized)) ?? null;
}

function findCurrencyByCode(code: string) {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return null;
  }

  return CURRENCY_COUNTRIES.find((entry) => entry.code === normalized) ?? null;
}

export interface CurrencyInputProps extends Omit<React.ComponentProps<"input">, "value" | "onChange"> {
  onChange?: (value: string) => void;
  value?: string;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onChange, placeholder, ...props }, ref) => {
    const [searchValue, setSearchValue] = React.useState("");
    const [selectedCountry, setSelectedCountry] = React.useState<CurrencyCountry | null>(() => findCurrencyByCode(value ?? "") ?? null);
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const suppressEmptySyncRef = React.useRef(false);

    React.useEffect(() => {
      if (!value) {
        if (suppressEmptySyncRef.current) {
          suppressEmptySyncRef.current = false;
          return;
        }

        setSelectedCountry(null);
        setSearchValue("");
        return;
      }

      const nextSelected = findCurrencyByCode(value);
      if (nextSelected && nextSelected.code !== selectedCountry?.code) {
        setSelectedCountry(nextSelected);
        setSearchValue("");
      }
    }, [selectedCountry?.code, value]);

    const commitSelection = React.useCallback(
      (entry: CurrencyCountry) => {
        setSelectedCountry(entry);
        setSearchValue("");
        onChange?.(entry.code);
      },
      [onChange]
    );

    const clearSelection = React.useCallback(() => {
      setSelectedCountry(null);
      setSearchValue("");
      onChange?.("");
      inputRef.current?.focus();
    }, [onChange]);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.target.value;

      if (selectedCountry) {
        suppressEmptySyncRef.current = true;
        setSelectedCountry(null);
        onChange?.("");
      }

      setSearchValue(nextValue);

      if (!nextValue.endsWith(" ")) {
        return;
      }

      const matched = findCurrencyByCountryName(nextValue);
      if (matched) {
        commitSelection(matched);
      }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (selectedCountry && !searchValue && event.key === "Backspace") {
        event.preventDefault();
        suppressEmptySyncRef.current = true;
        clearSelection();
        return;
      }

      if (!selectedCountry && event.key === " ") {
        const matched = findCurrencyByCountryName(searchValue);
        if (matched) {
          event.preventDefault();
          commitSelection(matched);
        }
      }

      props.onKeyDown?.(event);
    };

    const activeValue = selectedCountry ? "" : searchValue;
    const resolvedPlaceholder = selectedCountry
      ? "Change country"
      : placeholder ?? "Type a country name, then press space";

    return (
      <div className="space-y-1.5">
        <div
          className={cn(
            "flex min-h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
            className
          )}
        >
          {selectedCountry ? (
            <span
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground"
              title={selectedCountry.country}
            >
              <span aria-hidden="true">{selectedCountry.flag}</span>
              <span>{selectedCountry.code}</span>
            </span>
          ) : null}

          <input
            {...props}
            ref={(node) => {
              inputRef.current = node;
              if (typeof ref === "function") {
                ref(node);
              } else if (ref) {
                (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
              }
            }}
            value={activeValue}
            placeholder={resolvedPlaceholder}
            className="h-6 w-full border-0 bg-transparent p-0 text-sm outline-none placeholder:text-muted-foreground focus-visible:outline-none"
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
