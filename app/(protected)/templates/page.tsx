'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Template } from '@/app/types';

export default function TemplatesPage() {
  const [user, setUser] = useState<any>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Check if the user is authenticated
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

  useEffect(() => {
    if (user) {
      // Fetch templates for the authenticated user
      fetch('/api/templates')
        .then((res) => res.json())
        .then(setTemplates)
        .catch((err) => {
          console.error('Error fetching templates:', err);
          alert('Failed to load templates');
        });
    }
  }, [user]);

  if (!user) return null; // or a loading indicator

  const handleDelete = async (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      const res = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== templateId));
      } else {
        alert('Failed to delete template');
      }
    }
  };

  return (
    
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">My Templates</h1>
            <Link href="/templates/new">
              <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                Create New Template
              </button>
            </Link>
          </div>
          {templates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <div key={template.id} className="bg-white p-4 rounded shadow">
                  <img
                    src={template.imageUrl}
                    alt={template.name}
                    className="w-full h-48 object-cover rounded"
                  />
                  <h2 className="text-lg text-gray-600 font-semibold mt-2">{template.name}</h2>
                  <p className="text-gray-600">
                    Placeholders: {template.placeholders.length}
                  </p>
                  <div className="mt-4 flex space-x-2">
                    <Link href={`/templates/${template.id}/edit`}>
                      <button className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
                        Edit
                      </button>
                    </Link>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-700">You have no templates yet.</p>
          )}
        </div>
      </main>
    
  );
}
