'use server';

/**
 * @fileOverview Generates narrative journal entries from a list of transactions.
 *
 * - generateJournalEntries - A function that creates journal entries from transaction data.
 * - GenerateJournalEntriesInput - The input type for the generateJournalEntries function.
 * - GenerateJournalEntriesOutput - The return type for the generateJournalEntries function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateJournalEntriesInputSchema = z.object({
  transactions: z.string().describe('A JSON string of transaction data.'),
});
export type GenerateJournalEntriesInput = z.infer<typeof GenerateJournalEntriesInputSchema>;

const JournalEntrySchema = z.object({
    date: z.string().describe("The date of the journal entry in 'Month Day, YYYY' format."),
    title: z.string().describe('A short, engaging title for the day\'s financial activities.'),
    narrative: z.string().describe('A narrative summary of the financial activities for that day, written in a story-like format.'),
});

const GenerateJournalEntriesOutputSchema = z.object({
  entries: z.array(JournalEntrySchema).describe('An array of generated journal entries, chronologically sorted.'),
});
export type GenerateJournalEntriesOutput = z.infer<typeof GenerateJournalEntriesOutputSchema>;

export async function generateJournalEntries(input: GenerateJournalEntriesInput): Promise<GenerateJournalEntriesOutput> {
  return generateJournalEntriesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateJournalEntriesPrompt',
  input: {schema: GenerateJournalEntriesInputSchema},
  output: {schema: GenerateJournalEntriesOutputSchema},
  prompt: `You are a financial storyteller. Your task is to transform a list of financial transactions into a series of engaging, narrative-style journal entries. Group transactions by day and create one journal entry for each day that has activity.

Transactions Data:
{{{transactions}}}

For each day with transactions, create a journal entry with a date, a creative title, and a narrative that tells the story of that day's financial journey. Focus on the 'why' behind the spending, not just the 'what'. Make it personal and insightful.
`,
});

const generateJournalEntriesFlow = ai.defineFlow(
  {
    name: 'generateJournalEntriesFlow',
    inputSchema: GenerateJournalEntriesInputSchema,
    outputSchema: GenerateJournalEntriesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
