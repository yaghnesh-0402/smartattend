'use client';

import * as React from 'react';
import {
  Bot,
  CalendarDays,
  CheckCircle,
  FileDown,
  FileText,
  Loader2,
  Mail,
  ScanLine,
  Users,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import type { Event, Student } from '@/lib/data';
import { events, students } from '@/lib/data';
import { generateAttendanceSummary } from './actions';

type AttendedStudent = Student & { timestamp: string };

export default function DashboardPage() {
  const { toast } = useToast();
  const [selectedEventId, setSelectedEventId] = React.useState<string>(events[0].id);
  const [attendedStudents, setAttendedStudents] = React.useState<AttendedStudent[]>([]);
  const [lastScannedStudent, setLastScannedStudent] = React.useState<Student | null>(null);
  const [isScanning, setIsScanning] = React.useState(false);
  const [aiSummary, setAiSummary] = React.useState<string>('');
  const [isGeneratingSummary, setIsGeneratingSummary] = React.useState(false);

  const selectedEvent = events.find((e) => e.id === selectedEventId) as Event;

  const handleScan = () => {
    setIsScanning(true);
    setLastScannedStudent(null);
    setTimeout(() => {
      const unAttendedStudents = students.filter(
        (s) => !attendedStudents.some((as) => as.id === s.id)
      );

      if (unAttendedStudents.length === 0) {
        toast({
          title: 'Fully Attended',
          description: 'All students have already been marked as present.',
        });
        setIsScanning(false);
        return;
      }

      const randomStudent =
        unAttendedStudents[Math.floor(Math.random() * unAttendedStudents.length)];

      if (!attendedStudents.some((s) => s.id === randomStudent.id)) {
        setAttendedStudents((prev) => [
          { ...randomStudent, timestamp: new Date().toLocaleTimeString() },
          ...prev,
        ]);
        setLastScannedStudent(randomStudent);
        toast({
          title: 'Attendance Marked',
          description: `${randomStudent.name} has been marked present.`,
        });
      }
      setIsScanning(false);
    }, 1500);
  };

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    setAiSummary('');
    const result = await generateAttendanceSummary(attendedStudents, selectedEvent.name);
    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    } else if (result.summary) {
      setAiSummary(result.summary);
    }
    setIsGeneratingSummary(false);
  };

  const handleDownloadPdf = () => {
    toast({
      title: 'Report Downloaded',
      description: `The attendance report for ${selectedEvent.name} has been downloaded.`,
    });
  };

  const handleEmailReport = () => {
    toast({
      title: 'Report Emailed',
      description: `The attendance report has been sent to all department heads.`,
    });
  };
  
  React.useEffect(() => {
    setAttendedStudents([]);
    setLastScannedStudent(null);
    setAiSummary('');
  }, [selectedEventId]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1 flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Attendance Scanner</CardTitle>
            <CardDescription>Scan student ID barcodes to mark attendance.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            <div className="relative w-full max-w-[280px] h-[180px] rounded-lg bg-muted flex items-center justify-center overflow-hidden">
              {isScanning ? (
                 <div className="w-full h-full flex flex-col items-center justify-center bg-background/50">
                    <ScanLine className="h-16 w-16 text-primary animate-pulse" />
                    <p className="text-muted-foreground mt-2">Scanning...</p>
                 </div>
              ) : lastScannedStudent ? (
                <div className="text-center p-4">
                  <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
                  <p className="font-semibold">{lastScannedStudent.name}</p>
                  <p className="text-sm text-muted-foreground font-code">{lastScannedStudent.barcodeId}</p>
                </div>
              ) : (
                <div className="text-center">
                  <ScanLine className="h-16 w-16 text-muted-foreground" />
                  <p className="text-muted-foreground mt-2">Ready to scan</p>
                </div>
              )}
            </div>
            <Button onClick={handleScan} disabled={isScanning} className="w-full max-w-[280px]">
              {isScanning ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ScanLine className="mr-2 h-4 w-4" />
              )}
              {isScanning ? 'Scanning...' : 'Simulate Scan'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2 flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Event Details</CardTitle>
          </CardHeader>
          <CardContent>
             <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <CalendarDays className="size-4 text-muted-foreground" />
                    <span>{new Date(selectedEvent.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Users className="size-4 text-muted-foreground" />
                    <span>{attendedStudents.length} / {students.length} Attended</span>
                </div>
            </div>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="attendance">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="attendance"><Users className="mr-2 size-4" />Live Attendance</TabsTrigger>
            <TabsTrigger value="ai-summary"><Bot className="mr-2 size-4" />AI Summary</TabsTrigger>
            <TabsTrigger value="report"><FileText className="mr-2 size-4" />Generate Report</TabsTrigger>
          </TabsList>
          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Attendance List</CardTitle>
                <CardDescription>Students marked present for {selectedEvent.name}.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Roll No.</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendedStudents.length > 0 ? (
                      attendedStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={student.avatarUrl} alt={student.name} />
                                <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              {student.name}
                            </div>
                          </TableCell>
                          <TableCell className="font-code">{student.rollNumber}</TableCell>
                          <TableCell>{student.year}-{student.section}</TableCell>
                          <TableCell>{student.timestamp}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          No students have been marked present yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="ai-summary">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">AI Attendance Summary</CardTitle>
                <CardDescription>Generate a section-based summary of attendance.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Button onClick={handleGenerateSummary} disabled={isGeneratingSummary || attendedStudents.length === 0}>
                  {isGeneratingSummary ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Bot className="mr-2 h-4 w-4" />
                  )}
                  {isGeneratingSummary ? 'Generating...' : 'Generate with AI'}
                </Button>
                {isGeneratingSummary && <Skeleton className="h-32 w-full" />}
                {aiSummary && (
                   <div className="prose prose-sm dark:prose-invert max-w-none rounded-lg border bg-muted/50 p-4">
                     <p>{aiSummary}</p>
                   </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="report">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Attendance Report</CardTitle>
                <CardDescription>Generate and deliver the attendance report.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-lg p-6 bg-card">
                  <h3 className="text-xl font-bold font-headline text-center">Attendance Report</h3>
                  <p className="text-center text-muted-foreground mb-4">{selectedEvent.name}</p>
                  <p className="text-sm">This report details the attendance for the event held on {new Date(selectedEvent.date).toLocaleDateString()}.</p>
                  <p className="text-sm mb-4">Total students attended: {attendedStudents.length}</p>
                  <ul className="text-sm list-disc pl-5 space-y-1 font-code">
                    {attendedStudents.slice(0, 5).map(s => <li key={s.id}>{s.name} ({s.rollNumber})</li>)}
                    {attendedStudents.length > 5 && <li>... and {attendedStudents.length - 5} more.</li>}
                  </ul>
                </div>
                <div className="flex gap-4">
                  <Button onClick={handleDownloadPdf} className="flex-1">
                    <FileDown className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                  <Button onClick={handleEmailReport} variant="secondary" className="flex-1">
                    <Mail className="mr-2 h-4 w-4" />
                    Email to Departments
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
