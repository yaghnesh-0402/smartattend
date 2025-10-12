'use client';

import * as React from 'react';
import { collection, writeBatch } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';
import Link from 'next/link';

// Define the expected structure for a student object in the JSON
type StudentData = {
  name: string;
  rollNumber: string;
  barcode: string;
  year: number;
  section: string;
  avatarUrl: string;
};

const placeholderJson = JSON.stringify(
  [
    {
      "name": "Aarav Sharma",
      "rollNumber": "22R11A6901",
      "barcode": "22R11A6901",
      "year": 2,
      "section": "A",
      "avatarUrl": "https://picsum.photos/seed/student1/100/100"
    },
    {
      "name": "Diya Gupta",
      "rollNumber": "22R11A6904",
      "barcode": "22R11A6904",
      "year": 2,
      "section": "A",
      "avatarUrl": "https://picsum.photos/seed/student4/100/100"
    }
  ],
  null,
  2
);

export default function AdminPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [jsonData, setJsonData] = React.useState(placeholderJson);
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleUpload = async () => {
    setIsUploading(true);
    setError(null);

    let students: StudentData[];
    try {
      students = JSON.parse(jsonData);
      if (!Array.isArray(students)) {
        throw new Error('JSON data must be an array of student objects.');
      }
    } catch (e: any) {
      setError(`Invalid JSON format: ${e.message}`);
      setIsUploading(false);
      return;
    }

    if (!firestore) {
      setError("Firestore is not available. Please try again later.");
      setIsUploading(false);
      return;
    }

    try {
      const studentsRef = collection(firestore, 'students');
      const batch = writeBatch(firestore);

      students.forEach((student) => {
        // Here we could add more robust validation if needed
        if (!student.name || !student.barcode || !student.rollNumber) {
            throw new Error(`A record is missing a required field (name, barcode, rollNumber).`);
        }
        const docRef = collection(firestore, 'students').doc(); // Auto-generates an ID
        batch.set(docRef, student);
      });

      await batch.commit();

      toast({
        title: 'Upload Successful',
        description: `${students.length} student records have been added to the database.`,
      });
      setJsonData('');
    } catch (e: any) {
      console.error("Error uploading students:", e);
      setError(`Failed to upload records: ${e.message}`);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: 'Could not add student records to the database. Please check the console for errors.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Bulk Student Upload</CardTitle>
            <CardDescription>
              Paste a JSON array of student records below to add them to the database.
              Each object in the array must have: name, rollNumber, barcode, year, section, and avatarUrl.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              className="h-64 font-code text-sm"
              value={jsonData}
              onChange={(e) => setJsonData(e.target.value)}
              placeholder="Paste your JSON array here..."
              disabled={isUploading}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={handleUpload} disabled={isUploading || !jsonData.trim()} className="w-full">
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2" />
                  Upload Records
                </>
              )}
            </Button>
          </CardContent>
        </Card>
        <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-muted-foreground hover:text-primary underline">
                Back to Scanner
            </Link>
        </div>
      </div>
    </div>
  );
}
