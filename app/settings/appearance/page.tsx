
'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@neup/components/ui/card';
import { Label } from '@neup/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@neup/components/ui/radio-group';
import { Sun, Moon, Laptop, Layers } from 'lucide-react';
import { SHADOW_LEVEL_STORAGE_KEY, type ShadowLevel } from '@/components/theme-provider';

// Offer light, dark, and system appearances with configurable shadow depth.
export default function AppearanceSettingsPage() {
  const { theme, setTheme } = useTheme();
  const [shadowLevel, setShadowLevel] = useState<ShadowLevel>('medium');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const savedLevel = window.localStorage.getItem(SHADOW_LEVEL_STORAGE_KEY);
    if (savedLevel === 'light' || savedLevel === 'medium' || savedLevel === 'heavy') setShadowLevel(savedLevel);
  }, []);

  const updateShadowLevel = (value: string) => {
    if (value !== 'light' && value !== 'medium' && value !== 'heavy') return;
    setShadowLevel(value);
    window.localStorage.setItem(SHADOW_LEVEL_STORAGE_KEY, value);
    document.documentElement.classList.remove('shadow-level-light', 'shadow-level-medium', 'shadow-level-heavy');
    document.documentElement.classList.add(`shadow-level-${value}`);
  };

  return (

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize the look and feel of your dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <h3 className="font-semibold">Theme</h3>
              {isMounted ? <RadioGroup
                value={theme}
                onValueChange={setTheme}
                className="grid grid-cols-1 gap-4 sm:grid-cols-3"
              >
                <div>
                  <RadioGroupItem
                    value="light"
                    id="light"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="light"
                    className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <Sun className="mb-2 h-5 w-5" />
                    Light
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="dark"
                    id="dark"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="dark"
                    className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <Moon className="mb-2 h-5 w-5" />
                    Dark
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="system"
                    id="system"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="system"
                    className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <Laptop className="mb-2 h-5 w-5" />
                    System
                  </Label>
                </div>
              </RadioGroup> : <div className="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-hidden="true">
                {['Light', 'Dark', 'System'].map((label) => <div key={label} className="h-[74px] rounded-md border-2 border-muted bg-popover p-4" />)}
              </div>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shadows</CardTitle>
            <CardDescription>Choose how pronounced shadows appear throughout the interface.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <h3 className="font-semibold">Shadow level</h3>
              {isMounted ? <RadioGroup
                value={shadowLevel}
                onValueChange={updateShadowLevel}
                className="grid grid-cols-1 gap-4 sm:grid-cols-3"
              >
                {([
                  { value: 'light', label: 'Light', description: 'Subtle separation.' },
                  { value: 'medium', label: 'Medium', description: 'Balanced depth.' },
                  { value: 'heavy', label: 'Heavy', description: 'Strong separation.' },
                ] as const).map((option) => (
                  <div key={option.value}>
                    <RadioGroupItem value={option.value} id={`shadow-${option.value}`} className="peer sr-only" />
                    <Label
                      htmlFor={`shadow-${option.value}`}
                      className="flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 text-center hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary"
                    >
                      <Layers className="mb-2 h-5 w-5" />
                      <span className="font-medium">{option.label}</span>
                      <span className="mt-1 text-sm text-muted-foreground">{option.description}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup> : <div className="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-hidden="true">
                {['Light', 'Medium', 'Heavy'].map((label) => <div key={label} className="h-[92px] rounded-md border-2 border-muted bg-popover p-4" />)}
              </div>}
            </div>
          </CardContent>
        </Card>
      </div>

  );
}
