"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@neup/core/utils";
import { Button } from "@neup/components/ui/button";
import { Input } from "@neup/components/ui/input";

type DateMode = "hidden" | "today" | "yesterday" | "tomorrow" | "custom";

export interface DateChoiceInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function getLocalDateString(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function isDateMatch(value: string, offsetDays: number) {
  return value === getLocalDateString(offsetDays);
}

export function DateChoiceInput({ value, onChange, className }: DateChoiceInputProps) {
  const [mode, setMode] = React.useState<DateMode>("hidden");

  React.useEffect(() => {
    if (!value) {
      setMode("hidden");
      return;
    }

    if (isDateMatch(value, 0)) {
      setMode("today");
      return;
    }

    if (isDateMatch(value, -1)) {
      setMode("yesterday");
      return;
    }

    if (isDateMatch(value, 1)) {
      setMode("tomorrow");
      return;
    }

    setMode("custom");
  }, [value]);

  const close = React.useCallback(() => {
    setMode("hidden");
    onChange("");
  }, [onChange]);

  const selectPreset = React.useCallback(
    (nextMode: Exclude<DateMode, "hidden" | "custom">) => {
      const nextValue =
        nextMode === "today"
          ? getLocalDateString(0)
          : nextMode === "yesterday"
            ? getLocalDateString(-1)
            : getLocalDateString(1);

      if (mode === nextMode && value === nextValue) {
        close();
        return;
      }

      setMode(nextMode);
      onChange(nextValue);
    },
    [close, mode, onChange, value]
  );

  const showOptions = mode !== "hidden";

  return (
    <div className={cn("space-y-2", className)}>
      {!showOptions ? (
        <Button type="button" variant="outlined" className="w-fit gap-2" onClick={() => setMode("custom")}>
          <Check className="h-4 w-4" />
          Not today
        </Button>
      ) : null}

      {showOptions ? (
        <div className="space-y-2 rounded-md border bg-background p-3">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={mode === "today" ? "tinted" : "outlined"}
              size="sm"
              onClick={() => selectPreset("today")}
            >
              Today
            </Button>
            <Button
              type="button"
              variant={mode === "yesterday" ? "tinted" : "outlined"}
              size="sm"
              onClick={() => selectPreset("yesterday")}
            >
              Yesterday
            </Button>
            <Button
              type="button"
              variant={mode === "tomorrow" ? "tinted" : "outlined"}
              size="sm"
              onClick={() => selectPreset("tomorrow")}
            >
              Tomorrow
            </Button>
            <Button
              type="button"
              variant={mode === "custom" ? "tinted" : "outlined"}
              size="sm"
              onClick={() => {
                setMode("custom");
              }}
            >
              Custom
            </Button>
          </div>

          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              {mode === "today"
                ? `Selected: Today (${value || getLocalDateString(0)})`
                : mode === "yesterday"
                  ? `Selected: Yesterday (${value || getLocalDateString(-1)})`
                  : mode === "tomorrow"
                    ? `Selected: Tomorrow (${value || getLocalDateString(1)})`
                    : "Selected: custom date"}
            </div>

            {mode === "custom" ? (
              <Input
                type="date"
                value={value}
                onChange={(event) => onChange(event.target.value)}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
