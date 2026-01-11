import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 이미지를 Supabase Storage에 업로드
 * @param uri - 로컬 이미지 URI
 * @param bucket - 스토리지 버킷 이름 (기본: 'transaction-images')
 * @returns 업로드된 이미지의 공개 URL
 */
export async function uploadImage(
  uri: string,
  bucket: string = 'transaction-images'
): Promise<string> {
  try {
    // URI에서 파일 정보 추출
    const filename = uri.split('/').pop() || 'image.jpg';
    const timestamp = Date.now();
    const path = `${timestamp}-${filename}`;

    // Blob으로 변환 (React Native 환경)
    const response = await fetch(uri);
    const blob = await response.blob();

    // Supabase Storage에 업로드
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, blob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.error('Supabase 업로드 에러:', error);
      throw new Error(`이미지 업로드 실패: ${error.message}`);
    }

    // 공개 URL 생성
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } catch (error: any) {
    console.error('이미지 업로드 실패:', error);
    throw error;
  }
}

/**
 * 이미지 삭제
 * @param url - 삭제할 이미지의 공개 URL
 * @param bucket - 스토리지 버킷 이름
 */
export async function deleteImage(
  url: string,
  bucket: string = 'transaction-images'
): Promise<void> {
  try {
    // URL에서 파일 경로 추출
    const path = url.split('/').pop();
    if (!path) {
      throw new Error('잘못된 URL 형식입니다');
    }

    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      console.error('Supabase 삭제 에러:', error);
      throw new Error(`이미지 삭제 실패: ${error.message}`);
    }
  } catch (error: any) {
    console.error('이미지 삭제 실패:', error);
    throw error;
  }
}

/**
 * 여러 이미지를 한 번에 업로드
 * @param uris - 로컬 이미지 URI 배열
 * @param bucket - 스토리지 버킷 이름
 * @returns 업로드된 이미지들의 공개 URL 배열
 */
export async function uploadImages(
  uris: string[],
  bucket: string = 'transaction-images'
): Promise<string[]> {
  const uploadPromises = uris.map(uri => uploadImage(uri, bucket));
  return Promise.all(uploadPromises);
}
