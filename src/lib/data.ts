export type Student = {
  id: string;
  name: string;
  rollNumber: string;
  year: number;
  section: string;
  barcodeId: string;
  avatarUrl: string;
};

export type Event = {
  id: string;
  name: string;
  date: string;
};

export const students: Student[] = [
  { id: '1', name: 'Aarav Sharma', rollNumber: 'R001', year: 2, section: 'A', barcodeId: 'SCAN-001', avatarUrl: 'https://picsum.photos/seed/student1/100/100' },
  { id: '2', name: 'Vivaan Singh', rollNumber: 'R002', year: 2, section: 'A', barcodeId: 'SCAN-002', avatarUrl: 'https://picsum.photos/seed/student2/100/100' },
  { id: '3', name: 'Aditya Kumar', rollNumber: 'R003', year: 2, section: 'B', barcodeId: 'SCAN-003', avatarUrl: 'https://picsum.photos/seed/student3/100/100' },
  { id: '4', name: 'Diya Gupta', rollNumber: 'R004', year: 3, section: 'C', barcodeId: 'SCAN-004', avatarUrl: 'https://picsum.photos/seed/student4/100/100' },
  { id: '5', name: 'Ishaan Patel', rollNumber: 'R005', year: 3, section: 'B', barcodeId: 'SCAN-005', avatarUrl: 'https://picsum.photos/seed/student5/100/100' },
  { id: '6', name: 'Ananya Reddy', rollNumber: 'R006', year: 2, section: 'A', barcodeId: 'SCAN-006', avatarUrl: 'https://picsum.photos/seed/student6/100/100' },
  { id: '7', name: 'Kabir Verma', rollNumber: 'R007', year: 4, section: 'C', barcodeId: 'SCAN-007', avatarUrl: 'https://picsum.photos/seed/student7/100/100' },
  { id: '8', name: 'Myra Khan', rollNumber: 'R008', year: 4, section: 'B', barcodeId: 'SCAN-008', avatarUrl: 'https://picsum.photos/seed/student8/100/100' },
  { id: '9', name: 'Reyansh Joshi', rollNumber: 'R009', year: 2, section: 'A', barcodeId: 'SCAN-009', avatarUrl: 'https://picsum.photos/seed/student9/100/100' },
  { id: '10', name: 'Saanvi Iyer', rollNumber: 'R010', year: 3, section: 'C', barcodeId: 'SCAN-010', avatarUrl: 'https://picsum.photos/seed/student10/100/100' },
  { id: '11', name: 'Arjun Nair', rollNumber: 'R011', year: 3, section: 'B', barcodeId: 'SCAN-011', avatarUrl: 'https://picsum.photos/seed/student11/100/100' },
  { id: '12', name: 'Zara Mehta', rollNumber: 'R012', year: 4, section: 'A', barcodeId: 'SCAN-012', avatarUrl: 'https://picsum.photos/seed/student12/100/100' },
];

export const events: Event[] = [
  { id: 'event-1', name: 'Tech Symposium 2024', date: '2024-09-15' },
  { id: 'event-2', name: 'Annual Sports Day', date: '2024-10-20' },
  { id: 'event-3', name: 'Cultural Fest "AURA"', date: '2024-11-05' },
];
