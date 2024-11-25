'use client';

import { useEffect,useState } from 'react';
import { useRouter } from 'next/navigation';
import { TokenManagement } from '../../components/TokenManagement';

export default function Dashboard() {
 const router = useRouter();
 const [isLoading, setIsLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [user, setUser] = useState<any>(null);

  useEffect(() => {
   const checkAdmin = async () => {
     try {
       setIsLoading(true);
       const response = await fetch('/api/me');
       
       if (!response.ok) {
         throw new Error('Authentication required');
       }
        const data = await response.json();
       if (!data && !data.is_admin) {
         router.push('/login');
         return;
       }
        setUser(data);
     } catch (err) {
       setError(err instanceof Error ? err.message : 'Failed to authenticate');
       router.push('/login');
     } finally {
       setIsLoading(false);
     }
   };
    checkAdmin();
 }, [router]);
  if (isLoading) {
   return (
     <div className="flex justify-center items-center min-h-screen">
       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
     </div>
   );
 }
  if (error) {
   return (
     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
       <div className="text-red-600">
         {error}
       </div>
     </div>
   );
 }
  if (!user?.is_admin) {
   return null; // Router will handle redirect
 }
  return (
   <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
     <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
     <div className="flex flex-col space-y-6">
       <div>
         <TokenManagement />
       </div>
     </div>
   </div>
 );
}