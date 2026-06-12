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
  const [connectionId, setConnectionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectionId.trim() || !user) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Connection ID is required.",
        });
        return;
    }
    
    setIsLoading(true);

    try {
        await upsertUserProfile(user.uid, {
          connection_id: connectionId.trim(),
        });

        // Set the connection_id in a cookie to manage session
        setCookie('connection_id', connectionId.trim(), 7);

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
          <CardTitle>Connection Setup</CardTitle>
          <CardDescription>Enter your connection ID to continue.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="connectionId">Connection ID</Label>
                <Input
                    id="connectionId"
                    placeholder="e.g., conn_12345"
                    value={connectionId}
                    onChange={(e) => setConnectionId(e.target.value)}
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
