import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import RenderHTML, { defaultSystemFonts } from 'react-native-render-html';
import LinearGradient from 'react-native-linear-gradient';
import { Ionicons } from '@react-native-vector-icons/ionicons';

import { getFontFamily } from '../../helpers/fontFamilyHelper';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import { thaiSafeLineHeight } from '../../styles/sharedstyles';
import { AppTextProps } from '../../types/ui/texts/text.props';
import AppText from '../texts/AppText';

interface Props {
  html?: string;
  children?: string;
  maxLines?: number;
  fontSize?: number;
  contentWidth?: number;
  fontWeight?: AppTextProps['fontWeight'];
  fadeColors?: [string, string];
}

/**
 * Collapsible text block that clamps to `maxLines`, adds a bottom fade, and
 * shows an "อ่านเพิ่มเติม / ย่อข้อความ" toggle when the content overflows.
 * Accepts either an `html` string (rendered via react-native-render-html) or
 * plain-text `children`.
 */
const ExpandableText: React.FC<Props> = ({
  html,
  children,
  maxLines = 8,
  fontSize = 14,
  contentWidth = 0,
  fontWeight = 'regular',
  fadeColors = ['rgba(17,17,17,0)', 'rgba(17,17,17,0.95)'],
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const [fullHeight, setFullHeight] = useState(0);

  const { verticalScale, scale, moderateScale } = useResponsive();

  const scaledFontSize = moderateScale(fontSize, 0.5);
  const lineHeight = Math.round(scaledFontSize * 1.6);
  const collapsedHeight = maxLines * lineHeight; // max height while collapsed

  const isHtmlMode = !!html && html.trim().length > 0;

  const fontFamily = useMemo(() => getFontFamily(fontWeight), [fontWeight]);

  const systemFonts = useMemo(
    () => [fontFamily, ...defaultSystemFonts],
    [fontFamily],
  );

  const sanitizedHtml = useMemo(() => {
    const raw = (html ?? '').trim();
    if (!raw) return raw;

    // Strip inline font-* declarations so the app's Thai font always wins.
    return raw.replace(/style\s*=\s*"(.*?)"/gi, (_m, styleText: string) => {
      const cleaned = styleText
        .replace(/(^|;)\s*font-family\s*:[^;"]*/gi, '')
        .replace(/(^|;)\s*font\s*:[^;"]*/gi, '')
        .replace(/(^|;)\s*font-weight\s*:[^;"]*/gi, '')
        .replace(/(^|;)\s*font-style\s*:[^;"]*/gi, '')
        .replace(/;;+/g, ';')
        .replace(/^\s*;\s*|\s*;\s*$/g, '')
        .trim();

      if (!cleaned) return '';
      return `style="${cleaned}"`;
    });
  }, [html]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        hiddenMeasure: {
          position: 'absolute',
          opacity: 0,
          zIndex: -1,
          left: 0,
          right: 0,
        },
        clipWrap: {
          position: 'relative',
        },
        clip: {
          maxHeight: isExpanded ? undefined : collapsedHeight,
          overflow: 'hidden',
        },
        fade: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: lineHeight * 2,
        },
        toggleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'center',
          gap: scale(4),
          marginTop: verticalScale(10),
        },
        toggleText: {
          color: AppColors.primary,
          fontSize: scaledFontSize,
        },
        text: {
          fontSize: scaledFontSize,
          lineHeight: thaiSafeLineHeight(lineHeight),
        },
      }),
    [
      verticalScale,
      scale,
      scaledFontSize,
      lineHeight,
      isExpanded,
      collapsedHeight,
    ],
  );

  const htmlBaseStyle = useMemo(
    () => ({
      color: AppColors.textSecondary,
      fontSize: scaledFontSize,
      lineHeight: thaiSafeLineHeight(lineHeight),
      fontFamily,
    }),
    [scaledFontSize, lineHeight, fontFamily],
  );

  const tagsStyles = useMemo(
    () => ({
      p: { marginTop: 0, marginBottom: verticalScale(12), fontFamily },
      br: { height: verticalScale(10) },
      li: { marginBottom: verticalScale(8), fontFamily },
      ul: { marginBottom: verticalScale(12), paddingLeft: scale(20) },
      ol: { marginBottom: verticalScale(12), paddingLeft: scale(20) },
      a: {
        color: AppColors.primary,
        textDecorationLine: 'underline' as const,
        fontFamily,
      },
      img: { maxWidth: '100%' },
      span: { fontFamily },
      div: { fontFamily },
    }),
    [fontFamily, verticalScale, scale],
  );

  const defaultTextProps = useMemo(
    () => ({
      selectable: true,
      allowFontScaling: false,
      maxFontSizeMultiplier: 1.2,
    }),
    [],
  );

  // Measure the full, unclipped height off-screen to decide whether the
  // content overflows maxLines (i.e. whether the toggle/fade are needed).
  const onMeasureLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h <= 0) return;

    if (h !== fullHeight) setFullHeight(h);

    if (!canExpand && h > collapsedHeight + 2) {
      setCanExpand(true);
    }
  };

  const renderToggle = () => (
    <Pressable
      style={styles.toggleRow}
      onPress={() => setIsExpanded(p => !p)}
      hitSlop={8}
    >
      <AppText style={styles.toggleText}>
        {isExpanded ? 'ย่อข้อความ' : 'อ่านเพิ่มเติม'}
      </AppText>
      <Ionicons
        name={isExpanded ? 'chevron-up' : 'chevron-down'}
        size={Math.round(scaledFontSize + 2)}
        color={AppColors.primary}
      />
    </Pressable>
  );

  if (isHtmlMode) {
    const shouldShowToggle = canExpand || fullHeight > collapsedHeight + 2;

    return (
      <View>
        {!canExpand && (
          <View style={styles.hiddenMeasure} onLayout={onMeasureLayout}>
            <RenderHTML
              contentWidth={contentWidth}
              source={{ html: sanitizedHtml }}
              baseStyle={htmlBaseStyle}
              tagsStyles={tagsStyles}
              defaultTextProps={defaultTextProps}
              systemFonts={systemFonts}
            />
          </View>
        )}

        <View style={styles.clipWrap}>
          <View style={styles.clip}>
            <RenderHTML
              contentWidth={contentWidth}
              source={{ html: sanitizedHtml }}
              baseStyle={htmlBaseStyle}
              tagsStyles={tagsStyles}
              defaultTextProps={defaultTextProps}
              systemFonts={systemFonts}
            />
          </View>

          {!isExpanded && shouldShowToggle && (
            <LinearGradient
              colors={fadeColors}
              style={styles.fade}
              pointerEvents="none"
            />
          )}
        </View>

        {shouldShowToggle && renderToggle()}
      </View>
    );
  }

  const textValue = children ?? '';

  return (
    <View>
      {!canExpand && (
        <AppText
          style={[styles.hiddenMeasure, styles.text]}
          fontSize={fontSize}
          fontWeight={fontWeight}
          onTextLayout={e => {
            const lineCount = e.nativeEvent.lines?.length ?? 0;
            if (lineCount > maxLines) setCanExpand(true);
          }}
        >
          {textValue}
        </AppText>
      )}

      <View style={styles.clipWrap}>
        <AppText
          numberOfLines={isExpanded ? undefined : maxLines}
          style={styles.text}
          fontSize={fontSize}
          fontWeight={fontWeight}
        >
          {textValue}
        </AppText>

        {!isExpanded && canExpand && (
          <LinearGradient
            colors={fadeColors}
            style={styles.fade}
            pointerEvents="none"
          />
        )}
      </View>

      {canExpand && renderToggle()}
    </View>
  );
};

export default ExpandableText;
