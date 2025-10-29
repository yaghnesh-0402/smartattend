'use client';

import * as React from 'react';
import { Barcode, Camera, CheckCircle, Loader2, UserPlus, Users, XCircle, Ungroup, Group, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, getDocs, DocumentData } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import Quagga from '@ericblade/quagga2';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { generateAttendancePdf } from '@/lib/pdf-generator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Student = {
  id: string;
  name: string;
  rollNo: string;
  year: number;
  section: string;
  branch: string;
  avatarUrl: string;
};

export default function SmartAttend() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isScanning, setIsScanning] = React.useState(false);
  const [scannedData, setScannedData] = React.useState<string | null>(null);
  const [student, setStudent] = React.useState<Student | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = React.useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = React.useState<string | null>(null);
  const [attendingStudents, setAttendingStudents] = React.useState<Student[]>([]);
  const [groupBy, setGroupBy] = React.useState<'none' | 'branch' | 'year-branch'>('none');

  // PDF Customization State
  const [hodName, setHodName] = React.useState('');
  const [eventName, setEventName] = React.useState('');
  const [clubName, setClubName] = React.useState('');
  const [universityName, setUniversityName] = React.useState('');


  const stopScanner = React.useCallback(() => {
    if (Quagga.initialized) {
        try {
            Quagga.stop();
        } catch (e) {
            console.warn("Quagga stop error, may be harmless:", e);
        }
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  }, []);

  const fetchStudent = async (scannedRollNo: string) => {
    setIsLoading(true);
    setError(null);
    setStudent(null);
    setScannedData(scannedRollNo);

    try {
      if (!firestore) {
        throw new Error("Firestore is not initialized");
      }
      const studentsRef = collection(firestore, 'students');
      const q = query(studentsRef, where('rollNo', '==', scannedRollNo));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('No student found with this roll number.');
        setStudent(null);
        toast({
          variant: 'destructive',
          title: 'Student Not Found',
          description: `No student record matches roll number: ${scannedRollNo}`,
        });
      } else {
        const studentDoc = querySnapshot.docs[0];
        const studentData = { id: studentDoc.id, ...studentDoc.data() } as Student;
        setStudent(studentData);
        toast({
          title: 'Scan Successful',
          description: `${studentData.name} has been identified.`,
        });
      }
    } catch (e: any) {
      console.error('Error fetching student:', e);
      setError('Failed to fetch student data from the database.');
      toast({
        variant: 'destructive',
        title: 'Database Error',
        description: 'Could not retrieve student information.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startScanner = async () => {
    setStudent(null);
    setError(null);
    setScannedData(null);
    setCapturedImage(null);
    setHasCameraPermission(null);
  
    try {
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          advanced: [{ focusMode: 'continuous' }]
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
  
        Quagga.init({
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target: videoRef.current,
            constraints: {
              width: { min: 640, ideal: 1280 },
              height: { min: 480, ideal: 720 },
              facingMode: "environment",
              aspectRatio: { min: 1, max: 2 },
            },
          },
          decoder: {
            readers: ["code_128_reader", "ean_reader", "code_39_reader", "upc_reader", "codabar_reader"]
          },
          locate: true,
          locator: {
            patchSize: 'medium',
            halfSample: false
          },
          numOfWorkers: navigator.hardwareConcurrency || 4,
        }, (err) => {
          if (err) {
            console.error("Quagga initialization failed:", err);
            setError("Failed to initialize scanner library.");
            setHasCameraPermission(false);
            return;
          }
          Quagga.initialized = true;
          setIsScanning(true);
          Quagga.start();
        });
      }
    } catch (err) {
      console.error("Camera access denied or constraints not supported:", err);
      setHasCameraPermission(false);
      setError("Camera access is required. Please enable permissions and ensure your device supports the required camera features.");
      toast({
        variant: "destructive",
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
      });
    }
  };
  
  const captureAndScan = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUri);
        stopScanner();
        setIsLoading(true);

        Quagga.decodeSingle({
          src: dataUri,
          numOfWorkers: 0,
          decoder: {
              readers: ["code_128_reader", "code_39_reader", "ean_reader", "upc_reader", "codabar_reader"],
          },
        }, (result) => {
          setIsLoading(false);
          if (result && result.codeResult) {
            fetchStudent(result.codeResult.code);
          } else {
            setError('Could not detect a barcode. Please try again.');
            setScannedData(null);
            toast({
              variant: 'destructive',
              title: 'Detection Failed',
              description: 'No barcode was found in the captured image.',
            });
          }
        });
      }
    }
  };
  
  const handleAddToAttendance = () => {
    if (!student) return;

    if (attendingStudents.some((s) => s.id === student.id)) {
      toast({
        variant: 'destructive',
        title: 'Already Attending',
        description: `${student.name} is already on the attendance list.`,
      });
    } else {
      setAttendingStudents((prev) => [student, ...prev]);
      toast({
        title: 'Attendance Marked',
        description: `${student.name} has been added to the list.`,
      });
    }
    setStudent(null);
    setScannedData(null);
    setCapturedImage(null);
  };
  
  const handleDownloadPdf = (students: Student[], branch: string, year?: string) => {
    if (!hodName || !eventName || !clubName || !universityName) {
      toast({
        variant: 'destructive',
        title: 'Missing PDF Details',
        description: 'Please fill in all PDF customization fields before downloading.',
      });
      return;
    }
    generateAttendancePdf(students, branch, year, { hodName, eventName, clubName, universityName });
  };

  React.useEffect(() => {
    Quagga.initialized = false;
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  const groupedStudents = React.useMemo(() => {
    if (groupBy === 'none') {
      return null;
    }

    if (groupBy === 'year-branch') {
      const yearGroups = new Map<string, Student[]>();
      attendingStudents.forEach((student) => {
        const yearKey = String(student.year);
        if (!yearGroups.has(yearKey)) {
          yearGroups.set(yearKey, []);
        }
        yearGroups.get(yearKey)!.push(student);
      });

      const nestedGroups = new Map<string, Map<string, Student[]>>();
      yearGroups.forEach((students, year) => {
        const branchGroups = new Map<string, Student[]>();
        students.forEach((student) => {
          const branchKey = student.branch;
          if (!branchGroups.has(branchKey)) {
            branchGroups.set(branchKey, []);
          }
          branchGroups.get(branchKey)!.push(student);
        });
        nestedGroups.set(year, branchGroups);
      });
      return Array.from(nestedGroups.entries());
    }

    const simpleGroups = new Map<string, Student[]>();
    attendingStudents.forEach((student) => {
      const key = String(student[groupBy as 'branch']);
      if (!simpleGroups.has(key)) {
        simpleGroups.set(key, []);
      }
      simpleGroups.get(key)!.push(student);
    });
    return Array.from(simpleGroups.entries());
  }, [attendingStudents, groupBy]);


  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 items-center p-4 md:p-6 lg:p-8">
       <div className="w-full max-w-lg mx-auto">
        <div className="flex items-center justify-center gap-3 mb-6">
            <Barcode className="size-10 text-primary" />
            <h1 className="text-4xl font-headline font-bold text-slate-800 dark:text-slate-100">
              Smart Attend
            </h1>
        </div>

        <Card className="shadow-lg dark:shadow-slate-800/50 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="font-headline text-center text-2xl">Attendance Scanner</CardTitle>
            <CardDescription className="text-center">
              {isScanning ? 'Position the barcode inside the frame and capture.' : 'Press "Start Scanning" to activate the camera.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="relative w-full aspect-video rounded-lg bg-slate-200 dark:bg-slate-900 flex items-center justify-center overflow-hidden border-2 border-slate-300 dark:border-slate-800 shadow-inner">
              <video ref={videoRef} className={`w-full h-full object-cover ${isScanning ? '' : 'hidden'}`} autoPlay muted playsInline />
              {capturedImage && !isScanning && (
                <Image src={capturedImage} alt="Captured barcode" layout="fill" objectFit="contain" />
              )}
              {!isScanning && !capturedImage && (
                <div className="text-center text-muted-foreground p-4">
                  <Camera className="size-16 mx-auto mb-2 opacity-50" />
                  <p className="font-semibold">Camera is off</p>
                  <p className="text-sm">Ready to scan attendance</p>
                </div>
              )}
              {isScanning && (
                <div className="absolute inset-0 z-10 flex items-center justify-center">
                  <div className="w-2/3 h-1/2 border-4 border-dashed border-primary/70 rounded-lg bg-black/20" />
                </div>
              )}
            </div>
            
            {hasCameraPermission === false && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Camera Permission Denied</AlertTitle>
                <AlertDescription>
                  Please enable camera permissions in your browser settings to use the scanner.
                </AlertDescription>
              </Alert>
            )}

            {!isScanning ? (
              <Button onClick={startScanner} size="lg" className="w-full font-semibold shadow-md hover:shadow-lg transition-shadow">
                <Camera className="mr-2" /> Start Scanning
              </Button>
            ) : (
              <Button onClick={captureAndScan} size="lg" className="w-full font-semibold shadow-md hover:shadow-lg transition-shadow">
                <Barcode className="mr-2" /> Capture & Scan
              </Button>
            )}
          </CardContent>
        </Card>

        {isLoading && (
          <div className="text-center p-6 mt-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-2 text-muted-foreground">{capturedImage ? 'Processing image...' : 'Fetching student details...'}</p>
          </div>
        )}
        
        {scannedData && !isLoading && !student && (
            <Card className="mt-4 w-full shadow-md dark:shadow-slate-800/50 dark:border-slate-800">
                <CardHeader>
                <CardTitle className="font-headline text-center">Detected Roll Number</CardTitle>
                </CardHeader>
                <CardContent>
                <p className="text-center font-mono text-lg bg-muted p-3 rounded-md">{scannedData}</p>
                </CardContent>
            </Card>
        )}

        {error && !isLoading && (
          <Alert variant="destructive" className="mt-4 shadow">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {student && !isLoading && (
          <Card className="mt-4 w-full shadow-xl dark:shadow-slate-800/80 dark:border-slate-800 overflow-hidden">
            <CardHeader className="text-center bg-slate-50 dark:bg-slate-900/50 p-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <CardTitle className="font-headline text-2xl">Student Identified</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-20 w-20 border-2 border-primary/50 shadow-md">
                  <AvatarImage src={student.avatarUrl} alt={student.name} data-ai-hint="student portrait" />
                  <AvatarFallback className="text-2xl">{student.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{student.name}</p>
                  <p className="text-muted-foreground font-code">Roll: {student.rollNo}</p>
                  <p className="text-muted-foreground">{student.branch}</p>
                  <p className="text-muted-foreground text-sm">Year: {student.year}, Section: {student.section}</p>
                </div>
              </div>
              <Button onClick={handleAddToAttendance} className="w-full font-semibold" size="lg">
                <UserPlus className="mr-2" /> Add to Attendance
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {attendingStudents.length > 0 && (
        <div className="mt-8 w-full max-w-6xl">
            <Card className="mb-6 shadow-md dark:shadow-slate-800/50 dark:border-slate-800">
                <CardHeader>
                    <CardTitle>PDF Customization</CardTitle>
                    <CardDescription>Enter the details to be included in the downloaded attendance report.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="hod-name">HOD Name</Label>
                        <Input id="hod-name" placeholder="e.g., Dr. Jane Smith" value={hodName} onChange={(e) => setHodName(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="event-name">Event Name</Label>
                        <Input id="event-name" placeholder="e.g., Tech Summit 2024" value={eventName} onChange={(e) => setEventName(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="club-name">Club/Organizer Name</Label>
                        <Input id="club-name" placeholder="e.g., Robotics Club" value={clubName} onChange={(e) => setClubName(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="university-name">University Name</Label>
                        <Input id="university-name" placeholder="e.g., Central University" value={universityName} onChange={(e) => setUniversityName(e.target.value)} />
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-md dark:shadow-slate-800/50 dark:border-slate-800">
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
                    <Users />
                    Attending Students ({attendingStudents.length})
                    </CardTitle>
                    <CardDescription>Students who have been marked as present.</CardDescription>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Button variant={groupBy === 'branch' ? 'secondary' : 'outline'} size="sm" onClick={() => setGroupBy(groupBy === 'branch' ? 'none' : 'branch')}>
                    <Group className="mr-2" /> Group by Branch
                    </Button>
                    <Button variant={groupBy === 'year-branch' ? 'secondary' : 'outline'} size="sm" onClick={() => setGroupBy(groupBy === 'year-branch' ? 'none' : 'year-branch')}>
                    <Group className="mr-2" /> Group by Year & Branch
                    </Button>
                    {groupBy !== 'none' && (
                    <Button variant="ghost" size="sm" onClick={() => setGroupBy('none')}>
                        <Ungroup className="mr-2" /> Clear Grouping
                    </Button>
                    )}
                </div>
                </div>
            </CardHeader>
            <CardContent>
                {groupBy === 'none' ? (
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Roll No</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead>Section</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {attendingStudents.map((s) => (
                        <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell>{s.rollNo}</TableCell>
                        <TableCell>{s.branch}</TableCell>
                        <TableCell>{s.year}</TableCell>
                        <TableCell>{s.section}</TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                ) : groupBy === 'year-branch' ? (
                <div className="space-y-6">
                    {(groupedStudents as [string, Map<string, Student[]>][])?.map(([year, branchMap]) => (
                    <div key={year} className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                        <h3 className="text-xl font-bold mb-4">
                        Year: {year}
                        </h3>
                        <div className="space-y-4 pl-4 border-l-2 border-primary/50">
                        {Array.from(branchMap.entries()).map(([branch, students]) => (
                            <div key={branch}>
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-lg font-semibold capitalize">
                                Branch: {branch} <span className="font-normal text-muted-foreground">({students.length} students)</span>
                                </h4>
                                <Button variant="outline" size="sm" onClick={() => handleDownloadPdf(students, branch, year)}>
                                <Download className="mr-2 h-4 w-4" />
                                Download PDF
                                </Button>
                            </div>
                            <Table>
                                <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Roll No</TableHead>
                                    <TableHead>Section</TableHead>
                                </TableRow>
                                </TableHeader>
                                <TableBody>
                                {students.map((s) => (
                                    <TableRow key={s.id}>
                                    <TableCell className="font-medium">{s.name}</TableCell>
                                    <TableCell>{s.rollNo}</TableCell>
                                    <TableCell>{s.section}</TableCell>
                                    </TableRow>
                                ))}
                                </TableBody>
                            </Table>
                            </div>
                        ))}
                        </div>
                    </div>
                    ))}
                </div>
                ) : (
                <div className="space-y-6">
                    {(groupedStudents as [string, Student[]][])?.map(([groupKey, students]) => (
                    <div key={groupKey} className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                        <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold capitalize">
                            {groupBy}: {groupKey} <span className="font-normal text-muted-foreground">({students.length} students)</span>
                        </h3>
                        <Button variant="outline" size="sm" onClick={() => handleDownloadPdf(students, groupKey, undefined)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                        </Button>
                        </div>
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Roll No</TableHead>
                            <TableHead>Year</TableHead>
                            <TableHead>Section</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {students.map((s) => (
                            <TableRow key={s.id}>
                                <TableCell className="font-medium">{s.name}</TableCell>
                                <TableCell>{s.rollNo}</TableCell>
                                <TableCell>{s.year}</TableCell>
                                <TableCell>{s.section}</TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                        </Table>
                    </div>
                    ))}
                </div>
                )}
            </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}

    