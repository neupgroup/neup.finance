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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/icons';
import { ArrowRight, Loader } from 'lucide-react';
import { useUser } from '@/auth/provider';
import { upsertUserProfile } from '@/hooks/api';
import { useToast } from '@/hooks/use-toast';

// A simple utility to set a cookie
function setCookie(name: string, value: string, days: number) {
  let expires = "";
  if (days) {
    let date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

export default function AuthPage() {
  const [displayName, setDisplayName] = useState('');
  const [accountId, setAccountId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !accountId.trim() || !user) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Display name and account name are required.",
        });
        return;
    }
    
    setIsLoading(true);

    try {
        await upsertUserProfile(user.uid, {
          displayName: displayName.trim(),
          accountId: accountId.trim(),
          email: user.email ?? undefined
        });

        // Set the accountId in a cookie to manage session
        setCookie('accountId', accountId.trim(), 7);

        // The onAuthStateChanged listener in FirebaseProvider will handle the redirect
        router.push('/');

    } catch (error) {
        console.error("Error creating user profile:", error);
        toast({
            variant: "destructive",
            title: "Profile Creation Failed",
            description: "Could not save your profile. Please try again.",
        });
        setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <Logo className="h-12 w-12 mb-2" />
          <CardTitle>Create Your Profile</CardTitle>
          <CardDescription>Choose a display name and account name to get started.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="displayName">Your Display Name</Label>
                <Input
                    id="displayName"
                    placeholder="e.g., Jane Doe"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="accountId">Account Name</Label>
                <Input
                    id="accountId"
                    placeholder="e.g., Personal Finances or Acme Inc."
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    required
                />
            </div>
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
