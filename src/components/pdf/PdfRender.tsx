import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Pdf from 'react-native-pdf';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CloseIcon from '../../assets/icons/CloseIcon';
import DownloadIcon from '../../assets/icons/DownloadIcon';
import { useResponsive } from '../../helpers/responsive';
import { log } from '../../helpers/logger';
import usePdfHook from '../../hooks/pdf/usePdfHook';
import { AppColors } from '../../styles/colors';
import { PdfRenderProps } from '../../types/data/pdf/pdf.types';
import AppText from '../texts/AppText';
import {
  AppFontSize,
  AppRadius,
  PRESSED_OPACITY,
} from '../../styles/sharedstyles';

const PdfRender: React.FC<PdfRenderProps> = ({ visible, onClose, pdfUrl }) => {
  const { localPath, downloadDocument, loading } = usePdfHook({
    visible,
    pdfUrl,
  });

  const insets = useSafeAreaInsets();
  const { scale, verticalScale, responsiveRadius } = useResponsive();

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasError, setHasError] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: AppColors.sheetDeep,
        },
        headerRow: {
          width: '100%',
          paddingHorizontal: scale(16),
          paddingTop: (insets.top || 0) + verticalScale(10),
          paddingBottom: verticalScale(12),
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: AppColors.border,
        },
        headerTitle: {
          color: AppColors.white,
        },
        closeButton: {
          width: scale(34),
          height: scale(34),
          borderRadius: responsiveRadius(AppRadius.pill),
          backgroundColor: AppColors.surfaceSubtle,
          justifyContent: 'center',
          alignItems: 'center',
        },
        body: {
          flex: 1,
          backgroundColor: AppColors.sheetRaised,
        },
        loaderContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          gap: verticalScale(10),
        },
        loaderText: {
          color: AppColors.textSecondary,
        },
        errorContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: scale(32),
          gap: verticalScale(8),
        },
        errorText: {
          color: AppColors.textSecondary,
          textAlign: 'center',
        },
        pdf: {
          flex: 1,
          width: '100%',
          height: '100%',
          backgroundColor: AppColors.sheetRaised,
        },
        pagePill: {
          position: 'absolute',
          alignSelf: 'center',
          bottom: verticalScale(14),
          paddingHorizontal: scale(14),
          paddingVertical: verticalScale(6),
          borderRadius: responsiveRadius(AppRadius.pill),
          backgroundColor: AppColors.scrim,
        },
        pagePillText: {
          color: AppColors.white,
        },
        footer: {
          paddingHorizontal: scale(16),
          paddingTop: verticalScale(12),
          paddingBottom: Math.max(insets.bottom || 0, verticalScale(12)),
          backgroundColor: AppColors.sheetDeep,
          borderTopWidth: 1,
          borderTopColor: AppColors.border,
        },
        downloadButton: {
          backgroundColor: AppColors.primary,
          paddingVertical: verticalScale(15),
          paddingHorizontal: scale(20),
          borderRadius: responsiveRadius(AppRadius.pill),
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          gap: scale(8),
          minHeight: verticalScale(36),
        },
        downloadText: {
          color: AppColors.white,
        },
      }),
    [scale, verticalScale, responsiveRadius, insets.top, insets.bottom],
  );

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Header */}
        <View style={styles.headerRow}>
          <AppText
            fontSize={AppFontSize.title}
            fontWeight="semiBold"
            style={styles.headerTitle}
          >
            เอกสาร
          </AppText>

          <TouchableOpacity
            onPress={onClose}
            activeOpacity={PRESSED_OPACITY}
            accessibilityRole="button"
            accessibilityLabel="ปิด"
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <CloseIcon size={14} color={AppColors.white} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.body}>
          {loading || !localPath ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={AppColors.primary} />
              <AppText style={styles.loaderText}>กำลังโหลด PDF...</AppText>
            </View>
          ) : hasError ? (
            <View style={styles.errorContainer}>
              <AppText fontSize={AppFontSize.subtitle} style={styles.errorText}>
                ไม่สามารถเปิดเอกสารได้
              </AppText>
              <AppText fontSize={AppFontSize.body} style={styles.errorText}>
                กรุณาลองใหม่อีกครั้ง หรือดาวน์โหลดไฟล์
              </AppText>
            </View>
          ) : (
            <>
              <Pdf
                source={{ uri: localPath }}
                style={styles.pdf}
                trustAllCerts={false}
                onLoadComplete={numberOfPages => {
                  setTotalPages(numberOfPages);
                  setHasError(false);
                }}
                onPageChanged={(p, n) => {
                  setPage(p);
                  setTotalPages(n);
                }}
                onError={e => {
                  setHasError(true);
                  log('PDF', 'PDF View Error:', e);
                }}
              />

              {totalPages > 0 && (
                <View style={styles.pagePill} pointerEvents="none">
                  <AppText
                    fontSize={AppFontSize.caption}
                    style={styles.pagePillText}
                  >
                    {page || 1} / {totalPages}
                  </AppText>
                </View>
              )}
            </>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            activeOpacity={PRESSED_OPACITY}
            style={styles.downloadButton}
            onPress={() => downloadDocument(pdfUrl)}
          >
            <DownloadIcon size={20} color={AppColors.white} />
            <AppText fontWeight="semiBold" style={styles.downloadText}>
              ดาวน์โหลด
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default PdfRender;
