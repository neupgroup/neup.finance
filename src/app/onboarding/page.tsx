'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Logo } from '@/components/icons';
import { ArrowRight } from 'lucide-react';

export default function OnboardingPage() {
  const [accountType, setAccountType] = useState('individual');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically save the user's choice
    console.log('Account type selected:', accountType);
    router.push('/');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <Logo className="h-12 w-12 mb-2" />
          <CardTitle>Welcome to NeupLedger</CardTitle>
          <CardDescription>Let's get your account set up. Tell us a bit about yourself.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <RadioGroup
              value={accountType}
              onValueChange={setAccountType}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem value="individual" id="individual" className="peer sr-only" />
                <Label
                  htmlFor="individual"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  Individual
                  <span className="text-xs text-muted-foreground mt-1">For personal finance.</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="business" id="business" className="peer sr-only" />
                <Label
                  htmlFor="business"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  Business
                  <span className="text-xs text-muted-foreground mt-1">For your company.</span>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
