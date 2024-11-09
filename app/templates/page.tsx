'use client';

import { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TemplateCanvas } from '../components/TemplateCanvas';
import { Navbar } from '../components/Navbar';
import { Template, Placeholder } from '@/app/types';

export default function TemplatesPage() {
  const [template, setTemplate] = useState<Partial<Template>>({
    name: '',
    placeholders: [],
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setTemplate((prev) => ({
          ...prev,
          imageUrl: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddPlaceholder = () => {
    const name = prompt('Enter placeholder name:');
    if (name) {
      const newPlaceholder: Placeholder = {
        id: Math.random().toString(),
        name,
        position: { x: 50, y: 50 },
      };
      setTemplate((prev) => ({
        ...prev,
        placeholders: [...(prev.placeholders || []), newPlaceholder],
      }));
    }
  };

  const handlePlaceholderMove = (id: string, position: { x: number; y: number }) => {
    setTemplate((prev) => ({
      ...prev,
      placeholders: prev.placeholders?.map((p) =>
        p.id === id ? { ...p, position } : p
      ),
    }));
  };

  const handleSave = async () => {
    try {
      // Ensure template name is set
      let name: string | null | undefined = template.name;
      if (!name) {
        name = prompt('Enter template name:');
        if (!name) return; // Exit if user clicks "Cancel" or leaves it blank
      }
  
      // Update the template data locally with the new name
      const templateData = { ...template, name };
  
      // Log template and image data for debugging
      console.log('Template data:', templateData);
      console.log('Image file:', imageFile);
  
      const formData = new FormData();
      if (imageFile) {
        formData.append('image', imageFile);
      }
      formData.append('template', JSON.stringify(templateData));
  
      const response = await fetch('/api/templates', {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to save template:', errorText);
        throw new Error(`Failed to save template: ${errorText}`);
      }
  
      alert('Template saved successfully!');
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <Navbar />
        <main className="max-w-7xl w-full mx-auto py-6 sm:px-6 lg:px-8">
          <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">Create Template</h1>
              <div className="space-x-4">
                <button
                  onClick={handleAddPlaceholder}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Add Placeholder
                </button>
                <button
                  onClick={handleSave}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Save Template
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700">
                Upload Template Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="mt-1 block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100"
              />
            </div>

            <div className="flex justify-center">
              <TemplateCanvas
                imageUrl={template.imageUrl}
                placeholders={template.placeholders || []}
                onPlaceholderMove={handlePlaceholderMove}
              />
            </div>
          </div>
        </main>
      </div>
    </DndProvider>
  );
}
