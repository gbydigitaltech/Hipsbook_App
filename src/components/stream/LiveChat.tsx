import { Ionicons } from '@react-native-vector-icons/ionicons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Keyboard,
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
};

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
}: LiveChatProps) => {
  const { scale, verticalScale } = useResponsive();
  const { messages, input, setInput, sendMessage, sending, error } = useChat(
    streamId,
    canSend,
  );

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
    };
  }, []);
  const keyboardVisible = keyboardHeight > 0;

  // ---- โหมด ephemeral: ticker ให้คอมเมนต์เก่าจางหาย ----
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!ephemeral || messages.length === 0) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [ephemeral, messages.length]);

  // list ปกติ (คนดู): inverted ให้ข้อความใหม่อยู่ล่างและ stick อัตโนมัติ
  const invertedData = useMemo(
    () => (ephemeral ? [] : [...messages].reverse()),
    [messages, ephemeral],
  );

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
          paddingBottom:
            (keyboardVisible ? keyboardHeight : bottomInset) + verticalScale(8),
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
      }),
    [scale, verticalScale, keyboardVisible, keyboardHeight, bottomInset],
  );

  const renderRow = (item: ChatMessage, extraStyle?: StyleProp<ViewStyle>) => {
    const rowStyle = extraStyle ? [styles.row, extraStyle] : styles.row;
    return (
      <View style={rowStyle}>
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
    );
  };

  const canSubmit = !!input.trim() && !sending;

  return (
    <View style={[styles.root, style]} pointerEvents="box-none">
      {/* คอมเมนต์ */}
      {ephemeral ? (
        // แตะทะลุได้ -> ซูมวิดีโอผ่านคอมเมนต์ได้
        <View style={styles.ephemeralWrap} pointerEvents="none">
          {ephemeralData.map(({ m, opacity }) => {
            const opacityStyle = { opacity };
            return (
              <React.Fragment key={m.id}>
                {renderRow(m, opacityStyle)}
              </React.Fragment>
            );
          })}
        </View>
      ) : (
        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={invertedData}
          keyExtractor={item => item.id}
          renderItem={({ item }) => renderRow(item)}
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
        <View style={styles.inputBar}>
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
