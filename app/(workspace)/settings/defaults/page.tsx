
'use client';

import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@neup/components/ui/card';
import { Label } from '@neup/components/ui/label';
import { Button } from '@neup/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { useToast } from '@neup/components/ui/toast';
import { currencyOptions, transactionTypeOptions } from '@/core/lib/ledger';

export default function DefaultsSettingsPage() {
    const { toast } = useToast();
    const [defaultCurrency, setDefaultCurrency] = useState('USD');
    const [defaultTransactionType, setDefaultTransactionType] = useState('purchase');

    const handleSaveChanges = () => {
        // In a real app, you would save these to user preferences (e.g., localStorage or a database)
        console.log('Saving default settings:', { defaultCurrency, defaultTransactionType });
        toast({
            name: 'app',
            title: 'Settings Saved',
            description: 'Your default settings have been updated.',
        });
    };

  return (

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Defaults</CardTitle>
            <CardDescription>
              Set default values for new entries to speed up your workflow.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="defaultCurrency">Default Currency</Label>
                <Combobox
                    options={currencyOptions}
                    value={defaultCurrency}
                    onChange={setDefaultCurrency}
                    placeholder="Select a default currency..."
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="defaultTransactionType">Default Transaction Type</Label>
                <Combobox
                    options={transactionTypeOptions}
                    value={defaultTransactionType}
                    onChange={(v) => setDefaultTransactionType(v)}
                    placeholder="Select a default type..."
                />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button onClick={handleSaveChanges}>Save Changes</Button>
          </CardFooter>
        </Card>
      </div>

  );
}
