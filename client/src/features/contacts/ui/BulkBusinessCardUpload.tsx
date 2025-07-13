import React, { useCallback, useState } from 'react';
import { Upload, X, AlertCircle, CheckCircle, Loader2, FileImage } from 'lucide-react';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';

interface UploadedFile {
  file: File;
  preview?: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  contactId?: number;
}

interface BulkBusinessCardUploadProps {
  onUpload: (file: File, contactData?: { event_id?: number; full_name?: string }) => Promise<{ id: number }>;
  eventId?: number;
  className?: string;
  onComplete?: (results: { success: number; failed: number; total: number }) => void;
}

export function BulkBusinessCardUpload({
  onUpload,
  eventId,
  className = '',
  onComplete,
}: BulkBusinessCardUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Handle drop event
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  // Handle file selection
  const handleFiles = useCallback((files: FileList) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    const newFiles: UploadedFile[] = [];
    
    Array.from(files).forEach((file) => {
      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        newFiles.push({
          file,
          status: 'error',
          error: 'Invalid file type. Please use JPEG, PNG, GIF, or WebP.',
        });
        return;
      }

      // Validate file size
      if (file.size > maxSize) {
        newFiles.push({
          file,
          status: 'error',
          error: 'File too large. Maximum size is 10MB.',
        });
        return;
      }

      // Create preview
      const reader = new FileReader();
      const uploadedFile: UploadedFile = {
        file,
        status: 'pending',
      };
      
      reader.onload = (e) => {
        uploadedFile.preview = e.target?.result as string;
        setUploadedFiles(prev => [...prev.filter(f => f.file !== file), uploadedFile]);
      };
      reader.readAsDataURL(file);
      
      newFiles.push(uploadedFile);
    });

    setUploadedFiles(prev => [...prev, ...newFiles]);
  }, []);

  // Handle file input change
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  // Remove a file from the list
  const removeFile = (fileToRemove: File) => {
    setUploadedFiles(prev => prev.filter(f => f.file !== fileToRemove));
  };

  // Process all files
  const handleBulkUpload = async () => {
    const pendingFiles = uploadedFiles.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setIsProcessing(true);
    let successCount = 0;
    let failedCount = 0;

    for (const uploadedFile of pendingFiles) {
      // Update status to uploading
      setUploadedFiles(prev => 
        prev.map(f => 
          f.file === uploadedFile.file 
            ? { ...f, status: 'uploading' as const }
            : f
        )
      );

      try {
        const result = await onUpload(uploadedFile.file, { event_id: eventId });
        
        // Update status to completed
        setUploadedFiles(prev => 
          prev.map(f => 
            f.file === uploadedFile.file 
              ? { ...f, status: 'completed' as const, contactId: result.id }
              : f
          )
        );
        successCount++;
      } catch (error: any) {
        // Update status to error
        setUploadedFiles(prev => 
          prev.map(f => 
            f.file === uploadedFile.file 
              ? { 
                  ...f, 
                  status: 'error' as const, 
                  error: error?.response?.data?.error || error?.message || 'Upload failed'
                }
              : f
          )
        );
        failedCount++;
      }
    }

    setIsProcessing(false);
    onComplete?.({
      success: successCount,
      failed: failedCount,
      total: pendingFiles.length,
    });
  };

  // Clear all files
  const clearAll = () => {
    setUploadedFiles([]);
  };

  const pendingFiles = uploadedFiles.filter(f => f.status === 'pending');
  const completedFiles = uploadedFiles.filter(f => f.status === 'completed');
  const errorFiles = uploadedFiles.filter(f => f.status === 'error');

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Bulk Upload Business Cards</h3>
          <p className="text-sm text-gray-600">
            Upload multiple business card images to automatically extract contact information
          </p>
        </div>

        {/* Upload Area */}
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
            ${isProcessing ? 'opacity-50 pointer-events-none' : 'hover:border-gray-400'}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept="image/*"
            onChange={handleFileInput}
            disabled={isProcessing}
          />
          
          <div className="space-y-3">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div>
              <p className="text-base font-medium">Drop business cards here</p>
              <p className="text-sm text-gray-500">or click to browse (multiple files supported)</p>
            </div>
            <p className="text-xs text-gray-400">
              Supports: JPEG, PNG, GIF, WebP (max 10MB each)
            </p>
          </div>
        </div>

        {/* File List */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">
                Files ({uploadedFiles.length})
                {completedFiles.length > 0 && (
                  <span className="ml-2 text-sm text-green-600">
                    {completedFiles.length} completed
                  </span>
                )}
                {errorFiles.length > 0 && (
                  <span className="ml-2 text-sm text-red-600">
                    {errorFiles.length} failed
                  </span>
                )}
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                disabled={isProcessing}
              >
                Clear All
              </Button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {uploadedFiles.map((uploadedFile, index) => (
                <div
                  key={`${uploadedFile.file.name}-${index}`}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  {/* Preview */}
                  <div className="flex-shrink-0">
                    {uploadedFile.preview ? (
                      <img
                        src={uploadedFile.preview}
                        alt={uploadedFile.file.name}
                        className="w-16 h-16 object-cover rounded border"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center">
                        <FileImage className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {uploadedFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(uploadedFile.file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                    {uploadedFile.contactId && (
                      <p className="text-xs text-blue-600">
                        Contact ID: {uploadedFile.contactId}
                      </p>
                    )}
                  </div>

                  {/* Status */}
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {uploadedFile.status === 'pending' && (
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    )}
                    {uploadedFile.status === 'uploading' && (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    )}
                    {uploadedFile.status === 'completed' && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {uploadedFile.status === 'error' && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    
                    {uploadedFile.status !== 'uploading' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(uploadedFile.file)}
                        disabled={isProcessing}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Error Messages */}
            {errorFiles.map((file, index) => 
              file.error && (
                <div key={`error-${index}`} className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-700">
                    {file.file.name}: {file.error}
                  </span>
                </div>
              )
            )}

            {/* Actions */}
            {pendingFiles.length > 0 && (
              <div className="flex gap-2">
                <Button
                  onClick={handleBulkUpload}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing {pendingFiles.findIndex(f => f.status === 'uploading') + 1} of {pendingFiles.length}...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload {pendingFiles.length} Files
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}