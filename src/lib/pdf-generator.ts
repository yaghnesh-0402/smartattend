import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

type Student = {
  name: string;
  rollNo: string;
};

// Extend jsPDF with the autoTable plugin
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

export const generateAttendancePdf = (
  students: Student[],
  branch: string,
  year?: string | undefined
) => {
  const doc = new jsPDF() as jsPDFWithAutoTable;
  const today = format(new Date(), 'MMMM dd, yyyy');
  const eventName = 'the upcoming technical workshop'; // You can make this dynamic if needed
  let startY = 85;

  // 1. Set Document Properties
  doc.setProperties({
    title: `Attendance Report - ${branch}`,
  });

  // 2. Add Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Attendance Submission Report', 105, 20, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('times', 'normal');
  doc.text(`Date: ${today}`, 15, 30);

  // 3. Add Letter Body
  doc.setFontSize(12);
  doc.setFont('times', 'normal');
  doc.text('To,', 15, 45);
  doc.text(`The Head of the Department,`, 15, 50);
  doc.text(`Department of ${branch},`, 15, 55);
  doc.text('University Name,', 15, 60); // Replace with actual university name if available

  doc.setFont('times', 'bold');
  doc.text(
    `Subject: Submission of student attendance list for ${eventName}.`,
    15,
    75
  );

  doc.setFont('times', 'normal');
  const bodyText = `Respected Sir/Madam,

Please find attached the list of students from ${year ? `Year ${year}, ` : ''}Department of ${branch}, who have confirmed their attendance for ${eventName}.

We request your approval for the same.

Thank you.

Sincerely,
Event Coordinator`;

  const bodyLines = doc.splitTextToSize(bodyText, 180);
  doc.text(bodyLines, 15, startY);
  
  // Calculate Y position for the table after the body text
  startY += (bodyLines.length * 5) + 10;

  // 4. Add Student Table
  const tableColumn = ['S.No', 'Student Name', 'Roll Number'];
  const tableRows = students.map((student, index) => [
    index + 1,
    student.name,
    student.rollNo,
  ]);

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: startY,
    headStyles: {
      fillColor: [30, 30, 30], // Dark gray header
    },
    styles: {
      halign: 'center',
    },
    columnStyles: {
      1: { halign: 'left' },
    },
  });

  // 5. Save the PDF
  doc.save(`Attendance-Report-${branch}${year ? `-${year}` : ''}.pdf`);
};
