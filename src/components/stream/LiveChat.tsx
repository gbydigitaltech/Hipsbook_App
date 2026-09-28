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
import { AppFontSize } from '../../styles/sharedstyles';
import AppText from '../texts/AppText';
import useChat, { ChatMessage } from '../../hooks/chat/useChat';

type LiveChatProps = {
  streamId?: string;
  /** false = โหมดดูอย่างเดียว (ซ่อนช่องพิมพ์) */
  canSend?: boolean;
  /**
   * true = โหมด overlay ลอยบนวิดีโอ (สำหรับคนไลฟ์):
   *  - คอมเมนต์ค่อย ๆ จางหายไปเอง ไม่ค้างเต็มจอ
   *  - บริเวณคอมเมนต์แตะทะลุได้ (ซูมวิดีโอผ่านคอมเมนต์ได้)
   */
  ephemeral?: boolean;
  style?: StyleProp<ViewStyle>;
  /** ระยะเว้นด้านล่างของช่องพิมพ์ตอนคีย์บอร์ดปิด (กันทับปุ่มควบคุม/safe area) */
  bottomInset?: number;
  /** แจ้ง parent ตอนคีย์บอร์ดเปิด/ปิด (เช่นให้ขยายพื้นที่แตะปิดคีย์บอร์ดเต็มจอ) */
  onKeyboardVisibleChange?: (visible: boolean) => void;
};

type RowStyles = {
  row: StyleProp<ViewStyle>;
  avatar: any;
  bubbleText: StyleProp<ViewStyle>;
  name: any;
  msg: any;
};

/**
 * แยกแถวคอมเมนต์เป็น memo component: ตอนพิมพ์ (input เปลี่ยนทุกตัวอักษร)
 * แถวเดิมจะไม่ re-render ทั้งลิสต์ -> คีย์บอร์ดไม่หน่วง/ค้าง
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

// โหมด ephemeral: อายุคอมเมนต์และการจาง
const LIFETIME_MS = 8000; // อยู่บนจอ ~8 วิ
const FADE_MS = 1500; // ค่อย ๆ จางช่วง 1.5 วิสุดท้าย
const MAX_VISIBLE = 6; // โชว์ล่าสุดไม่เกิน 6 ข้อความ

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
}: LiveChatProps) => {
  const { scale, verticalScale } = useResponsive();
  const { messages, input, setInput, sendMessage, sending, error } = useChat(
    streamId,
    canSend,
  );

  // ปัดขวาเปิดประวัติแชท (โหมด ephemeral): ดูย้อนหลังแม้คอมเมนต์จางหายไปแล้ว
  const [showHistory, setShowHistory] = useState(false);

  // ---- คีย์บอร์ด: จับความสูงเองแล้วดันช่องพิมพ์ขึ้น (ชัวร์กว่าใน Modal) ----
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
      // ปิดหน้าไลฟ์ระหว่างที่คีย์บอร์ดเปิดอยู่ -> iOS จะค้างคีย์บอร์ดไว้บนหน้าเดิม
      Keyboard.dismiss();
    };
  }, []);
  const keyboardVisible = keyboardHeight > 0;

  useEffect(() => {
    onKeyboardVisibleChange?.(keyboardVisible);
  }, [keyboardVisible, onKeyboardVisibleChange]);

  // ---- โหมด ephemeral: ticker ให้คอมเมนต์เก่าจางหาย ----
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    // หยุด ticker ตอนพิมพ์/เปิดประวัติ -> input ไม่โดน re-render กวน คีย์บอร์ดไม่หลุด
    if (!ephemeral || messages.length === 0 || keyboardVisible || showHistory) {
      return;
    }
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [ephemeral, messages.length, keyboardVisible, showHistory]);

  // list ปกติ (คนดู): inverted ให้ข้อความใหม่อยู่ล่างและ stick อัตโนมัติ
  const invertedData = useMemo(() => [...messages].reverse(), [messages]);

  // list ephemeral (คนไลฟ์): เฉพาะที่ยังไม่หมดอายุ + จำกัดจำนวน พร้อมค่า opacity
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

  // ปัดขวา (แถบซ้าย) -> เปิดประวัติ | ปัดซ้าย (ในประวัติ) -> ปิด
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
        listContent: {
          paddingHorizontal: scale(12),
          paddingBottom: verticalScale(8),
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
          height: verticalScale(40),
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
        historyPanel: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
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
          backgroundColor: 'rgba(255,255,255,0.45)',
        },
      }),
    [scale, verticalScale],
  );

  const inputBarPadding = useMemo(
    () => ({
      paddingBottom:
        (keyboardVisible ? keyboardHeight : bottomInset) + verticalScale(8),
    }),
    [keyboardVisible, keyboardHeight, bottomInset, verticalScale],
  );

  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => (
      <ChatRow item={item} styles={styles} />
    ),
    [styles],
  );
  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  const canSubmit = !!input.trim() && !sending;

  return (
    <View style={[styles.root, style]} pointerEvents="box-none">
      {/* คอมเมนต์ */}
      {ephemeral ? (
        showHistory ? (
          // ประวัติแชท (ปัดขวาเปิด): เลื่อนดูย้อนหลังได้ + ปัดซ้าย/กด ✕ เพื่อปิด
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
            {/* คอมเมนต์จางหาย: แตะทะลุได้ -> ซูมวิดีโอผ่านคอมเมนต์ได้ */}
            <View style={styles.ephemeralWrap} pointerEvents="none">
              {ephemeralData.map(({ m, opacity }) => {
                const opacityStyle = { opacity };
                return (
                  <ChatRow
                    key={m.id}
                    item={m}
                    styles={styles}
                    extraStyle={opacityStyle}
                  />
                );
              })}
            </View>
            {/* แถบซ้าย: ปัดขวาเพื่อเปิดประวัติแชท */}
            <View style={styles.edgeSwipe} {...openPan.panHandlers}>
              <View style={styles.edgeHandle} />
            </View>
          </>
        )
      ) : (
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
      )}

      {/* backdrop แตะปิดคีย์บอร์ด (โผล่เฉพาะตอนพิมพ์ ไม่งั้นปล่อยแตะทะลุ) */}
      {keyboardVisible ? (
        <Pressable style={styles.dismissBackdrop} onPress={Keyboard.dismiss} />
      ) : null}

      {error ? (
        <AppText fontSize={AppFontSize.overline} style={styles.errorNote}>
          แชทมีปัญหา: {error}
        </AppText>
      ) : null}

      {canSend ? (
        <View style={[styles.inputBar, inputBarPadding]}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="พิมพ์ข้อความ..."
            placeholderTextColor={AppColors.grayLight}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
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
