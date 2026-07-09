"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/core/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "./input";

type ComboboxProps = {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  notFoundMessage?: string;
  className?: string;
  ariaInvalid?: boolean;
};

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  notFoundMessage = "Nothing found.",
  className,
  ariaInvalid = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const selectedOption = React.useMemo(
    () => options.find((option) => option.value.toLowerCase() === value.toLowerCase()),
    [options, value]
  );

  React.useEffect(() => {
    setInputValue(selectedOption?.label || "");
  }, [selectedOption]);

  React.useEffect(() => {
    if (!open) {
      setInputValue(selectedOption?.label || "");
    }
  }, [open, selectedOption]);

  const handleSelect = (currentValue: string) => {
    const newValue = currentValue === value ? "" : currentValue;
    onChange(newValue);
    setOpen(false);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (!open) {
      setOpen(true);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative w-full">
        <PopoverTrigger asChild>
          <div className="relative w-full">
            <Input
              ref={inputRef}
              value={inputValue}
              onFocus={() => setOpen(true)}
              onChange={handleInputChange}
              role="combobox"
              aria-expanded={open}
              aria-invalid={ariaInvalid}
              placeholder={placeholder}
              className={cn(
                "w-full pr-8",
                !value && "text-muted-foreground",
                ariaInvalid && "border-destructive focus-visible:ring-destructive",
                className
              )}
            />
            <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 shrink-0 opacity-50" />
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
          onOpenAutoFocus={(e) => {
            // Prevent autofocus on the popover content
             e.preventDefault();
          }}
        >
          <Command filter={(value, search) => {
              if (value.toLowerCase().includes(search.toLowerCase())) return 1
              return 0
          }}>
            <CommandInput
              value={inputValue}
              onValueChange={setInputValue}
              placeholder={searchPlaceholder}
              className="h-9"
            />
            <CommandList>
              <CommandEmpty>{notFoundMessage}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => {
                        onChange(option.value);
                        setInputValue(option.label);
                        setOpen(false);
                        inputRef.current?.focus();
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </div>
    </Popover>
  );
}
