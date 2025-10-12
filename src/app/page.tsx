'use client';

import * as React from 'react';
import { Barcode, Camera, CheckCircle, Loader2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, getDocs, DocumentData } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import Quagga from '@ericblade/quagga2';

type Student = {
  id: string;
  name: string;
  rollNo: string;
  year: number;
  section: string;
  branch: string;
  barcode: string;
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

  const stopScanner = React.useCallback(() => {
    if (isScanning) {
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
  }, [isScanning]);


  const fetchStudent = async (barcode: string) => {
    setIsLoading(true);
    setError(null);
    setStudent(null);
    setScannedData(barcode);

    try {
      if (!firestore) {
        throw new Error("Firestore is not initialized");
      }
      const studentsRef = collection(firestore, 'students');
      const q = query(studentsRef, where('barcode', '==', barcode));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('No student found with this barcode.');
        setStudent(null);
        toast({
          variant: 'destructive',
          title: 'Student Not Found',
          description: `No student record matches barcode: ${barcode}`,
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
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
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
                  width: { min: 640 },
                  height: { min: 480 },
                  facingMode: "environment",
                  aspectRatio: { min: 1, max: 2 }
                },
              },
              decoder: {
                readers: ["code_128_reader", "ean_reader", "code_39_reader"]
              },
              locate: true,
            }, (err) => {
              if (err) {
                console.error("Quagga initialization failed:", err);
                setError("Failed to initialize scanner library.");
                setHasCameraPermission(false);
                return;
              }
              setIsScanning(true);
              Quagga.start();
            });
        }
    } catch (err) {
        console.error("Camera access denied:", err);
        setHasCameraPermission(false);
        setError("Camera access is required to scan barcodes. Please enable camera permissions in your browser settings.");
        toast({
            variant: "destructive",
            title: "Camera Access Denied",
            description: "Please enable camera permissions to use the scanner.",
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
            readers: ["code_128_reader", "code_39_reader", "ean_reader"]
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

  React.useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  return (
    <div className="flex flex-col min-h-screen bg-background items-center justify-center p-4">
       <div className="w-full max-w-md mx-auto">
        <div className="flex items-center justify-center gap-2 mb-6">
            <Barcode className="size-10 text-primary" />
            <h1 className="text-4xl font-headline font-bold">
              Smart Attend
            </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-center">Attendance Scanner</CardTitle>
            <CardDescription className="text-center">
              {isScanning ? 'Position the barcode and capture.' : 'Press "Start Scanning" to activate the camera.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="relative w-full aspect-video rounded-lg bg-muted flex items-center justify-center overflow-hidden">
              <video ref={videoRef} className={`w-full h-full object-cover ${isScanning ? '' : 'hidden'}`} autoPlay muted playsInline />
              {capturedImage && !isScanning && (
                <Image src={capturedImage} alt="Captured barcode" layout="fill" objectFit="contain" />
              )}
              {!isScanning && !capturedImage && (
                <div className="text-center text-muted-foreground">
                  <Camera className="size-16 mx-auto" />
                  <p>Camera is off</p>
                </div>
              )}
              {isScanning && (
                <div className="absolute inset-0 z-10 flex items-center justify-center">
                  <div className="w-2/3 h-1/2 border-4 border-dashed border-primary rounded-lg" />
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
              <Button onClick={startScanner} className="w-full">
                <Camera className="mr-2" /> Start Scanning
              </Button>
            ) : (
              <Button onClick={captureAndScan} className="w-full">
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
            <Card className="mt-4 w-full">
                <CardHeader>
                <CardTitle className="font-headline text-center">Detected Barcode</CardTitle>
                </CardHeader>
                <CardContent>
                <p className="text-center font-mono text-lg bg-muted p-2 rounded-md">{scannedData}</p>
                </CardContent>
            </Card>
        )}

        {error && !isLoading && (
          <Alert variant="destructive" className="mt-4">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {student && !isLoading && (
          <Card className="mt-4 w-full">
            <CardHeader className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <CardTitle className="font-headline">Student Identified</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={student.avatarUrl} alt={student.name} data-ai-hint="student portrait" />
                  <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xl font-semibold">{student.name}</p>
                  <p className="text-muted-foreground font-code">Roll: {student.rollNo}</p>
                  <p className="text-muted-foreground">Branch: {student.branch}</p>
                  <p className="text-muted-foreground">Year: {student.year}, Section: {student.section}</p>
                  <p className="text-sm text-muted-foreground font-mono">ID: {student.barcode}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
