import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

type Student = {
  name: string;
  rollNo: string;
};

type PdfDetails = {
  hodName: string;
  eventName: string;
  clubName: string;
  universityName: string;
};

// Extend jsPDF with the autoTable plugin
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

export const generateAttendancePdf = (
  students: Student[],
  branch: string,
  year: string | undefined,
  details: PdfDetails
) => {
  const doc = new jsPDF() as jsPDFWithAutoTable;
  const today = format(new Date(), 'MMMM dd, yyyy');
  let startY = 20;

  // 1. Set Document Properties
  doc.setProperties({
    title: `Attendance Report - ${branch}`,
  });

  // 2. Add Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Attendance Submission Report', 105, startY, { align: 'center' });
  startY += 10;

  doc.setFontSize(11);
  doc.setFont('times', 'normal');
  doc.text(`Date: ${today}`, 15, startY);
  startY += 15;

  // 3. Add Letter Body
  doc.setFontSize(12);
  doc.setFont('times', 'normal');
  doc.text('To,', 15, startY);
  startY += 5;
  doc.text(details.hodName, 15, startY);
  startY += 5;
  doc.text(`The Head of the Department,`, 15, startY);
  startY += 5;
  doc.text(`Department of ${branch},`, 15, startY);
  startY += 5;
  doc.text(`${details.universityName},`, 15, startY);
  startY += 15;

  doc.setFont('times', 'bold');
  doc.text(
    `Subject: Submission of student attendance list for ${details.eventName}.`,
    15,
    startY
  );
  startY += 10;

  doc.setFont('times', 'normal');
  const bodyText = `Respected Sir/Madam,

Please find attached the list of students from ${year ? `Year ${year}, ` : ''}Department of ${branch}, who have confirmed their attendance for ${details.eventName}.

We request your approval for the same.

Thank you.

Sincerely,
${details.clubName}`;

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
