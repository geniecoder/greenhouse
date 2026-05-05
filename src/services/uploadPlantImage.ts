import { UPLOAD_IMAGE_URL } from '@/src/config/greenhouseLive';

export const PHOTO_UPLOAD_FORM_FIELD = 'image';

export type UploadImageSuccess = {
  success: true;
  message: string;
  fileName: string;
  fileSize: number;
};

export type UploadImageErrorBody = {
  success: false;
  message: string;
};

export type UploadImageResponse = UploadImageSuccess | UploadImageErrorBody;

function parseUploadImageResponse(json: unknown): UploadImageResponse {
  if (!json || typeof json !== 'object') {
    return { success: false, message: 'Invalid response' };
  }
  const o = json as Record<string, unknown>;
  if (o.success === true) {
    const fileName = o.fileName;
    const fileSize = o.fileSize;
    if (typeof fileName !== 'string') {
      return { success: false, message: 'Invalid response: missing fileName' };
    }
    const size = typeof fileSize === 'number' ? fileSize : Number(fileSize);
    if (!Number.isFinite(size)) {
      return { success: false, message: 'Invalid response: missing fileSize' };
    }
    return {
      success: true,
      message: typeof o.message === 'string' ? o.message : '',
      fileName,
      fileSize: size,
    };
  }
  if (o.success === false) {
    return { success: false, message: typeof o.message === 'string' ? o.message : 'Upload failed' };
  }
  return { success: false, message: 'Unexpected response' };
}

export async function postPlantImageUpload(fileUri: string): Promise<UploadImageResponse> {
  const form = new FormData();
  form.append(PHOTO_UPLOAD_FORM_FIELD, {
    uri: fileUri,
    name: 'plant.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);

  const res = await fetch(UPLOAD_IMAGE_URL, {
    method: 'POST',
    body: form,
  });

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return { success: false, message: `Upload HTTP ${res.status}: not JSON` };
  }

  const parsed = parseUploadImageResponse(json);
  if (!res.ok && parsed.success === false) {
    return { success: false, message: parsed.message || `Upload HTTP ${res.status}` };
  }
  return parsed;
}
