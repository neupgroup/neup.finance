'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@neup/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@neup/components/ui/card';
import { Logo } from '@/components/icons';
import { ArrowRight, Loader } from 'lucide-react';
import { useUser, useAuthActions } from '@/core/providers/auth';

export default function OnboardingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { signInAnonymous } = useAuthActions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
        if (!user) signInAnonymous();
        // After sign-in, the onAuthStateChanged listener in the provider will update the user state,
        // and we can then navigate to the auth page to complete the profile.
        router.push('/auth');
    } catch (error) {
        console.error("Anonymous sign-in failed", error);
        setIsLoading(false);
    }
  };

  // While checking for the user, show a loading state on the button
  // but render the page structure.
  const pageIsLoading = isUserLoading || isLoading;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <Logo className="h-12 w-12 mb-2" />
          <CardTitle>Welcome to Neup.Ledger</CardTitle>
          <CardDescription>Let's get your account set up.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="text-center text-muted-foreground">
            <p>Click continue to create your profile.</p>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={pageIsLoading}>
                {pageIsLoading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                Continue
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
