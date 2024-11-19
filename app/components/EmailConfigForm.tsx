'use client';

import { useState, useEffect } from 'react';
import { FeedbackDialog } from '@/app/components/FeedbackDialog';

export function EmailConfigForm() {
  const [emailConfig, setEmailConfig] = useState({ defaultSubject: '', defaultMessage: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [dialogMessage, setDialogMessage] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch email configuration
  useEffect(() => {
    const fetchEmailConfig = async () => {
      try {
        const response = await fetch('/api/email-config');
        if (!response.ok) {
          throw new Error('Failed to fetch email configuration');
        }
        const data = await response.json();
        setEmailConfig(data);
      } catch (error) {
        console.error('Error fetching email configuration:', error);
        setDialogMessage('Failed to load email configuration.');
        setIsDialogOpen(true);
      }
    };

    fetchEmailConfig();
  }, []);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/email-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailConfig),
      });

      if (!response.ok) {
        throw new Error('Failed to update email configuration');
      }

      setDialogMessage('Email configuration updated successfully!');
    } catch (error) {
      console.error('Error updating email configuration:', error);
      setDialogMessage('Failed to update email configuration.');
    } finally {
      setIsLoading(false);
      setIsDialogOpen(true);
    }
  };

  return (
    <div className="bg-white shadow-md rounded p-6">
      <h2 className="text-lg font-semibold mb-4">Email Configuration</h2>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Subject
        </label>
        <input
          type="text"
          value={emailConfig.defaultSubject}
          onChange={(e) =>
            setEmailConfig((prev) => ({ ...prev, defaultSubject: e.target.value }))
          }
          className="w-full p-2 border border-gray-300 rounded"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Message
        </label>
        <textarea
          value={emailConfig.defaultMessage}
          onChange={(e) =>
            setEmailConfig((prev) => ({ ...prev, defaultMessage: e.target.value }))
          }
          className="w-full p-2 border border-gray-300 rounded"
          rows={5}
        ></textarea>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Feedback dialog */}
      <FeedbackDialog 
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        message={dialogMessage}
      />
    </div>
  );
}
