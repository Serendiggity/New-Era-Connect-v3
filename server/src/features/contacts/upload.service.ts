import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import crypto from 'crypto';
import path from 'path';

// Environment variables validation
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// File validation schema
export const FileUploadSchema = z.object({
  filename: z.string().min(1),
  mimetype: z.string().regex(/^image\/(jpeg|png|jpg|gif|webp)$/i),
  size: z.number().max(10 * 1024 * 1024), // 10MB max
});

export interface UploadedFile {
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface UploadResult {
  url: string;
  filename: string;
  originalName: string;
  size: number;
  bucket: string;
  path: string;
}

export class UploadService {
  private readonly BUCKET_NAME = 'business-cards';
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp'
  ];

  /**
   * Validate uploaded file
   */
  validateFile(file: UploadedFile): void {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum limit of ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    // Check mime type
    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
      throw new Error(`File type ${file.mimetype} is not allowed. Supported types: ${this.ALLOWED_MIME_TYPES.join(', ')}`);
    }

    // Check if file has content
    if (file.size === 0 || !file.buffer || file.buffer.length === 0) {
      throw new Error('File is empty or corrupted');
    }

    // Validate the file structure using schema
    FileUploadSchema.parse({
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
    });
  }

  /**
   * Generate a unique filename for storage
   */
  generateFilename(originalName: string): string {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(originalName).toLowerCase();
    
    return `${timestamp}-${randomString}${extension}`;
  }

  /**
   * Upload file to Supabase Storage
   */
  async uploadFile(file: UploadedFile): Promise<UploadResult> {
    // Validate file first
    this.validateFile(file);

    const filename = this.generateFilename(file.originalName);
    const filePath = `uploads/${filename}`;

    try {
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          duplex: 'half',
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL for uploaded file');
      }

      return {
        url: urlData.publicUrl,
        filename,
        originalName: file.originalName,
        size: file.size,
        bucket: this.BUCKET_NAME,
        path: filePath,
      };
    } catch (error) {
      console.error('File upload failed:', error);
      throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete file from Supabase Storage
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        console.error('File deletion error:', error);
        throw new Error(`Failed to delete file: ${error.message}`);
      }
    } catch (error) {
      console.error('File deletion failed:', error);
      throw new Error(`Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get file buffer from Supabase Storage URL
   */
  async getFileBuffer(url: string): Promise<Buffer> {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('Failed to get file buffer:', error);
      throw new Error(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate image file by checking magic numbers
   */
  validateImageFile(buffer: Buffer): boolean {
    if (!buffer || buffer.length < 4) {
      return false;
    }

    // Check for image magic numbers
    const signatures = {
      jpg: [0xFF, 0xD8, 0xFF],
      png: [0x89, 0x50, 0x4E, 0x47],
      gif: [0x47, 0x49, 0x46, 0x38],
      webp: [0x52, 0x49, 0x46, 0x46], // First 4 bytes of RIFF
    };

    for (const [format, signature] of Object.entries(signatures)) {
      if (signature.every((byte, index) => buffer[index] === byte)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get file info without downloading the entire file
   */
  async getFileInfo(url: string): Promise<{ size: number; contentType: string }> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      
      if (!response.ok) {
        throw new Error(`Failed to get file info: ${response.status} ${response.statusText}`);
      }

      const contentLength = response.headers.get('content-length');
      const contentType = response.headers.get('content-type');

      return {
        size: contentLength ? parseInt(contentLength, 10) : 0,
        contentType: contentType || 'application/octet-stream',
      };
    } catch (error) {
      console.error('Failed to get file info:', error);
      throw new Error(`Failed to get file info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Ensure the storage bucket exists and is properly configured
   */
  async ensureBucketExists(): Promise<void> {
    try {
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('Failed to list buckets:', listError);
        return;
      }

      const bucketExists = buckets?.some(bucket => bucket.name === this.BUCKET_NAME);
      
      if (!bucketExists) {
        const { error: createError } = await supabase.storage.createBucket(this.BUCKET_NAME, {
          public: true,
          allowedMimeTypes: this.ALLOWED_MIME_TYPES,
          fileSizeLimit: this.MAX_FILE_SIZE,
        });

        if (createError) {
          console.error('Failed to create bucket:', createError);
        } else {
          console.log(`Created storage bucket: ${this.BUCKET_NAME}`);
        }
      }
    } catch (error) {
      console.error('Error ensuring bucket exists:', error);
    }
  }
}

// Export singleton instance
export const uploadService = new UploadService();