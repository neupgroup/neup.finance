'use client';

import { useState } from 'react';
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
import { PlusCircle, Landmark, Wallet, Activity, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink } from '@/components/ui/pagination';


type Account = {
    name: string;
    type: 'Bank' | 'Cash' | 'Investment' | 'Other';
    balance: number;
    currency: string;
};

const initialAccounts: Account[] = [];

const accountTypeIcons = {
  Bank: <Landmark className="h-5 w-5 text-muted-foreground" />,
  Cash: <Wallet className="h-5 w-5 text-muted-foreground" />,
  Investment: <Activity className="h-5 w-5 text-muted-foreground" />,
  Other: <Activity className="h-5 w-5 text-muted-foreground" />,
};

const ITEMS_PER_PAGE = 10;

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<'Bank' | 'Cash' | 'Investment' | 'Other' | ''>('');
  const [currency, setCurrency] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(accounts.length / ITEMS_PER_PAGE);
  const paginatedAccounts = accounts.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (accountName && accountType && currency) {
      const newAccount: Account = {
        name: accountName,
        type: accountType as 'Bank' | 'Cash' | 'Investment' | 'Other',
        balance: 0, // Initial balance is 0
        currency: currency,
      };
      setAccounts([...accounts, newAccount]);
      setAccountName('');
      setAccountType('');
      setCurrency('');
      setIsDialogOpen(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Your Accounts</h1>
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button>
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
                            <Button type="submit">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Account
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
         <div className="mx-auto max-w-4xl space-y-4">
            {paginatedAccounts.length > 0 ? paginatedAccounts.map((account, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
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
