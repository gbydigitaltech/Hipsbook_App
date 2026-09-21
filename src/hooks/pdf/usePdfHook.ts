import { useCallback, useEffect, useRef, useState } from 'react';
import { log, logError } from '../../helpers/logger';
import { Alert } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { PdfRenderProps } from '../../types/data/pdf/pdf.types';

/**
 * Handle PDF preview and download flow.
 */
export default function usePdfRender({ visible, pdfUrl }: PdfRenderProps) {
  const [localPath, setLocalPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Prevent state update after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /** Download PDF to cache and set local file path */
  const initialConfig = useCallback(async () => {
    if (!pdfUrl) return;

    if (mountedRef.current) setLoading(true);

    try {
      const res = await ReactNativeBlobUtil.config({
        fileCache: true,
        appendExt: 'pdf',
      }).fetch('GET', pdfUrl);

      const path = res.path();
      if (mountedRef.current) {
        setLocalPath(`file://${path}`);
      }
    } catch (e) {
      logError('PDF', 'PDF Download Error:', e);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [pdfUrl]);

  // Start loading PDF when viewer is visible
  useEffect(() => {
    if (!visible) return;
    initialConfig();
  }, [visible, initialConfig]);

  /** Download PDF to device Downloads folder */
  const downloadDocument = useCallback(async (url: string) => {
    try {
      await ReactNativeBlobUtil.config({
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          mime: 'application/pdf',
          description: 'กำลังดาวน์โหลดไฟล์',
          mediaScannable: true,
          title: 'document.pdf',
        },
      }).fetch('GET', url);

      Alert.alert('ดาวน์โหลดสำเร็จ', 'ไฟล์ถูกบันทึกในโฟลเดอร์ Downloads');
    } catch (error) {
      log('PDF', 'ERR:', error);
      Alert.alert('ไม่สามารถดาวน์โหลด', 'เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์');
    }
  }, []);

  return {
    localPath,
    downloadDocument,
    loading,
  };
}
