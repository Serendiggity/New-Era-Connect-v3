import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BulkBusinessCardUpload, useUploadBusinessCard } from '../../features/contacts';
import { Button } from '../../shared/ui';

export default function BulkUploadPage() {
  const navigate = useNavigate();
  const uploadBusinessCard = useUploadBusinessCard();
  const [uploadResults, setUploadResults] = useState<{
    success: number;
    failed: number;
    total: number;
  } | null>(null);

  const handleUpload = async (file: File, contactData?: { event_id?: number; full_name?: string }) => {
    const result = await uploadBusinessCard.mutateAsync({ file, contactData });
    return { id: result.contact.id };
  };

  const handleComplete = (results: { success: number; failed: number; total: number }) => {
    setUploadResults(results);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/contacts')}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ← Back to Contacts
        </Button>
        <h1 className="text-3xl font-bold">Bulk Upload Business Cards</h1>
      </div>

      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="font-medium text-blue-900 mb-2">How it works:</h2>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Select multiple business card images (JPEG, PNG, GIF, WebP)</li>
            <li>• Each image will be processed with OCR to extract contact information</li>
            <li>• AI will automatically classify names, titles, companies, and contact details</li>
            <li>• Successfully processed contacts will appear in your contacts list</li>
          </ul>
        </div>

        <BulkBusinessCardUpload
          onUpload={handleUpload}
          onComplete={handleComplete}
        />

        {uploadResults && (
          <div className="bg-white border rounded-lg p-6">
            <h3 className="font-semibold mb-4">Upload Results</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{uploadResults.success}</div>
                <div className="text-sm text-green-700">Successful</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{uploadResults.failed}</div>
                <div className="text-sm text-red-700">Failed</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{uploadResults.total}</div>
                <div className="text-sm text-gray-700">Total</div>
              </div>
            </div>
            
            {uploadResults.success > 0 && (
              <div className="mt-4 text-center">
                <Button onClick={() => navigate('/contacts')}>
                  View Contacts
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}