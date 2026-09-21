import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import ClassRoomDocumentCard, {
  getDocumentFormatLabel,
  normalizeDocumentType,
} from '../../../components/cards/ClassRoomDocumentCard';
import AppText from '../../../components/texts/AppText';
import { IS_TABLET } from '../../../constants/platform';
import { useResponsive } from '../../../helpers/responsive';
import { AppColors } from '../../../styles/colors';
import { AppFontSize, AppRadius } from '../../../styles/sharedstyles';
import { DocumentGroup, DocumentItem } from '../ClassroomScreen';

const { height: screenHeight } = Dimensions.get('window');

type Props = {
  visible: boolean;
  onClose: () => void;
  documents: DocumentGroup[];
  onPlayAudio: (doc: DocumentItem) => void;
  onOpenPdf: (url: string) => void;
  onDownloadPdf: (url: string) => void;
  onClosedComplete?: () => void;
};

const RelatedDocumentsSheet: React.FC<Props> = ({
  visible,
  onClose,
  documents,
  onPlayAudio,
  onOpenPdf,
  onDownloadPdf,
  onClosedComplete,
}) => {
  const { scale, verticalScale, responsiveRadius } = useResponsive();
  const [shouldRender, setShouldRender] = useState(visible);

  const hasDocuments = documents.some(group => group.items.length > 0);

  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setShouldRender(true);

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 420,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 240,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: screenHeight,
          duration: 260,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShouldRender(false);
        onClosedComplete?.();
      });
    }
  }, [visible, translateY, backdropOpacity, onClosedComplete]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
        },
        backdrop: {
          ...StyleSheet.absoluteFill,
          backgroundColor: AppColors.scrim,
        },
        flex1: {
          flex: 1,
        },
        bottomWrap: {
          flex: 1,
          justifyContent: 'flex-end',
        },
        sheet: {
          backgroundColor: AppColors.sheet,
          borderTopWidth: 1,
          borderColor: AppColors.border,
          borderTopLeftRadius: responsiveRadius(AppRadius.sheet),
          borderTopRightRadius: responsiveRadius(AppRadius.sheet),
          paddingHorizontal: scale(18),
          paddingTop: verticalScale(14),
          paddingBottom: verticalScale(24),
          minHeight: '50%',
          maxHeight: '80%',
        },
        handle: {
          alignSelf: 'center',
          width: scale(44),
          height: verticalScale(5),
          borderRadius: responsiveRadius(AppRadius.pill),
          backgroundColor: AppColors.surfaceStrong,
          marginBottom: verticalScale(30),
        },
        header: {
          alignItems: 'flex-start',
          justifyContent: 'center',
          marginBottom: verticalScale(16),
        },
        title: {
          color: AppColors.white,
          textAlign: 'left',
        },
        contentContainer: {
          paddingBottom: verticalScale(20),
        },
        groupWrap: {
          marginBottom: verticalScale(24),
        },
        groupTitle: {
          color: AppColors.white,
          marginBottom: verticalScale(IS_TABLET ? 14 : 12),
        },
        groupItems: {
          gap: verticalScale(IS_TABLET ? 14 : 12),
        },
        emptyWrap: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: verticalScale(40),
        },
        emptyText: {
          color: AppColors.textTertiary,
          textAlign: 'center',
        },
      }),
    [scale, verticalScale, responsiveRadius],
  );

  if (!shouldRender) return null;

  return (
    <Modal
      transparent
      visible={shouldRender}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={styles.flex1} onPress={onClose} />
        </Animated.View>

        <View style={styles.bottomWrap} pointerEvents="box-none">
          <Animated.View
            style={[styles.sheet, { transform: [{ translateY }] }]}
          >
            <View style={styles.handle} />

            <View style={styles.header}>
              <AppText
                fontSize={AppFontSize.title}
                fontWeight="semiBold"
                style={styles.title}
              >
                เอกสารที่เกี่ยวข้อง
              </AppText>
            </View>

            {!hasDocuments ? (
              <View style={styles.emptyWrap}>
                <AppText
                  fontSize={AppFontSize.subtitle}
                  style={styles.emptyText}
                >
                  ไม่มีเอกสารที่เกี่ยวข้อง
                </AppText>
              </View>
            ) : (
              <ScrollView
                bounces={false}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contentContainer}
              >
                {documents.map((group, groupIndex) => (
                  <View key={`group-${groupIndex}`} style={styles.groupWrap}>
                    {!!group.groupTitle && (
                      <AppText
                        fontSize={AppFontSize.subtitle}
                        fontWeight="medium"
                        style={styles.groupTitle}
                      >
                        {group.groupTitle}
                      </AppText>
                    )}

                    <View style={styles.groupItems}>
                      {group.items.map((doc, docIndex) => {
                        const documentType = normalizeDocumentType(doc.type);
                        const formatLabel =
                          getDocumentFormatLabel(documentType);

                        return (
                          <ClassRoomDocumentCard
                            key={doc.id || docIndex.toString()}
                            type={documentType}
                            previewUrl={
                              documentType !== 'audio' ? doc.url : undefined
                            }
                            title={doc.label}
                            length={doc.str_duration}
                            format={formatLabel}
                            size=""
                            price={doc.price ?? 0}
                            is_free={doc.is_free}
                            activate={doc.activate}
                            onPressStart={() => {
                              if (documentType === 'audio') {
                                onPlayAudio(doc);
                              } else if (doc.url) {
                                onOpenPdf(doc.url);
                              }
                            }}
                            onPressDownload={() => {
                              if (documentType !== 'audio' && doc.url) {
                                onDownloadPdf(doc.url);
                              }
                            }}
                          />
                        );
                      })}
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
};

export default RelatedDocumentsSheet;
