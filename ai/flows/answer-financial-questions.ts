'use server';

/**
 * @fileOverview An AI agent that answers financial questions using natural language.
 *
 * - answerFinancialQuestion - A function that answers financial questions.
 * - AnswerFinancialQuestionInput - The input type for the answerFinancialQuestion function.
 * - AnswerFinancialQuestionOutput - The return type for the answerFinancialQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerFinancialQuestionInputSchema = z.object({
  question: z.string().describe('The financial question to answer.'),
  financialData: z.string().describe('The user financial data, including income, expenses, and assets.'),
});
export type AnswerFinancialQuestionInput = z.infer<typeof AnswerFinancialQuestionInputSchema>;

const AnswerFinancialQuestionOutputSchema = z.object({
  answer: z.string().describe('The answer to the financial question.'),
});
export type AnswerFinancialQuestionOutput = z.infer<typeof AnswerFinancialQuestionOutputSchema>;

export async function answerFinancialQuestion(input: AnswerFinancialQuestionInput): Promise<AnswerFinancialQuestionOutput> {
  return answerFinancialQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'answerFinancialQuestionPrompt',
  input: {schema: AnswerFinancialQuestionInputSchema},
  output: {schema: AnswerFinancialQuestionOutputSchema},
  prompt: `You are a financial expert. Use the user's financial data to answer the question.

Financial Data: {{{financialData}}}

Question: {{{question}}}

Answer: `,
});

const answerFinancialQuestionFlow = ai.defineFlow(
  {
    name: 'answerFinancialQuestionFlow',
    inputSchema: AnswerFinancialQuestionInputSchema,
    outputSchema: AnswerFinancialQuestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
