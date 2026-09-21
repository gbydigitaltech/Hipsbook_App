import React, { useMemo } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CloseIcon from '../../assets/icons/CloseIcon';
import { IS_IOS } from '../../constants/platform';
import { getFontFamily } from '../../helpers/fontFamilyHelper';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import {
  AppFontSize,
  PRESSED_OPACITY,
  sharedPaddingHorizontal,
} from '../../styles/sharedstyles';
import AppButton from '../buttons/AppButton';
import AppText from '../texts/AppText';

type ContentType = 'markdown' | 'html' | 'text';

type TermsModalProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;

  content: string;
  contentType?: ContentType;

  onAccept?: () => void;
  onDecline?: () => void;

  acceptText?: string;
};

const htmlToMarkdown = (html: string) => {
  if (!html) return '';
  return html
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '# $1\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '## $1\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '### $1\n')
    .replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, '**$2**')
    .replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, '*$2*')
    .replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/(p|div)>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const TermsModal = ({
  visible,
  onClose,
  title = 'ข้อกำหนดการใช้งาน',
  content,
  contentType = 'markdown',
  onAccept,
  onDecline,
  acceptText = 'ยินยอม',
}: TermsModalProps) => {
  const { scale, verticalScale, moderateScale } = useResponsive();
  const insets = useSafeAreaInsets();

  const styles = useMemo(() => {
    return StyleSheet.create({
      backdrop: {
        ...StyleSheet.absoluteFill,
        backgroundColor: AppColors.sheet,
      },

      safe: {
        flex: 1,
      },

      header: {
        paddingTop: verticalScale(10),
        paddingBottom: verticalScale(12),
        paddingHorizontal: scale(sharedPaddingHorizontal),
        borderBottomWidth: 1,
        borderBottomColor: AppColors.border,
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: scale(12),
      },

      titleWrap: { flex: 1 },

      closeBtn: {
        padding: scale(6),
        marginTop: verticalScale(2),
      },

      scroll: { flex: 1 },

      bodyContent: {
        flexGrow: 1,
        paddingHorizontal: scale(sharedPaddingHorizontal),
        paddingTop: verticalScale(16),
        paddingBottom: verticalScale(24),
      },

      footer: {
        paddingHorizontal: scale(sharedPaddingHorizontal),
        paddingTop: verticalScale(12),
        paddingBottom: verticalScale(12) + Math.max(insets.bottom, 0),
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: AppColors.border,
      },

      btn: {
        paddingVertical: verticalScale(15),
      },
    });
  }, [scale, verticalScale, insets.bottom]);

  const markdownStyle = useMemo(() => {
    const regular = getFontFamily('regular');
    const bold = getFontFamily('bold');
    return {
      body: {
        color: AppColors.textSecondary,
        fontFamily: regular,
        fontSize: moderateScale(15, 0.5),
        lineHeight: moderateScale(25, 0.5),
      },
      paragraph: {
        marginTop: 0,
        marginBottom: moderateScale(14, 0.5),
      },
      heading1: {
        color: AppColors.white,
        fontFamily: bold,
        fontSize: moderateScale(20, 0.5),
        lineHeight: moderateScale(28, 0.5),
        marginTop: moderateScale(6, 0.5),
        marginBottom: moderateScale(10, 0.5),
      },
      heading2: {
        color: AppColors.white,
        fontFamily: bold,
        fontSize: moderateScale(17, 0.5),
        lineHeight: moderateScale(24, 0.5),
        marginTop: moderateScale(18, 0.5),
        marginBottom: moderateScale(8, 0.5),
      },
      heading3: {
        color: AppColors.white,
        fontFamily: bold,
        fontSize: moderateScale(15, 0.5),
        marginTop: moderateScale(14, 0.5),
        marginBottom: moderateScale(6, 0.5),
      },
      bullet_list: { marginBottom: moderateScale(8, 0.5) },
      ordered_list: { marginBottom: moderateScale(8, 0.5) },
      list_item: { marginBottom: moderateScale(6, 0.5) },
      bullet_list_icon: { color: AppColors.primary },
      ordered_list_icon: { color: AppColors.primary },
      hr: {
        backgroundColor: AppColors.border,
        height: StyleSheet.hairlineWidth,
        marginVertical: moderateScale(14, 0.5),
      },
      link: {
        color: AppColors.primary,
        fontFamily: regular,
        textDecorationLine: 'underline',
      },
      strong: { color: AppColors.white, fontFamily: bold },
      em: { fontStyle: 'italic' },
    } as const;
  }, [moderateScale]);

  const renderedMarkdown = useMemo(() => {
    if (!content) return '';
    if (contentType === 'html') return htmlToMarkdown(content);
    return content;
  }, [content, contentType]);

  const handleAccept = () => {
    onAccept?.();
    onClose();
  };

  const handleClose = () => {
    onDecline?.();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={IS_IOS ? 'overFullScreen' : 'fullScreen'}
      transparent
      hardwareAccelerated
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.safe,
            {
              paddingTop: insets.top,
            },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.titleWrap}>
              <AppText
                fontSize={AppFontSize.title}
                fontWeight="medium"
                style={{ color: AppColors.primary }}
              >
                {title}
              </AppText>
            </View>

            <TouchableOpacity
              onPress={handleClose}
              accessibilityRole="button"
              activeOpacity={PRESSED_OPACITY}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.closeBtn}
            >
              <CloseIcon size={18} color={AppColors.white} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.bodyContent}
          >
            <Markdown style={markdownStyle}>{renderedMarkdown}</Markdown>
          </ScrollView>

          <View style={styles.footer}>
            <AppButton
              title={acceptText}
              onPress={handleAccept}
              contentStyle={styles.btn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default TermsModal;
