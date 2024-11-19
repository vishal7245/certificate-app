import { Navbar } from '@/app/components/Navbar';
import { EmailConfigForm } from '@/app/components/EmailConfigForm';

export default function EmailConfigPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Email Settings</h1>
          <EmailConfigForm />
        </div>
      </main>
    </div>
  );
}
