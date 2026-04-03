import Link from 'next/link';
import { AlertTriangle, Home, ReceiptText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <AlertTriangle className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle className="text-3xl tracking-tight">404 - Page not found</CardTitle>
          <CardDescription className="text-base">
            This page does not exist or may have been moved.
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center text-sm text-muted-foreground">
          Check the URL, or use one of the shortcuts below to continue.
        </CardContent>

        <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go to dashboard
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/transactions">
              <ReceiptText className="mr-2 h-4 w-4" />
              View transactions
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
