import { Ionicons } from '@react-native-vector-icons/ionicons';
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  FlatList,
  Keyboard,
  PanResponder,
  Pressable,
  StyleProp,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import { IS_IOS, IS_TABLET } from '../../constants/platform';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import { getFontFamily } from '../../helpers/fontFamilyHelper';
import { AppFontSize, AppRadius } from '../../styles/sharedstyles';
import CommentIcon from '../../assets/icons/CommentIcon';
import AppText from '../texts/AppText';
import useChat, { ChatMessage } from '../../hooks/chat/useChat';
import { useProfile } from '../../stores/profile';

type LiveChatProps = {
  streamId?: string;
  /** false = read-only mode (input hidden) */
  canSend?: boolean;
  /**
   * true = overlay mode floating over the video (for the host):
   *  - comments fade out on their own instead of piling up
   *  - the comment area lets touches pass through (video can be zoomed through it)
   */
  ephemeral?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Bottom spacing of the input when the keyboard is closed (keeps clear of controls/safe area) */
  bottomInset?: number;
  /** Notifies the parent when the keyboard opens/closes (e.g. to show a full-screen tap-to-dismiss area) */
  onKeyboardVisibleChange?: (visible: boolean) => void;
  /**
   * overlay = floats over the video (bubbles) | panel = chat box below the video (per design)
   * host = host screen per design (comment pills + input/heart/more bar)
   */
  variant?: 'overlay' | 'panel' | 'host' | 'side';
  /** panel/host: heart button next to the input */
  onLike?: () => void;
  /** host: extra round button at the end of the input bar (e.g. camera/mic menu) */
  extraAction?: React.ReactNode;
  /** host: hide comments (parent controls this with a full-screen left/right swipe) */
  hidden?: boolean;
  /** host: tap the "Chat" tab while hidden to bring it back */
  onShowChat?: () => void;
  /** host: left/right edge spacing, matching the top row of the live screen */
  hostEdge?: number;
};

type RowStyles = {
  row: StyleProp<ViewStyle>;
  avatar: any;
  bubbleText: StyleProp<ViewStyle>;
  name: any;
  msg: any;
};

/**
 * Comment rows are memoized components: while typing (input changes on every keystroke)
 * existing rows don't re-render the whole list -> keyboard stays smooth
 */
const ChatRow = memo(
  ({
    item,
    styles,
    extraStyle,
  }: {
    item: ChatMessage;
    styles: RowStyles;
    extraStyle?: StyleProp<ViewStyle>;
  }) => (
    <View style={extraStyle ? [styles.row, extraStyle] : styles.row}>
      {item.avatar ? (
        <FastImage
          style={styles.avatar}
          source={{ uri: item.avatar }}
          resizeMode={FastImage.resizeMode.cover}
        />
      ) : (
        <View style={styles.avatar} />
      )}
      <View style={styles.bubbleText}>
        <AppText fontSize={AppFontSize.overline} style={styles.name}>
          {item.user}
        </AppText>
        <AppText fontSize={AppFontSize.caption} style={styles.msg}>
          {item.text}
        </AppText>
      </View>
    </View>
  ),
);

type PanelRowStyles = {
  pRow: StyleProp<ViewStyle>;
  pAvatar: any;
  pBody: StyleProp<ViewStyle>;
  pName: any;
  pMsg: any;
};

/** Panel chat row (per design): avatar + name + message, no bubble */
const PanelRow = memo(
  ({ item, styles }: { item: ChatMessage; styles: PanelRowStyles }) => (
    <View style={styles.pRow}>
      {item.avatar ? (
        <FastImage
          style={styles.pAvatar}
          source={{ uri: item.avatar }}
          resizeMode={FastImage.resizeMode.cover}
        />
      ) : (
        <View style={styles.pAvatar} />
      )}
      <View style={styles.pBody}>
        <AppText
          fontWeight="medium"
          fontSize={AppFontSize.body}
          style={styles.pName}
        >
          {item.user}
        </AppText>
        <AppText fontSize={AppFontSize.body} style={styles.pMsg}>
          {item.text}
        </AppText>
      </View>
    </View>
  ),
);

type HostRowStyles = {
  hRow: StyleProp<ViewStyle>;
  hText: any;
  hMsg: any;
  hAvatar: any;
};

/** Host chat row (per design): dark grey pill, name in primary color */
const HostRow = memo(
  ({
    item,
    styles,
    extraStyle,
  }: {
    item: ChatMessage;
    styles: HostRowStyles;
    extraStyle?: StyleProp<ViewStyle>;
  }) => (
    <View style={extraStyle ? [styles.hRow, extraStyle] : styles.hRow}>
      {/* Round avatar (no image -> person icon) */}
      {item.avatar ? (
        <FastImage
          style={styles.hAvatar}
          source={{ uri: item.avatar }}
          resizeMode={FastImage.resizeMode.cover}
        />
      ) : (
        <View style={styles.hAvatar}>
          <Ionicons name="person" size={11} color={AppColors.textSecondary} />
        </View>
      )}
      {/* Username in primary color | message text in white */}
      <AppText
        fontSize={AppFontSize.caption}
        numberOfLines={2}
        style={styles.hText}
      >
        {item.user}{' '}
        <AppText fontSize={AppFontSize.caption} style={styles.hMsg}>
          {item.text}
        </AppText>
      </AppText>
    </View>
  ),
);

type SideRowStyles = {
  sRow: StyleProp<ViewStyle>;
  sAvatar: any;
  sText: any;
  sName: any;
  sMsg: any;
};

/** YouTube-style chat row: round avatar + name + message on one line */
const SideRow = memo(
  ({ item, styles }: { item: ChatMessage; styles: SideRowStyles }) => (
    <View style={styles.sRow}>
      {item.avatar ? (
        <FastImage
          style={styles.sAvatar}
          source={{ uri: item.avatar }}
          resizeMode={FastImage.resizeMode.cover}
        />
      ) : (
        <View style={styles.sAvatar}>
          <Ionicons name="person" size={13} color={AppColors.textSecondary} />
        </View>
      )}
      <AppText fontSize={AppFontSize.caption} style={styles.sText}>
        <AppText
          fontSize={AppFontSize.caption}
          fontWeight="medium"
          style={styles.sName}
        >
          {item.user}
        </AppText>
        {'  '}
        <AppText fontSize={AppFontSize.caption} style={styles.sMsg}>
          {item.text}
        </AppText>
      </AppText>
    </View>
  ),
);

// Ephemeral mode: comment lifetime and fade
const LIFETIME_MS = 8000; // stays on screen ~8s
const FADE_MS = 1500; // fades out over the last 1.5s
const MAX_VISIBLE = 6; // show at most the 6 latest messages

const toMillis = (m: ChatMessage, fallback: number): number => {
  const c = m.createdAt as { toMillis?: () => number } | null | undefined;
  return c && typeof c.toMillis === 'function' ? c.toMillis() : fallback;
};

const LiveChat = ({
  streamId,
  canSend = true,
  ephemeral = false,
  style,
  bottomInset = 0,
  onKeyboardVisibleChange,
  variant = 'overlay',
  onLike,
  extraAction,
  hidden = false,
  onShowChat,
  hostEdge,
}: LiveChatProps) => {
  const isHost = variant === 'host';
  // side = live chat panel on the right in fullscreen (YouTube-style)
  const isSide = variant === 'side';
  const myAvatar = useProfile(st => st.profile?.profile_image);
  const isPanel = variant === 'panel' && !ephemeral;
  const { scale, verticalScale, moderateScale } = useResponsive();
  const { messages, input, setInput, sendMessage, sending, error } = useChat(
    streamId,
    canSend,
  );

  // Swipe right to open chat history (ephemeral mode): see older comments even after they faded
  const [showHistory, setShowHistory] = useState(false);

  // ---- Keyboard: track its height ourselves and push the input up (more reliable inside a Modal) ----
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  useEffect(() => {
    const showEvt = IS_IOS ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = IS_IOS ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvt, e =>
      setKeyboardHeight(e.endCoordinates?.height ?? 0),
    );
    const hide = Keyboard.addListener(hideEvt, () => setKeyboardHeight(0));
    return () => {
      show.remove();
      hide.remove();
      // Closing the live screen while the keyboard is open -> iOS keeps the keyboard stuck on screen
      Keyboard.dismiss();
    };
  }, []);
  const keyboardVisible = keyboardHeight > 0;

  useEffect(() => {
    onKeyboardVisibleChange?.(keyboardVisible);
  }, [keyboardVisible, onKeyboardVisibleChange]);

  // ---- Ephemeral mode: ticker that fades out old comments ----
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    // Pause the ticker while typing/viewing history -> input isn't re-rendered, keyboard stays open
    if (
      !ephemeral ||
      isHost ||
      messages.length === 0 ||
      keyboardVisible ||
      showHistory
    ) {
      return;
    }
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [ephemeral, isHost, messages.length, keyboardVisible, showHistory]);

  /* ---- host (TikTok-style): chat stays, shown/hidden via the `hidden` prop (slides out to the left) ---- */
  const hideX = useRef(new Animated.Value(0)).current;
  const regionWRef = useRef(300);
  useEffect(() => {
    Animated.timing(hideX, {
      toValue: hidden ? -regionWRef.current : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [hidden, hideX]);

  // Normal list (viewer): inverted so new messages sit at the bottom and stick automatically
  const invertedData = useMemo(() => [...messages].reverse(), [messages]);

  // Ephemeral list (host): only unexpired messages, capped count, with opacity
  const ephemeralData = useMemo(() => {
    if (!ephemeral) return [];
    return messages
      .map(m => {
        const t = toMillis(m, now);
        const remaining = LIFETIME_MS - (now - t);
        const opacity =
          remaining >= LIFETIME_MS
            ? 1
            : remaining < FADE_MS
            ? Math.max(0, remaining / FADE_MS)
            : 1;
        return { m, remaining, opacity };
      })
      .filter(x => x.remaining > 0)
      .slice(-MAX_VISIBLE);
  }, [ephemeral, messages, now]);

  // Swipe right (left strip) -> open history | swipe left (in history) -> close
  const openPan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) =>
        g.dx > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderRelease: (_e, g) => {
        if (g.dx > 40) setShowHistory(true);
      },
    }),
  ).current;
  const closePan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) =>
        g.dx < -12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderRelease: (_e, g) => {
        if (g.dx < -40) setShowHistory(false);
      },
    }),
  ).current;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, justifyContent: 'flex-end' },
        list: { flexGrow: 0, maxHeight: '100%' },
        // The list is inverted: paddingTop = the visible bottom spacing on screen (above the input)
        listContent: {
          paddingHorizontal: scale(12),
          paddingTop: verticalScale(10),
        },
        ephemeralWrap: {
          flex: 1,
          justifyContent: 'flex-end',
          paddingHorizontal: scale(12),
          paddingBottom: verticalScale(8),
        },
        row: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          marginTop: verticalScale(6),
          alignSelf: 'flex-start',
          maxWidth: '85%',
          backgroundColor: AppColors.scrim,
          borderRadius: scale(14),
          paddingVertical: verticalScale(5),
          paddingHorizontal: scale(8),
        },
        avatar: {
          width: scale(22),
          height: scale(22),
          borderRadius: scale(11),
          marginRight: scale(7),
          backgroundColor: AppColors.surfaceStrong,
        },
        bubbleText: { flexShrink: 1 },
        name: { color: AppColors.grayLight, marginBottom: verticalScale(1) },
        msg: { color: AppColors.white },
        errorNote: {
          marginHorizontal: scale(12),
          marginBottom: verticalScale(6),
          color: AppColors.danger,
        },
        inputBar: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(8),
          paddingHorizontal: scale(12),
          paddingTop: verticalScale(8),
        },
        input: {
          flex: 1,
          minHeight: verticalScale(40),
          maxHeight: verticalScale(100),
          backgroundColor: AppColors.scrimStrong,
          borderRadius: scale(20),
          paddingHorizontal: scale(16),
          paddingVertical: verticalScale(8),
          color: AppColors.white,
          fontSize: IS_TABLET ? 16 : 14,
        },
        sendBtn: {
          width: scale(40),
          height: scale(40),
          borderRadius: scale(20),
          backgroundColor: AppColors.primary,
          justifyContent: 'center',
          alignItems: 'center',
        },
        sendBtnDisabled: { opacity: 0.5 },
        dismissBackdrop: { ...StyleSheet.absoluteFillObject },
        /* ---- side (landscape live chat, YouTube-style) ---- */
        sListContent: {
          paddingHorizontal: scale(16),
          paddingTop: verticalScale(8),
        },
        sRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: scale(10),
          paddingVertical: verticalScale(7),
        },
        sAvatar: {
          width: scale(28),
          height: scale(28),
          borderRadius: scale(14),
          backgroundColor: AppColors.disabled,
          overflow: 'hidden',
          justifyContent: 'center',
          alignItems: 'center',
        },
        sText: { flex: 1, color: AppColors.white, paddingTop: 2 },
        sName: { color: AppColors.primary },
        sMsg: { color: AppColors.white },
        sEmpty: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          gap: verticalScale(6),
          paddingHorizontal: scale(20),
        },
        sEmptyText: { color: AppColors.textTertiary, textAlign: 'center' },
        sBar: {
          flexDirection: 'row',
          alignItems: 'flex-end', // multiline input: keep buttons at the bottom
          gap: scale(8),
          paddingHorizontal: scale(12),
          paddingTop: verticalScale(10),
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: AppColors.borderStrong,
        },
        sPill: {
          flex: 1,
          minHeight: scale(40),
          borderRadius: 999,
          backgroundColor: AppColors.surface,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: AppColors.borderStrong,
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: scale(4),
          paddingLeft: scale(16),
          paddingRight: scale(12),
        },
        sHeart: {
          width: scale(40),
          height: scale(40),
          borderRadius: 999,
          backgroundColor: AppColors.surface,
          justifyContent: 'center',
          alignItems: 'center',
        },
        /* ---- host (host screen, per design) ---- */
        hWrap: {
          flex: 1,
          justifyContent: 'flex-end',
          paddingLeft: scale(15),
          paddingRight: scale(110),
          paddingBottom: verticalScale(13),
        },
        // Host chat area: bottom ~40% of the screen above the input bar (swipeable across the whole strip)
        hRegion: { height: '40%', overflow: 'hidden' },
        hSlide: { flex: 1 },
        hList: { flex: 1 },
        // The list is inverted: paddingTop = the visible "bottom" gap (keeps comments off the input bar)
        hListContent: {
          paddingLeft: hostEdge ?? scale(15),
          paddingRight: scale(110),
          paddingTop: verticalScale(13),
        },
        hShowTab: {
          position: 'absolute',
          left: hostEdge ?? 0,
          bottom: verticalScale(13),
          height: scale(28),
          paddingLeft: scale(12),
          paddingRight: scale(8),
          borderRadius: AppRadius.pill,
          backgroundColor: AppColors.mediaScrim,
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(2),
        },
        hRow: {
          alignSelf: 'flex-start',
          maxWidth: '100%',
          marginTop: verticalScale(13),
          minHeight: scale(23),
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(6),
          paddingLeft: scale(3),
          paddingRight: scale(11),
          paddingVertical: verticalScale(1),
          borderRadius: AppRadius.pill,
          backgroundColor: AppColors.chip,
        },
        hText: { color: AppColors.primary, flexShrink: 1 },
        hMsg: { color: AppColors.white },
        hAvatar: {
          width: scale(19),
          height: scale(19),
          borderRadius: scale(10),
          backgroundColor: AppColors.disabled,
          overflow: 'hidden',
          justifyContent: 'center',
          alignItems: 'center',
        },
        hBar: {
          flexDirection: 'row',
          alignItems: 'flex-end', // multiline input: keep buttons at the bottom
          gap: scale(9),
          paddingLeft: hostEdge ?? scale(14),
          paddingRight: hostEdge ?? scale(13),
        },
        hPill: {
          flex: 1,
          minHeight: scale(49),
          borderRadius: 999,
          backgroundColor: AppColors.sheetRaised,
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: scale(4),
          paddingLeft: scale(15),
          paddingRight: scale(15),
        },
        hCircle: {
          width: scale(49),
          height: scale(49),
          borderRadius: 999,
          backgroundColor: AppColors.sheetRaised,
          justifyContent: 'center',
          alignItems: 'center',
        },
        /* ---- panel (per design) ---- */
        // panel: list fills the remaining space and scrolls; the input never gets pushed off
        pList: { flex: 1 },
        // Inverted list: paddingTop = visible bottom spacing
        pListContent: {
          paddingHorizontal: scale(18),
          paddingTop: verticalScale(12),
          paddingBottom: verticalScale(4),
        },
        pEmpty: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: verticalScale(8),
          paddingHorizontal: scale(24),
        },
        pEmptyText: { color: AppColors.textSecondary },
        pEmptySub: { color: AppColors.textTertiary, textAlign: 'center' },
        pRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: scale(12),
          marginTop: verticalScale(14),
        },
        pAvatar: {
          width: scale(38),
          height: scale(38),
          borderRadius: scale(19),
          backgroundColor: AppColors.surfaceStrong,
        },
        pBody: { flex: 1, gap: verticalScale(1) },
        pName: { color: AppColors.primary },
        pMsg: { color: AppColors.textPrimary },
        pInputBar: {
          flexDirection: 'row',
          alignItems: 'flex-end', // multiline input: keep buttons at the bottom
          gap: scale(10),
          paddingHorizontal: scale(18),
          paddingTop: verticalScale(12),
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: AppColors.border,
        },
        pMe: {
          width: scale(44),
          height: scale(44),
          borderRadius: scale(22),
          backgroundColor: AppColors.surfaceStrong,
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
        },
        pMeImg: { width: '100%', height: '100%' },
        pInputPill: {
          flex: 1,
          minHeight: scale(44),
          borderRadius: 999,
          // Same input style as the composer used across the app
          backgroundColor: AppColors.surface,
          borderWidth: 1,
          borderColor: AppColors.border,
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: scale(4),
          paddingLeft: scale(20),
          paddingRight: scale(14),
        },
        pInput: {
          flex: 1,
          // Multiline: grows with the text up to ~4 lines, then scrolls inside
          minHeight: scale(32),
          maxHeight: scale(90),
          color: AppColors.white,
          fontSize: moderateScale(AppFontSize.caption, 0.5),
          fontFamily: getFontFamily('regular'),
          paddingTop: 7,
          paddingBottom: 7,
          textAlignVertical: 'center',
        },
        pHeart: {
          width: scale(44),
          height: scale(44),
          borderRadius: scale(22),
          backgroundColor: AppColors.surface,
          borderWidth: 1,
          borderColor: AppColors.border,
          justifyContent: 'center',
          alignItems: 'center',
        },
        historyPanel: { flex: 1, backgroundColor: AppColors.scrim },
        historyHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: scale(12),
          paddingTop: verticalScale(8),
          paddingBottom: verticalScale(4),
        },
        historyTitle: { color: AppColors.white },
        edgeSwipe: {
          position: 'absolute',
          left: 0,
          top: '40%',
          bottom: verticalScale(56),
          width: scale(28),
          justifyContent: 'center',
          alignItems: 'center',
        },
        edgeHandle: {
          width: scale(4),
          height: verticalScale(40),
          borderRadius: scale(2),
          backgroundColor: AppColors.textTertiary,
        },
      }),
    [scale, verticalScale, moderateScale, hostEdge],
  );

  const inputBarPadding = useMemo(
    () => ({
      paddingBottom:
        (keyboardVisible ? keyboardHeight : bottomInset) + verticalScale(8),
    }),
    [keyboardVisible, keyboardHeight, bottomInset, verticalScale],
  );

  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) =>
      isPanel ? (
        <PanelRow item={item} styles={styles} />
      ) : isSide ? (
        <SideRow item={item} styles={styles} />
      ) : (
        // overlay (viewer fullscreen) uses the same pill as the host: round avatar + primary name + white text
        <HostRow item={item} styles={styles} />
      ),
    [styles, isPanel, isSide],
  );
  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);
  const renderHostItem = useCallback(
    ({ item }: { item: ChatMessage }) => (
      <HostRow item={item} styles={styles} />
    ),
    [styles],
  );

  const canSubmit = !!input.trim() && !sending;

  return (
    <View style={[styles.root, style]} pointerEvents="box-none">
      {/* Comments */}
      {isHost ? (
        // Host (TikTok-style): chat never disappears, can scroll back; swipe to hide/show
        <View
          style={styles.hRegion}
          pointerEvents="box-none"
          onLayout={e => {
            regionWRef.current = Math.max(1, e.nativeEvent.layout.width);
            if (hidden) hideX.setValue(-regionWRef.current);
          }}
        >
          <Animated.View
            style={[styles.hSlide, { transform: [{ translateX: hideX }] }]}
          >
            <FlatList
              style={styles.hList}
              contentContainerStyle={styles.hListContent}
              data={invertedData}
              keyExtractor={keyExtractor}
              renderItem={renderHostItem}
              inverted
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          </Animated.View>
          {hidden && (
            <TouchableOpacity
              style={styles.hShowTab}
              onPress={onShowChat}
              hitSlop={8}
            >
              <AppText fontSize={AppFontSize.caption} style={styles.hMsg}>
                แชท
              </AppText>
              <Ionicons
                name="chevron-forward"
                size={14}
                color={AppColors.white}
              />
            </TouchableOpacity>
          )}
        </View>
      ) : ephemeral ? (
        showHistory ? (
          // Chat history (swipe right to open): scroll back, swipe left or tap ✕ to close
          <View style={styles.historyPanel} {...closePan.panHandlers}>
            <View style={styles.historyHeader}>
              <AppText
                fontWeight="medium"
                fontSize={AppFontSize.caption}
                style={styles.historyTitle}
              >
                แชททั้งหมด
              </AppText>
              <TouchableOpacity
                onPress={() => setShowHistory(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name="close"
                  size={IS_TABLET ? 24 : 20}
                  color={AppColors.white}
                />
              </TouchableOpacity>
            </View>
            <FlatList
              style={styles.list}
              contentContainerStyle={styles.listContent}
              data={invertedData}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              inverted
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            />
          </View>
        ) : (
          <>
            {/* Fading comments: touches pass through -> video can be zoomed through them */}
            <View
              style={isHost ? styles.hWrap : styles.ephemeralWrap}
              pointerEvents="none"
            >
              {ephemeralData.map(({ m, opacity }) => {
                const opacityStyle = { opacity };
                return isHost ? (
                  <HostRow
                    key={m.id}
                    item={m}
                    styles={styles}
                    extraStyle={opacityStyle}
                  />
                ) : (
                  <ChatRow
                    key={m.id}
                    item={m}
                    styles={styles}
                    extraStyle={opacityStyle}
                  />
                );
              })}
            </View>
            {/* Left strip: swipe right to open chat history */}
            <View style={styles.edgeSwipe} {...openPan.panHandlers}>
              <View style={styles.edgeHandle} />
            </View>
          </>
        )
      ) : isPanel && messages.length === 0 ? (
        <View style={styles.pEmpty}>
          <CommentIcon size={IS_TABLET ? 80 : 64} />
          <AppText fontSize={AppFontSize.subtitle} style={styles.pEmptyText}>
            ยังไม่มีข้อความ
          </AppText>
          <AppText fontSize={AppFontSize.caption} style={styles.pEmptySub}>
            เริ่มพูดคุยกับคนอื่น ๆ ในไลฟ์นี้ได้เลย
          </AppText>
        </View>
      ) : isSide && messages.length === 0 ? (
        <View style={styles.sEmpty}>
          <Ionicons
            name="chatbubbles-outline"
            size={IS_TABLET ? 34 : 28}
            color={AppColors.textTertiary}
          />
          <AppText fontSize={AppFontSize.caption} style={styles.sEmptyText}>
            ยังไม่มีข้อความ{'\n'}เริ่มพูดคุยกันเลย
          </AppText>
        </View>
      ) : (
        <FlatList
          style={isPanel || isSide ? styles.pList : styles.list}
          contentContainerStyle={
            isPanel
              ? styles.pListContent
              : isSide
              ? styles.sListContent
              : styles.listContent
          }
          data={invertedData}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          inverted
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        />
      )}

      {/* Backdrop that dismisses the keyboard (only while typing, otherwise touches pass through) */}
      {keyboardVisible ? (
        <Pressable style={styles.dismissBackdrop} onPress={Keyboard.dismiss} />
      ) : null}

      {error ? (
        <AppText fontSize={AppFontSize.overline} style={styles.errorNote}>
          แชทมีปัญหา: {error}
        </AppText>
      ) : null}

      {canSend && isSide ? (
        <View style={[styles.sBar, inputBarPadding]}>
          <View style={styles.sPill}>
            <TextInput
              style={styles.pInput}
              value={input}
              onChangeText={setInput}
              placeholder="พิมพ์ข้อความ..."
              placeholderTextColor={AppColors.textTertiary}
              multiline
              submitBehavior="newline"
            />
            <TouchableOpacity
              onPress={sendMessage}
              disabled={!canSubmit}
              hitSlop={10}
              style={!canSubmit && styles.sendBtnDisabled}
            >
              <Ionicons
                name="send"
                size={IS_TABLET ? 18 : 15}
                color={canSubmit ? AppColors.primary : AppColors.white}
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.sHeart} onPress={onLike} hitSlop={6}>
            <Ionicons
              name="heart"
              size={IS_TABLET ? 20 : 17}
              color={AppColors.white}
            />
          </TouchableOpacity>
        </View>
      ) : canSend && isHost ? (
        <View style={[styles.hBar, inputBarPadding]}>
          <View style={styles.hPill}>
            <TextInput
              style={styles.pInput}
              value={input}
              onChangeText={setInput}
              placeholder="พิมพ์ข้อความของคุณ..."
              placeholderTextColor={AppColors.textTertiary}
              multiline
              submitBehavior="newline"
            />
            <TouchableOpacity
              onPress={sendMessage}
              disabled={!canSubmit}
              hitSlop={10}
              style={!canSubmit && styles.sendBtnDisabled}
            >
              <Ionicons
                name="send"
                size={IS_TABLET ? 18 : 15}
                color={canSubmit ? AppColors.primary : AppColors.white}
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.hCircle} onPress={onLike} hitSlop={6}>
            <Ionicons
              name="heart"
              size={IS_TABLET ? 22 : 18}
              color={AppColors.white}
            />
          </TouchableOpacity>
          {extraAction}
        </View>
      ) : canSend && isPanel ? (
        <View style={[styles.pInputBar, inputBarPadding]}>
          <View style={styles.pMe}>
            {typeof myAvatar === 'string' && myAvatar ? (
              <FastImage style={styles.pMeImg} source={{ uri: myAvatar }} />
            ) : (
              <Ionicons
                name="person"
                size={IS_TABLET ? 22 : 18}
                color={AppColors.textSecondary}
              />
            )}
          </View>
          <View style={styles.pInputPill}>
            <TextInput
              style={styles.pInput}
              value={input}
              onChangeText={setInput}
              placeholder="พิมพ์ข้อความของคุณ..."
              placeholderTextColor={AppColors.textTertiary}
              multiline
              submitBehavior="newline"
            />
            <TouchableOpacity
              onPress={sendMessage}
              disabled={!canSubmit}
              hitSlop={10}
              style={!canSubmit && styles.sendBtnDisabled}
            >
              <Ionicons
                name="send"
                size={IS_TABLET ? 18 : 15}
                color={canSubmit ? AppColors.primary : AppColors.white}
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.pHeart} onPress={onLike} hitSlop={6}>
            <Ionicons
              name="heart"
              size={IS_TABLET ? 22 : 18}
              color={AppColors.white}
            />
          </TouchableOpacity>
        </View>
      ) : canSend ? (
        <View style={[styles.inputBar, inputBarPadding]}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="พิมพ์ข้อความ..."
            placeholderTextColor={AppColors.textTertiary}
            multiline
            submitBehavior="newline"
          />
          <TouchableOpacity
            style={[styles.sendBtn, !canSubmit && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!canSubmit}
          >
            <Ionicons
              name="send"
              size={IS_TABLET ? 22 : 18}
              color={AppColors.white}
            />
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
};

export default LiveChat;
