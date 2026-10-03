'use client';

import { useState } from 'react';
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
import { ensureAccount } from '@/core/hooks/api';
import { useToast } from '@neup/components/ui/toast';

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
        await ensureAccount();

        router.push('/');

    } catch (error) {
        console.error("Error creating user profile:", error);
        toast({
            name: 'app',
            state: "error",
            title: "Profile Creation Failed",
            description: error instanceof Error ? error.message : "Could not save your profile. Please try again.",
        });
        setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <Logo className="h-12 w-12 mb-2" />
          <CardTitle>Account Setup</CardTitle>
          <CardDescription>Set up your account and open your project.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent />
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
