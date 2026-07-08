'use server';

/**
 * @fileOverview Projects future savings based on current income and spending.
 *
 * - projectFutureSavings - A function that projects future savings.
 * - ProjectFutureSavingsInput - The input type for the projectFutureSavings function.
 * - ProjectFutureSavingsOutput - The return type for the projectFutureSavings function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProjectFutureSavingsInputSchema = z.object({
  currentIncome: z.number().describe('The user`s current monthly income.'),
  currentSpending: z.number().describe('The user`s current monthly spending.'),
  currentSavings: z.number().describe('The user`s current total savings.'),
  savingsGoal: z.number().describe('The user`s savings goal.'),
  interestRate: z
    .number()
    .optional()
    .default(0)
    .describe('The annual interest rate on savings, as a decimal (e.g., 0.05 for 5%).'),
});
export type ProjectFutureSavingsInput = z.infer<typeof ProjectFutureSavingsInputSchema>;

const ProjectFutureSavingsOutputSchema = z.object({
  monthsToGoal: z
    .number()
    .describe(
      'The number of months it will take to reach the savings goal, based on current income, spending, and interest rate.'
    ),
  projectedSavings: z
    .number()
    .describe('The projected savings amount after the calculated number of months.'),
});
export type ProjectFutureSavingsOutput = z.infer<typeof ProjectFutureSavingsOutputSchema>;

export async function projectFutureSavings(input: ProjectFutureSavingsInput): Promise<ProjectFutureSavingsOutput> {
  return projectFutureSavingsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'projectFutureSavingsPrompt',
  input: {schema: ProjectFutureSavingsInputSchema},
  output: {schema: ProjectFutureSavingsOutputSchema},
  prompt: `You are a financial advisor. Project how many months it will take to reach a savings goal based on the user's current income, spending, current savings, and an annual interest rate. Assume interest is compounded monthly.

  Current Income: {{currentIncome}}
  Current Spending: {{currentSpending}}
  Current Savings: {{currentSavings}}
  Savings Goal: {{savingsGoal}}
  Interest Rate: {{interestRate}}

  Calculate the number of months to reach the savings goal and the projected savings after that time.
  Return the number of months in the 'monthsToGoal' field, and the projected savings in the 'projectedSavings' field.
  Round the number of months to the nearest integer.
`,
});

const projectFutureSavingsFlow = ai.defineFlow(
  {
    name: 'projectFutureSavingsFlow',
    inputSchema: ProjectFutureSavingsInputSchema,
    outputSchema: ProjectFutureSavingsOutputSchema,
  },
  async input => {
    // Calculate months to goal and projected savings
    let {currentIncome, currentSpending, currentSavings, savingsGoal, interestRate} = input;
    const monthlySavings = currentIncome - currentSpending;

    if (monthlySavings <= 0 && currentSavings < savingsGoal) {
      return {
        monthsToGoal: 9999, // Essentially infinite
        projectedSavings: currentSavings,
      };
    }

    let months = 0;
    let projectedSavings = currentSavings;

    if (interestRate === undefined) {
      interestRate = 0;
    }

    const monthlyInterestRate = interestRate / 12;

    while (projectedSavings < savingsGoal && months < 1200) { // avoid infinite loops
      projectedSavings += monthlySavings;
      projectedSavings *= (1 + monthlyInterestRate);
      months++;
    }

    projectedSavings = Math.round(projectedSavings * 100) / 100; // round to 2 decimal places

    return {
      monthsToGoal: Math.round(months),
      projectedSavings: projectedSavings,
    };
  }
);
