'use server';

import { sectionBasedAttendanceSummary } from '@/ai/flows/section-based-attendance-summary';
import type { Student } from '@/lib/data';

export async function generateAttendanceSummary(
  attendedStudents: Student[],
  eventName: string
) {
  if (attendedStudents.length === 0) {
    return { error: 'No attendance data to summarize.' };
  }

  try {
    const input = {
      attendanceData: JSON.stringify(attendedStudents),
      eventName: eventName,
    };
    const { summary } = await sectionBasedAttendanceSummary(input);
    return { summary };
  } catch (e) {
    console.error(e);
    return { error: 'Failed to generate summary. Please try again.' };
  }
}
