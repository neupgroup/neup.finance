'use server';
/**
 * @fileOverview AI-powered expense optimization suggestions.
 *
 * - suggestExpenseOptimizations - A function that provides expense optimization suggestions.
 * - SuggestExpenseOptimizationsInput - The input type for the suggestExpenseOptimizations function.
 * - SuggestExpenseOptimizationsOutput - The return type for the suggestExpenseOptimizations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestExpenseOptimizationsInputSchema = z.object({
  spendingData: z.string().describe('A detailed breakdown of the user\'s spending data, including categories and amounts.'),
  financialGoals: z.string().describe('The user\'s financial goals and priorities.'),
});
export type SuggestExpenseOptimizationsInput = z.infer<typeof SuggestExpenseOptimizationsInputSchema>;

const SuggestExpenseOptimizationsOutputSchema = z.object({
  suggestions: z.array(
    z.object({
      category: z.string().describe('The spending category to optimize.'),
      suggestion: z.string().describe('A specific suggestion for optimizing spending in this category.'),
      potentialSavings: z.string().describe('An estimate of the potential savings from implementing this suggestion.'),
    })
  ).describe('A list of expense optimization suggestions.'),
});
export type SuggestExpenseOptimizationsOutput = z.infer<typeof SuggestExpenseOptimizationsOutputSchema>;

export async function suggestExpenseOptimizations(input: SuggestExpenseOptimizationsInput): Promise<SuggestExpenseOptimizationsOutput> {
  return suggestExpenseOptimizationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestExpenseOptimizationsPrompt',
  input: {schema: SuggestExpenseOptimizationsInputSchema},
  output: {schema: SuggestExpenseOptimizationsOutputSchema},
  prompt: `You are a financial advisor specializing in expense optimization. Analyze the user's spending data and financial goals to provide actionable suggestions for saving money.

Spending Data: {{{spendingData}}}

Financial Goals: {{{financialGoals}}}

Provide a list of expense optimization suggestions, including the category to optimize, a specific suggestion, and an estimate of the potential savings.

Format your response as a JSON array of objects. Each object should contain the keys "category", "suggestion", and "potentialSavings".
`,
});

const suggestExpenseOptimizationsFlow = ai.defineFlow(
  {
    name: 'suggestExpenseOptimizationsFlow',
    inputSchema: SuggestExpenseOptimizationsInputSchema,
    outputSchema: SuggestExpenseOptimizationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
