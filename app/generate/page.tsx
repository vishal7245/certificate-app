// generate/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Template } from '@/app/types';
import { Navbar } from '@/app/components/Navbar';
import { FeedbackDialog } from '@/app/components/FeedbackDialog';



export default function GeneratePage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dialogMessage, setDialogMessage] = useState<string | null>(null); // To store dialog message
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);


  // Check if the user is authenticated
  useEffect(() => {
    fetch('/api/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) {
          router.push('/login');
        } else {
          setUser(data);
        }
      });
  }, []);

  // Fetch templates when the user is authenticated
  useEffect(() => {
    if (user) {
      const fetchTemplates = async () => {
        try {
          const response = await fetch('/api/templates');
          if (!response.ok) {
            throw new Error('Failed to fetch templates');
          }
          const data: Template[] = await response.json();
          setTemplates(data);
        } catch (error) {
          console.error('Error fetching templates:', error);
          setDialogMessage('Failed to load templates.');
        }
      };

      fetchTemplates();
    }
  }, [user]);

  if (!user) return null;

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
    }
  };

  const handleGenerate = async () => {
    try {
      if (csvFile && selectedTemplate) {
        setIsLoading(true);
        const formData = new FormData();
        formData.append('csv', csvFile);
        formData.append('templateId', selectedTemplate.id);
  
        const response = await fetch('/api/generate-certificates', {
          method: 'POST',
          body: formData,
        });
  
        if (!response.ok) {
          throw new Error('Failed to generate certificates');
        }
  
        setDialogMessage('Certificates generated successfully!');
        setIsDialogOpen(true); // Open the dialog
      }
    } catch (error) {
      console.error('Error generating certificates:', error);
      setDialogMessage('Failed to generate certificates.');
      setIsDialogOpen(true); // Open the dialog on error too
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Generate Certificates</h1>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Template
            </label>
            <select
              onChange={(e) => {
                const template = templates.find((t) => t.id === e.target.value);
                setSelectedTemplate(template || null);
              }}
              className="w-full p-2 border border-gray-300 text-black rounded mb-4"
            >
              <option value="">Select Template</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvUpload}
              className="mt-1 block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
            />
            <p className="text-sm text-gray-600 mt-2">
              If your CSV contains an <strong>Email</strong> column, certificates will be sent to those addresses.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleGenerate}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              disabled={!selectedTemplate || !csvFile || isLoading}
            >
              {isLoading ? 'Generating...' : 'Generate Certificates'}
            </button>
          </div>
        </div>
        {isLoading && (
          <div className="fixed inset-0 bg-gray-700 bg-opacity-50 flex items-center justify-center">
            <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-white" role="status">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        )}
      </main>

      {/* Dialog for feedback messages */}
      <FeedbackDialog 
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        message={dialogMessage}
      />
    </div>
  );
}