'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusCircle, Landmark, Wallet, Activity } from 'lucide-react';
import { Logo } from '@/components/icons';

type Account = {
    name: string;
    type: 'Bank' | 'Cash' | 'Investment' | 'Other';
    balance: number;
    currency: string;
};

const initialAccounts: Account[] = [
    { name: 'Checking Account', type: 'Bank', balance: 12500.75, currency: 'USD' },
    { name: 'Savings Account', type: 'Bank', balance: 42000.00, currency: 'USD' },
    { name: 'Wallet', type: 'Cash', balance: 350.50, currency: 'EUR' },
];

const accountTypeIcons = {
  Bank: <Landmark className="h-6 w-6 text-white/70" />,
  Cash: <Wallet className="h-6 w-6 text-white/70" />,
  Investment: <Activity className="h-6 w-6 text-white/70" />,
  Other: <Activity className="h-6 w-6 text-white/70" />,
};


export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<'Bank' | 'Cash' | 'Investment' | 'Other' | ''>('');
  const [currency, setCurrency] = useState('');

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
    }
  };

  const getCardGradient = (index: number) => {
    const gradients = [
      'from-blue-900 to-blue-700',
      'from-slate-800 to-slate-600',
      'from-emerald-800 to-emerald-600',
      'from-indigo-900 to-indigo-700',
    ];
    return gradients[index % gradients.length];
  }

  return (
    <AppShell>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <h1 className="text-3xl font-bold tracking-tight mb-6">Your Accounts</h1>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {accounts.map((account, index) => (
                    <div key={index} className={`relative p-6 rounded-xl shadow-lg text-white bg-gradient-to-br ${getCardGradient(index)}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-sm opacity-70">{account.type} Account</p>
                                <p className="font-semibold text-lg">{account.name}</p>
                            </div>
                            {accountTypeIcons[account.type]}
                        </div>
                        <div className="text-right">
                            <p className="text-sm opacity-70">Balance</p>
                            <p className="text-3xl font-bold tracking-tight">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: account.currency, minimumFractionDigits: 2 }).format(account.balance)}
                            </p>
                        </div>
                        <Logo className="absolute bottom-4 left-4 h-8 w-8 text-white/50" />
                    </div>
                ))}
            </div>
        </div>
        <div>
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Create New Account</CardTitle>
              <CardDescription>
                Add a new cash, bank, or investment account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddAccount} className="space-y-4">
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
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Account
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}