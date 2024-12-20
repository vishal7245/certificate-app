'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Trash2, Check } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed?: string;
  expiresAt?: string;
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [showNewKey, setShowNewKey] = useState<string | null>(null);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const res = await fetch('/api/me');
        if (!res.ok) {
          router.push('/templates');
          return;
        }
        
        const user = await res.json();
        if (!user.is_api_enabled) {
          console.log(user);
          router.push('/templates');
          return;
        }
        
         // Only fetch API keys if user is authorized
        await fetchApiKeys();
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking access:', error);
        router.push('/templates');
      }
    };
     checkAccess();
  }, [router]);

  

  const fetchApiKeys = async () => {
    const res = await fetch('/api/api-keys');
    if (res.ok) {
      const data = await res.json();
      setApiKeys(data);
    }
  };

  const createApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newKeyName }),
    });

    if (res.ok) {
      const data = await res.json();
      setShowNewKey(data.key);
      setNewKeyName('');
      fetchApiKeys();
    }
  };

  const deleteApiKey = async (id: string) => {
    if (confirm('Are you sure you want to delete this API key?')) {
      const res = await fetch(`/api/api-keys/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchApiKeys();
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000); 
  };

  if (isLoading) {
    return <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">Loading...</div>;
  }

  return (
    <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">API Keys</h1>
        
        <form onSubmit={createApiKey} className="mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="API Key Name"
              className="flex-1 p-2 border rounded"
              required
            />
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Generate New API Key
            </button>
          </div>
        </form>

        {showNewKey && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded">
            <p className="text-green-800 font-semibold">New API Key Generated:</p>
            <div className="flex items-center gap-2 mt-2">
              <code className="bg-white p-2 rounded flex-1">{showNewKey}</code>
              <button
                onClick={() => copyToClipboard(showNewKey)}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                {copySuccess ? (
                  <Check size={20} className="text-green-500" />
                ) : (
                  <Copy size={20} />
                )}
              </button>
            </div>
            <p className="text-sm text-red-600 mt-2">
              Make sure to copy this key now. You won't be able to see it again!
            </p>
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Created</th>
                <th className="px-6 py-3 text-left">Last Used</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map((key) => (
                <tr key={key.id} className="border-b">
                  <td className="px-6 py-4">{key.name}</td>
                  <td className="px-6 py-4">
                    {new Date(key.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    {key.lastUsed
                      ? new Date(key.lastUsed).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => deleteApiKey(key.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}