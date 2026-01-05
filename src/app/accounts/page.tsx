'use client';

import { useState, useMemo } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusCircle, Landmark, Wallet, Activity, MoreVertical, Loader } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink } from '@/components/ui/pagination';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

type Account = {
    id?: string;
    name: string;
    type: 'Bank' | 'Cash' | 'Investment' | 'Other';
    balance: number;
    currency: string;
    userId: string;
};

const accountTypeIcons = {
  Bank: <Landmark className="h-5 w-5 text-muted-foreground" />,
  Cash: <Wallet className="h-5 w-5 text-muted-foreground" />,
  Investment: <Activity className="h-5 w-5 text-muted-foreground" />,
  Other: <Activity className="h-5 w-5 text-muted-foreground" />,
};

const ITEMS_PER_PAGE = 10;

export default function AccountsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const accountsCollection = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, 'users', user.uid, 'accounts');
  }, [firestore, user?.uid]);

  const { data: accounts, isLoading: areAccountsLoading } = useCollection<Account>(accountsCollection);

  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<'Bank' | 'Cash' | 'Investment' | 'Other' | ''>('');
  const [currency, setCurrency] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil((accounts?.length || 0) / ITEMS_PER_PAGE);
  const paginatedAccounts = accounts?.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
  ) || [];

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName || !accountType || !currency || !user || !firestore) return;
    
    setIsSubmitting(true);

    try {
      const newAccount: Account = {
        name: accountName,
        type: accountType as 'Bank' | 'Cash' | 'Investment' | 'Other',
        balance: 0,
        currency: currency,
        userId: user.uid,
      };

      if (!accountsCollection) throw new Error("Accounts collection not available");

      await addDoc(accountsCollection, newAccount);
      
      toast({
        title: "Account Created",
        description: `Your ${accountName} account has been created.`
      })

      setAccountName('');
      setAccountType('');
      setCurrency('');
      setIsDialogOpen(false);
    } catch (error) {
        console.error("Error creating account:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not create account. Please try again."
        })
    } finally {
        setIsSubmitting(false);
    }
  };

  const isLoading = isUserLoading || areAccountsLoading;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Your Accounts</h1>
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button disabled={isLoading}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Account
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                    <DialogTitle>Create New Account</DialogTitle>
                    <DialogDescription>
                        Add a new cash, bank, or investment account.
                    </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddAccount} className="space-y-4 py-4">
                        <div className="space-y-2">
                        <Label htmlFor="accountName">Account Name</Label>
                        <Input
                            id="accountName"
                            value={accountName}
                            onChange={(e) => setAccountName(e.target.value)}
                            placeholder="e.g., My Savings"
                            required
                        />
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="accountType">Account Type</Label>
                        <Select onValueChange={(value) => setAccountType(value as any)} value={accountType} required>
                            <SelectTrigger id="accountType">
                            <SelectValue placeholder="Select a type" />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectItem value="Bank">Bank</SelectItem>
                            <SelectItem value="Cash">Cash</SelectItem>
                            <SelectItem value="Investment">Investment</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="currency">Currency</Label>
                        <Select onValueChange={setCurrency} value={currency} required>
                            <SelectTrigger id="currency">
                            <SelectValue placeholder="Select a currency" />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectItem value="USD">USD - US Dollar</SelectItem>
                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                            <SelectItem value="GBP">GBP - British Pound</SelectItem>
                            <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                            <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                            <SelectItem value="NPR">NPR - Nepali Rupee</SelectItem>
                            </SelectContent>
                        </Select>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                                Add Account
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
         <div className="mx-auto max-w-4xl space-y-4">
            {isLoading ? (
                 <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <Loader className="mr-3 h-6 w-6 animate-spin" />
                    <p>Loading your accounts...</p>
                </div>
            ) : paginatedAccounts.length > 0 ? paginatedAccounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-full bg-muted">
                            {accountTypeIcons[account.type]}
                        </div>
                        <div>
                            <p className="font-semibold">{account.name}</p>
                            <p className="text-sm text-muted-foreground">{account.type} Account</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                             <p className="font-semibold text-lg">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: account.currency, minimumFractionDigits: 2 }).format(account.balance)}
                            </p>
                            <p className="text-sm text-muted-foreground">Current Balance</p>
                        </div>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            )) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No accounts found. Create your first one!</p>
              </div>
            )}
        </div>
        {totalPages > 1 && (
            <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)}
                         className={cn({
                            'cursor-not-allowed text-muted-foreground': currentPage === 1,
                        })}
                        />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <PaginationItem key={page}>
                            <PaginationLink onClick={() => handlePageChange(page)} isActive={currentPage === page}>{page}</PaginationLink>
                        </PaginationItem>
                    ))}
                    <PaginationItem>
                        <PaginationNext onClick={() => handlePageChange(currentPage + 1)} 
                            className={cn({
                                'cursor-not-allowed text-muted-foreground': currentPage === totalPages,
                            })}
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        )}
      </div>
    </AppShell>
  );
}
