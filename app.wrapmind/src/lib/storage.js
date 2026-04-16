import { supabase } from './supabase';

const BUCKET = 'vehicle-images';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const MAX_WIDTH = 1920;
const THUMB_WIDTH = 300;

function resizeImage(file, maxWidth) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.width <= maxWidth) {
        resolve(file);
        return;
      }
      const scale = maxWidth / img.width;
      const canvas = document.createElement('canvas');
      canvas.width = maxWidth;
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Resize failed'));
          resolve(new File([blob], file.name, { type: 'image/jpeg' }));
        },
        'image/jpeg',
        0.85,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for resize'));
    };
    img.src = url;
  });
}

function dataUrlToFile(dataUrl, filename = 'capture.jpg') {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new File([arr], filename, { type: mime });
}

export function validateFile(file) {
  if (file.size > MAX_FILE_SIZE) {
    return `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum is 10MB.`;
  }
  if (!ALLOWED_TYPES.includes(file.type) && file.type !== '') {
    return `Unsupported file type. Use JPEG, PNG, WebP, or HEIC.`;
  }
  return null;
}

export async function uploadVehicleImage(fileOrDataUrl, orgId, vehicleId) {
  let file;
  if (typeof fileOrDataUrl === 'string') {
    file = dataUrlToFile(fileOrDataUrl);
  } else {
    file = fileOrDataUrl;
  }

  const validationError = validateFile(file);
  if (validationError) throw new Error(validationError);

  const resized = await resizeImage(file, MAX_WIDTH);
  const ext = 'jpg';
  const timestamp = Date.now();
  const path = `${orgId}/${vehicleId}/${timestamp}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, resized, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);

  let thumbnailUrl = null;
  try {
    const thumb = await resizeImage(file, THUMB_WIDTH);
    const thumbPath = `${orgId}/${vehicleId}/${timestamp}_thumb.${ext}`;
    const { error: thumbErr } = await supabase.storage
      .from(BUCKET)
      .upload(thumbPath, thumb, {
        contentType: 'image/jpeg',
        upsert: false,
      });
    if (!thumbErr) {
      const { data: thumbUrlData } = supabase.storage.from(BUCKET).getPublicUrl(thumbPath);
      thumbnailUrl = thumbUrlData.publicUrl;
    }
  } catch {
    // Thumbnail generation is optional — continue without it
  }

  return {
    url: urlData.publicUrl,
    thumbnailUrl,
    path,
  };
}

export async function deleteVehicleImage(path) {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw new Error(`Delete failed: ${error.message}`);
}
