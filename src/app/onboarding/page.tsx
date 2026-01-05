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
import { Logo } from '@/components/icons';
import { ArrowRight, Loader } from 'lucide-react';
import { useAuth, useUser } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';

export default function OnboardingPage() {
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
          <CardDescription>Let's get your account set up.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="text-center text-muted-foreground">
            <p>Click continue to create your profile.</p>
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
