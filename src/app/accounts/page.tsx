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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { PlusCircle } from 'lucide-react';

type Account = {
    name: string;
    type: 'Bank' | 'Cash' | 'Investment' | 'Other';
    balance: number;
};

const initialAccounts: Account[] = [
    { name: 'Checking Account', type: 'Bank', balance: 12500.75 },
    { name: 'Savings Account', type: 'Bank', balance: 42000.00 },
    { name: 'Wallet', type: 'Cash', balance: 350.50 },
];

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<'Bank' | 'Cash' | 'Investment' | 'Other' | ''>('');

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (accountName && accountType) {
      const newAccount: Account = {
        name: accountName,
        type: accountType as 'Bank' | 'Cash' | 'Investment' | 'Other',
        balance: 0, // Initial balance is 0
      };
      setAccounts([...accounts, newAccount]);
      setAccountName('');
      setAccountType('');
    }
  };

  return (
    <AppShell>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
             <Card>
                <CardHeader>
                    <CardTitle>Accounts</CardTitle>
                    <CardDescription>
                    A list of all your financial accounts.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Account Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {accounts.map((account, index) => (
                        <TableRow key={index}>
                            <TableCell className="font-medium">{account.name}</TableCell>
                            <TableCell>{account.type}</TableCell>
                            <TableCell className="text-right">
                            ${account.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
        <div>
          <Card>
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
