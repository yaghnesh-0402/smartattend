'use server';

/**
 * @fileOverview A flow for generating a summary of attendance data categorized by section.
 *
 * - sectionBasedAttendanceSummary - A function that generates the attendance summary.
 * - SectionBasedAttendanceSummaryInput - The input type for the sectionBasedAttendanceSummary function.
 * - SectionBasedAttendanceSummaryOutput - The return type for the sectionBasedAttendanceSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SectionBasedAttendanceSummaryInputSchema = z.object({
  attendanceData: z
    .string()
    .describe(
      'The attendance data in JSON format. Should contain student name, roll number, year, and section.'
    ),
  eventName: z.string().describe('The name of the event.'),
});
export type SectionBasedAttendanceSummaryInput = z.infer<
  typeof SectionBasedAttendanceSummaryInputSchema
>;

const SectionBasedAttendanceSummaryOutputSchema = z.object({
  summary: z
    .string()
    .describe(
      'A summary of attendance data, categorized by section, including participation rates.'
    ),
});
export type SectionBasedAttendanceSummaryOutput = z.infer<
  typeof SectionBasedAttendanceSummaryOutputSchema
>;

export async function sectionBasedAttendanceSummary(
  input: SectionBasedAttendanceSummaryInput
): Promise<SectionBasedAttendanceSummaryOutput> {
  return sectionBasedAttendanceSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'sectionBasedAttendanceSummaryPrompt',
  input: {schema: SectionBasedAttendanceSummaryInputSchema},
  output: {schema: SectionBasedAttendanceSummaryOutputSchema},
  prompt: `You are an event coordinator. You need to summarize the attendance data of an event, categorized by section.

Event Name: {{{eventName}}}

Attendance Data: {{{attendanceData}}}

Provide a summary of attendance data, categorized by section, including participation rates from each section.
`,
});

const sectionBasedAttendanceSummaryFlow = ai.defineFlow(
  {
    name: 'sectionBasedAttendanceSummaryFlow',
    inputSchema: SectionBasedAttendanceSummaryInputSchema,
    outputSchema: SectionBasedAttendanceSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
