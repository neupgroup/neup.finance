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
import { useUser, useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

function getCookie(name: string) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
}


export default function AuthPage() {
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    // If user is already logged in and has a profile, redirect them
    if (user) {
        // We can add a check here later to see if profile exists
        router.push('/');
    }
  }, [user, router]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !user || !firestore) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Display name is required and you must be authenticated.",
        });
        return;
    }
    
    setIsLoading(true);

    try {
        const accountType = getCookie('account_type') || 'individual';
        const userProfileRef = doc(firestore, 'users', user.uid);

        await setDoc(userProfileRef, {
            uid: user.uid,
            displayName: displayName.trim(),
            accountType: accountType,
        });

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
          <CardDescription>Choose a display name to get started.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                    id="displayName"
                    placeholder="e.g., Jane Doe"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
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
