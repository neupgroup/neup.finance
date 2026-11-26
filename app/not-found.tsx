import { AlertTriangle, Home, ReceiptText } from 'lucide-react';
import { LinkButton } from '@neup/components/ui/link-button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@neup/components/ui/card';

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-9rem)] items-center justify-center px-4 py-12">
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
          <LinkButton href="/" preIcon={<Home className="mr-2 h-4 w-4" />}>Go to dashboard</LinkButton>
          <LinkButton href="/transactions" variant="outline" preIcon={<ReceiptText className="mr-2 h-4 w-4" />}>View transactions</LinkButton>
        </CardFooter>
      </Card>
    </div>
  );
}
