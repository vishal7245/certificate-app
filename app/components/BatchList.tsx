'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
  } from '@/components/ui/dialog';
import { format } from 'date-fns';

interface Batch {
  id: string;
  name: string;
  createdAt: string;
  _count: {
    certificates: number;
  };
}

interface Certificate {
  id: string;
  uniqueIdentifier: string;
  generatedImageUrl: string;
  data: Record<string, string>;
  createdAt: string;
}

export function BatchList() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCertificatesLoading, setIsCertificatesLoading] = useState(false); // Add this new state
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [certPage, setCertPage] = useState(1);
  const [pagination, setPagination] = useState<{
    total: number;
    pageSize: number;
    currentPage: number;
    totalPages: number;
  } | null>(null);
  const [certPagination, setCertPagination] = useState<{
    total: number;
    pageSize: number;
    currentPage: number;
    totalPages: number;
  } | null>(null);

  useEffect(() => {
    fetchBatches(currentPage);
  }, [currentPage]);

  useEffect(() => {
    if (selectedBatch && isDialogOpen) {
      fetchCertificates(certPage);
    }
  }, [selectedBatch, certPage, isDialogOpen]);

  const fetchBatches = async (page: number) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/batches?page=${page}`);
      if (!response.ok) throw new Error('Failed to fetch batches');
      const data = await response.json();
      setBatches(data.batches);
      setPagination({
        total: data.total,
        pageSize: 10,
        currentPage: page,
        totalPages: data.pages
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load batches');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCertificates = async (page: number) => {
    if (!selectedBatch) return;
    try {
      setIsCertificatesLoading(true); // Use the new loading state
      const response = await fetch(`/api/batches/${selectedBatch.id}/certificates?page=${page}`);
      if (!response.ok) throw new Error('Failed to fetch certificates');
      const data = await response.json();
      setCertificates(data.certificates);
      setCertPagination({
        total: data.total,
        pageSize: 10,
        currentPage: page,
        totalPages: data.pages
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load certificates');
    } finally {
      setIsCertificatesLoading(false); // Clear the new loading state
    }
  };

  const PaginationControls = ({ paginationData, onPageChange, currentPageNum }: any) => {
    if (!paginationData) return null;

    return (
      <div className="mt-4 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => onPageChange(Math.max(currentPageNum - 1, 1))}
            disabled={currentPageNum === 1}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => onPageChange(Math.min(currentPageNum + 1, paginationData.totalPages))}
            disabled={currentPageNum === paginationData.totalPages}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing page <span className="font-medium">{currentPageNum}</span> of{' '}
              <span className="font-medium">{paginationData.totalPages}</span> ({paginationData.total} total)
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => onPageChange(Math.max(currentPageNum - 1, 1))}
                disabled={currentPageNum === 1}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => onPageChange(Math.min(currentPageNum + 1, paginationData.totalPages))}
                disabled={currentPageNum === paginationData.totalPages}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Certificate Batches</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Batch Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Certificates
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {batches.map((batch) => (
              <tr key={batch.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(batch.createdAt), 'MMM d, yyyy HH:mm')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {batch.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {batch._count.certificates}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button
                    onClick={() => {
                      setSelectedBatch(batch);
                      setCertPage(1);
                      setIsDialogOpen(true);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View Certificates
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!isLoading && !error && batches.length > 0 && (
        <PaginationControls 
          paginationData={pagination} 
          onPageChange={setCurrentPage}
          currentPageNum={currentPage}
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedBatch?.name} - Certificates
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4">
          {isCertificatesLoading ? ( // Use the new loading state for certificates
              <div className="animate-pulse">
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {certificates.map((cert) => (
                      <tr key={cert.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(cert.createdAt), 'MMM d, yyyy HH:mm')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {cert.uniqueIdentifier}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {cert.data.Email || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <a
                            href={cert.generatedImageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Certificate
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            )}

            {certPagination && certificates.length > 0 && (
              <PaginationControls 
                paginationData={certPagination}
                onPageChange={setCertPage}
                currentPageNum={certPage}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}