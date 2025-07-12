import React, { useCallback, useState } from 'react';
import { Upload, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';

interface UploadedFile {
  file: File;
  preview?: string;
}

interface BusinessCardUploadProps {
  onUpload: (file: File, contactData?: { event_id?: number; full_name?: string }) => Promise<void>;
  eventId?: number;
  isUploading?: boolean;
  error?: string;
  success?: boolean;
  className?: string;
}

export function BusinessCardUpload({
  onUpload,
  eventId,
  isUploading = false,
  error,
  success = false,
  className = '',
}: BusinessCardUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [contactName, setContactName] = useState('');

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

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  // Handle file selection
  const handleFiles = useCallback((files: FileList) => {
    const file = files[0];
    
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedFile({
        file,
        preview: e.target?.result as string,
      });
    };
    reader.readAsDataURL(file);
  }, []);

  // Handle file input change
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  // Handle upload submission
  const handleSubmit = async () => {
    if (!uploadedFile) return;

    const contactData = {
      event_id: eventId,
      full_name: contactName.trim() || undefined,
    };

    await onUpload(uploadedFile.file, contactData);
  };

  // Reset upload state
  const handleReset = () => {
    setUploadedFile(null);
    setContactName('');
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Upload Business Card</h3>
          <p className="text-sm text-gray-600">
            Upload a photo of a business card to automatically extract contact information
          </p>
        </div>

        {/* Upload Area */}
        {!uploadedFile && (
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
              ${isUploading ? 'opacity-50 pointer-events-none' : 'hover:border-gray-400'}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept="image/*"
              onChange={handleFileInput}
              disabled={isUploading}
            />
            
            <div className="space-y-3">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div>
                <p className="text-base font-medium">Drop your business card here</p>
                <p className="text-sm text-gray-500">or click to browse</p>
              </div>
              <p className="text-xs text-gray-400">
                Supports: JPEG, PNG, GIF, WebP (max 10MB)
              </p>
            </div>
          </div>
        )}

        {/* File Preview */}
        {uploadedFile && (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={uploadedFile.preview}
                alt="Business card preview"
                className="w-full h-48 object-contain bg-gray-50 rounded-lg border"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2"
                onClick={handleReset}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Contact Name (Optional)
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Enter contact name if known"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isUploading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  OCR will automatically extract this information, but you can provide it if known
                </p>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload & Process
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-700">
              Business card uploaded successfully! Processing OCR...
            </span>
          </div>
        )}

        {/* Processing Status */}
        {isUploading && (
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading and processing your business card...
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}