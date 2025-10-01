/**
 * Image compression utilities for optimizing file sizes before upload
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeKB?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  dimensions: {
    original: { width: number; height: number };
    compressed: { width: number; height: number };
  };
}

/**
 * Compress an image file with advanced options
 */
export const compressImage = async (
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> => {
  const {
    maxWidth = 400,
    maxHeight = 400,
    quality = 0.8,
    maxSizeKB = 500, // 500KB target
    format = 'jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      try {
        const originalWidth = img.width;
        const originalHeight = img.height;

        // Calculate new dimensions maintaining aspect ratio
        const { width, height } = calculateDimensions(
          originalWidth,
          originalHeight,
          maxWidth,
          maxHeight
        );

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw the image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with specified format
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas to Blob conversion failed'));
              return;
            }

            // Check if we need further compression
            const sizeKB = blob.size / 1024;
            
            if (sizeKB > maxSizeKB && quality > 0.1) {
              // Recursively compress with lower quality
              compressImage(file, {
                ...options,
                quality: Math.max(0.1, quality - 0.1)
              }).then(resolve).catch(reject);
              return;
            }

            // Create compressed file
            const compressedFile = new File([blob], file.name, {
              type: `image/${format}`,
              lastModified: Date.now(),
            });

            const result: CompressionResult = {
              file: compressedFile,
              originalSize: file.size,
              compressedSize: compressedFile.size,
              compressionRatio: (1 - compressedFile.size / file.size) * 100,
              dimensions: {
                original: { width: originalWidth, height: originalHeight },
                compressed: { width, height }
              }
            };

            resolve(result);
          },
          `image/${format}`,
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Image loading failed'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Calculate new dimensions maintaining aspect ratio
 */
const calculateDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } => {
  let width = originalWidth;
  let height = originalHeight;

  // Scale down if width exceeds maxWidth
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }

  // Scale down if height exceeds maxHeight
  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }

  return { width: Math.round(width), height: Math.round(height) };
};

/**
 * Validate image file before compression
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'Please select an image file.' };
  }

  // Check file size (before compression)
  const maxSizeInMB = 20; // 20MB limit before compression
  if (file.size > maxSizeInMB * 1024 * 1024) {
    return { 
      valid: false, 
      error: `Please select an image smaller than ${maxSizeInMB}MB.` 
    };
  }

  return { valid: true };
};

/**
 * Get file size in human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Default compression options for avatars
 */
export const AVATAR_COMPRESSION_OPTIONS: CompressionOptions = {
  maxWidth: 400,
  maxHeight: 400,
  quality: 0.8,
  maxSizeKB: 300, // 300KB target for avatars
  format: 'jpeg'
};

/**
 * Default compression options for general images
 */
export const GENERAL_IMAGE_COMPRESSION_OPTIONS: CompressionOptions = {
  maxWidth: 800,
  maxHeight: 600,
  quality: 0.85,
  maxSizeKB: 1000, // 1MB target for general images
  format: 'jpeg'
};
