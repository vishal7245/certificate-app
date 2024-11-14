// temlates/new/page.tsx
"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TemplateCanvas } from "@/app/components/TemplateCanvas";
import { Navbar } from "@/app/components/Navbar";
import { Template, Placeholder } from "@/app/types";

export default function TemplatesPageNew() {
  const router = useRouter();
  const [template, setTemplate] = useState<Partial<Template>>({
    name: "",
    placeholders: [],
  });
  const [uploading, setUploading] = useState(false); // For upload state feedback

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file.");
      return;
    }
  
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB.");
      return;
    }
  
    setUploading(true);
  
    const formData = new FormData();
    formData.append("image", file);
  
    try {
      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to upload image:", errorText);
        alert("Failed to upload image");
        setUploading(false);
        return;
      }
  
      const { imageUrl } = await response.json();
      setTemplate((prev) => ({
        ...prev,
        imageUrl,
      }));
      alert("Image uploaded successfully!");
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Error uploading image");
    } finally {
      setUploading(false);
    }
  };
  
  
      


  const handleAddPlaceholder = () => {
    const name = prompt("Enter placeholder name:");
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
      let name: string | null | undefined = template.name;
      if (!name) {
        name = prompt("Enter template name:");
        if (!name) return; // Exit if user cancels or leaves it blank
      }

      const templateData = { ...template, name };

      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to save template:", errorText);
        throw new Error(`Failed to save template: ${errorText}`);
      }

      alert("Template saved successfully!");
      router.push("/templates");
    } catch (error) {
      console.error("Error saving template:", error);
      alert("Failed to save template");
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
                <button
                  onClick={() => router.push("/templates")}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Cancel
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
              {uploading && <p className="text-blue-500 mt-2">Uploading...</p>}
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
