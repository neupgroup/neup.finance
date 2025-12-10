'use server';

/**
 * @fileOverview Parses natural language text to create a structured transaction object.
 *
 * - createTransactionFromText - A function that creates a transaction from text.
 * - CreateTransactionFromTextInput - The input type for the function.
 * - CreateTransactionFromTextOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { TransactionCategory, TransactionStatus, TransactionType } from '@/lib/mock-data';

const CreateTransactionFromTextInputSchema = z.object({
  text: z.string().describe('The natural language text describing a financial transaction.'),
});
export type CreateTransactionFromTextInput = z.infer<typeof CreateTransactionFromTextInputSchema>;

const CreateTransactionFromTextOutputSchema = z.object({
    title: z.string().describe('A concise title for the transaction.'),
    description: z.string().optional().describe('A brief description of the transaction if details are available.'),
    recipient: z.string().optional().describe('The person or organization receiving the payment or from whom payment is received.'),
    total_amount: z.number().describe('The total monetary value of the transaction.'),
    currency: z.string().length(3).describe('The ISO 4217 currency code (e.g., USD, EUR).'),
    transaction_type: z.nativeEnum(TransactionType).describe('The type of transaction, like "purchase", "sale", "income", or "expense".'),
    category: z.nativeEnum(TransactionCategory).optional().describe('The financial category of the transaction.'),
    status: z.nativeEnum(TransactionStatus).optional().describe('The payment status of the transaction.'),
    date: z.string().describe("The date of the transaction in YYYY-MM-DD format. Default to today's date if not specified."),
    due_on: z.string().optional().describe("The date the transaction is due, in YYYY-MM-DD format."),
    total_paid: z.number().optional().describe("The amount that has been paid."),
    vat_amount: z.number().optional().describe('The amount of Value Added Tax (VAT), if mentioned.'),
    tax_amount: z.number().optional().describe('Any other tax amount, if mentioned.'),
});
export type CreateTransactionFromTextOutput = z.infer<typeof CreateTransactionFromTextOutputSchema>;


export async function createTransactionFromText(input: CreateTransactionFromTextInput): Promise<CreateTransactionFromTextOutput> {
  return createTransactionFromTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'createTransactionFromTextPrompt',
  input: { schema: CreateTransactionFromTextInputSchema },
  output: { schema: CreateTransactionFromTextOutputSchema },
  prompt: `You are an expert financial assistant. Analyze the following text and extract the details to create a structured transaction object.
  The current date is ${new Date().toISOString().split('T')[0]}. If a date is not specified, use today's date.
  Infer the transaction type (e.g., purchase, income, expense). For example, "paid", "bought", "spent" implies a 'purchase' or 'expense'. "Received", "earned", "salary" implies 'income' or 'sale'.

Text: {{{text}}}

Extract the information into the specified JSON format.
`,
});

const createTransactionFromTextFlow = ai.defineFlow(
  {
    name: 'createTransactionFromTextFlow',
    inputSchema: CreateTransactionFromTextInputSchema,
    outputSchema: CreateTransactionFromTextOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
