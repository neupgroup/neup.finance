"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Command as CommandPrimitive } from "cmdk"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "./input"

type ComboboxProps = {
    options: { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    notFoundMessage?: string;
}

export function Combobox({ options, value, onChange, placeholder, searchPlaceholder, notFoundMessage }: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(value ? options.find((option) => option.value.toLowerCase() === value.toLowerCase())?.label : "")

  React.useEffect(() => {
    if (value) {
      const selectedOption = options.find((option) => option.value.toLowerCase() === value.toLowerCase());
      setInputValue(selectedOption ? selectedOption.label : "");
    } else {
      setInputValue("");
    }
  }, [value, options]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Command>
        <div className="relative">
            <CommandPrimitive.Input asChild>
                <Input
                    value={inputValue}
                    onValueChange={setInputValue}
                    onFocus={() => setOpen(true)}
                    placeholder={placeholder}
                    className="pr-10"
                />
            </CommandPrimitive.Input>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full w-10 text-muted-foreground"
                    onClick={() => setOpen((o) => !o)}
                >
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
        </div>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
            <CommandList>
                <CommandInput placeholder={searchPlaceholder || "Search..."} className="hidden" />
                <CommandEmpty>{notFoundMessage || "No option found."}</CommandEmpty>
                <CommandGroup>
                {options.map((option) => (
                    <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={(currentValue) => {
                        onChange(currentValue === value ? "" : currentValue)
                        setOpen(false)
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
        </PopoverContent>
      </Command>
    </Popover>
  )
}
