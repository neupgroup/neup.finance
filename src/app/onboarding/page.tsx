'use client';

import { useState, useEffect } from 'react';
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
import { ArrowRight, Loader } from 'lucide-react';
import { useAuth, useUser } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';

function setCookie(name: string, value: string, days: number) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

export default function OnboardingPage() {
  const [accountType, setAccountType] = useState('individual');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && user) {
        router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setCookie('account_type', accountType, 7);

    try {
        if (!user) {
            await signInAnonymously(auth);
        }
        router.push('/auth');
    } catch (error) {
        console.error("Anonymous sign-in failed", error);
        setIsLoading(false);
    }
  };

  if (isUserLoading || user) {
      return (
          <div className="flex min-h-screen items-center justify-center">
              <Loader className="h-8 w-8 animate-spin" />
          </div>
      )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <Logo className="h-12 w-12 mb-2" />
          <CardTitle>Welcome to Neup.Ledger</CardTitle>
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
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                Continue
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
