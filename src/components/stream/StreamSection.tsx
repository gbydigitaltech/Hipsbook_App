import { Ionicons } from '@react-native-vector-icons/ionicons';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AppState,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { logWarn } from '../../helpers/logger';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import { AppFontSize, PRESSED_OPACITY } from '../../styles/sharedstyles';
import AppSpinner from '../loading/AppSpinner';
import AppText from '../texts/AppText';
import LiveFeaturedPreview from './LiveFeaturedPreview';
import LiveListItem from './LiveListItem';
import LiveViewer from './LiveViewer';
import StreamPublisher from './StreamPublisher';
import liveStreamService, { LiveStreamSession } from './liveStreamService';

const LIVE_LIST_REFRESH_MS = 15000;

type TabKey = 'live' | 'recommended' | 'following';
const TABS: { key: TabKey; label: string }[] = [
  { key: 'live', label: 'กำลังไลฟ์อยู่ในขณะนี้' },
  { key: 'recommended', label: 'แนะนำ' },
  { key: 'following', label: 'ที่ติดตาม' },
];

/** Who a live belongs to (used for "follow" until the backend has a follow API) */
const hostKey = (s: LiveStreamSession) => s.hostName || s.logoUrl || s.id;

/**
 * Live page (Figma "Live"): header + search, a playing preview of one live,
 * filter chips, and the list of lives.
 */
const StreamSection = () => {
  const { scale, verticalScale } = useResponsive();
  const insets = useSafeAreaInsets();

  const [showViewer, setShowViewer] = useState(false);
  const [showPublisher, setShowPublisher] = useState(false);
  const [selectedStream, setSelectedStream] =
    useState<LiveStreamSession | null>(null);
  const [liveStreams, setLiveStreams] = useState<LiveStreamSession[]>([]);
  const [loadingStreams, setLoadingStreams] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);

  const [tab, setTab] = useState<TabKey>('live');
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  // TODO: replace with the backend follow API when it exists (local only for now)
  const [followed, setFollowed] = useState<Set<string>>(() => new Set());

  // Avoid overlapping requests: if the previous one hasn't finished (slow server), skip this round
  const inFlightRef = useRef(false);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadStreams = useCallback(async (silent: boolean) => {
    if (inFlightRef.current && silent) return;
    inFlightRef.current = true;
    if (!silent) setLoadingStreams(true);
    // Manual refresh: retry once on timeout/network drop | silent refresh: don't, wait for the next round
    const attempts = silent ? 1 : 2;
    try {
      for (let i = 0; i < attempts; i++) {
        try {
          // Let the API filter to Live only (same as the web /live page)
          const list = await liveStreamService.list({
            status: 'Live',
            pageSize: 50,
          });
          if (mountedRef.current) {
            setLiveStreams(list.filter(s => s.status === 'Live'));
          }
          return;
        } catch (e: any) {
          const noResponse = e?.status == null;
          if (!noResponse || i === attempts - 1) {
            // API temporarily down: keep the current list instead of clearing it (would look like no lives)
            logWarn(
              'Stream',
              '[StreamSection] fetch live list failed (keep old list)',
              e?.message ?? e,
            );
            return;
          }
        }
      }
    } finally {
      inFlightRef.current = false;
      if (mountedRef.current) {
        setLoadedOnce(true);
        if (!silent) setLoadingStreams(false);
      }
    }
  }, []);

  // For onPress/onRefresh (don't pass the event straight into loadStreams)
  const fetchStreams = useCallback(() => loadStreams(false), [loadStreams]);

  useEffect(() => {
    fetchStreams();
  }, [fetchStreams]);

  // App in background -> stop refreshing (fetch again on return)
  const [appActive, setAppActive] = useState(
    AppState.currentState === 'active',
  );
  useEffect(() => {
    const sub = AppState.addEventListener('change', st =>
      setAppActive(st === 'active'),
    );
    return () => sub.remove();
  }, []);

  // Auto-refresh the list (silently) while on this screen and not watching/hosting a live
  // Schedule the next round only after the previous one finishes (setInterval would overlap on a slow server)
  useEffect(() => {
    if (showViewer || showPublisher || !appActive) return;
    let cancelled = false;
    let t: ReturnType<typeof setTimeout>;
    const tick = async () => {
      await loadStreams(true);
      if (!cancelled) t = setTimeout(tick, LIVE_LIST_REFRESH_MS);
    };
    t = setTimeout(tick, LIVE_LIST_REFRESH_MS);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [loadStreams, showViewer, showPublisher, appActive]);

  const handleWatchStream = useCallback((stream: LiveStreamSession) => {
    setSelectedStream(stream);
    setShowViewer(true);
  }, []);

  const handleCloseViewer = useCallback(() => {
    setShowViewer(false);
    setSelectedStream(null);
    fetchStreams();
  }, [fetchStreams]);

  const handleClosePublisher = useCallback(() => {
    setShowPublisher(false);
    fetchStreams();
  }, [fetchStreams]);

  const toggleFollow = useCallback((stream: LiveStreamSession) => {
    const key = hostKey(stream);
    setFollowed(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // Featured preview = the live with the most viewers
  const featured = useMemo(
    () =>
      liveStreams.length === 0
        ? null
        : [...liveStreams].sort(
            (a, b) => (b.currentViewers ?? 0) - (a.currentViewers ?? 0),
          )[0],
    [liveStreams],
  );

  const visibleStreams = useMemo(() => {
    let list = liveStreams;
    if (tab === 'recommended') {
      list = [...list].sort(
        (a, b) => (b.currentViewers ?? 0) - (a.currentViewers ?? 0),
      );
    } else if (tab === 'following') {
      list = list.filter(s => followed.has(hostKey(s)));
    } else {
      // newest first
      list = [...list].sort(
        (a, b) =>
          (Date.parse(b.createdAt ?? '') || 0) -
          (Date.parse(a.createdAt ?? '') || 0),
      );
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        s =>
          s.title.toLowerCase().includes(q) ||
          (s.hostName ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [liveStreams, tab, followed, query]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        list: { flex: 1 },
        // flexGrow lets the empty message fill (and center in) the space left
        content: {
          flexGrow: 1,
          paddingHorizontal: scale(8),
          paddingBottom: verticalScale(24),
          gap: verticalScale(9),
        },
        header: {
          paddingTop: insets.top + verticalScale(12),
          paddingHorizontal: scale(10),
          height: insets.top + verticalScale(12) + scale(32),
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        headerTitleWrap: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: scale(32),
          alignItems: 'center',
          justifyContent: 'center',
        },
        headerTitle: { color: AppColors.grayLight },
        iconBtn: {
          width: scale(32),
          height: scale(32),
          alignItems: 'center',
          justifyContent: 'center',
        },
        searchBox: {
          marginTop: verticalScale(10),
          height: scale(40),
          borderRadius: 99,
          paddingHorizontal: scale(14),
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(8),
          backgroundColor: AppColors.backgroundInteractive,
        },
        searchInput: {
          flex: 1,
          color: AppColors.white,
          fontSize: scale(14),
          paddingVertical: 0,
        },
        featured: { marginTop: verticalScale(14) },
        chips: {
          marginTop: verticalScale(20),
          marginBottom: verticalScale(5),
          flexDirection: 'row',
          gap: scale(12),
        },
        chip: {
          height: scale(28),
          paddingHorizontal: scale(12),
          borderRadius: 99,
          justifyContent: 'center',
          backgroundColor: AppColors.surface,
        },
        chipActive: {
          backgroundColor: AppColors.primary,
        },
        white: { color: AppColors.white },
        empty: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: verticalScale(24),
        },
        emptyText: { color: AppColors.textTertiary, textAlign: 'center' },
        emptyCard: {
          height: verticalScale(191),
          borderRadius: scale(6),
          backgroundColor: AppColors.sheet,
          alignItems: 'center',
          justifyContent: 'center',
          gap: verticalScale(10),
        },
        goLiveBtn: {
          height: scale(36),
          paddingHorizontal: scale(18),
          borderRadius: 99,
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(6),
          backgroundColor: AppColors.primary,
        },
      }),
    [scale, verticalScale, insets.top],
  );

  const header = (
    <View>
      <View style={styles.header}>
        {/* Left: start a live | center: title | right: search */}
        <Pressable
          style={styles.iconBtn}
          onPress={() => setShowPublisher(true)}
          hitSlop={8}
          accessibilityLabel="เริ่มไลฟ์"
        >
          <Ionicons
            name="videocam-outline"
            size={scale(24)}
            color={AppColors.white}
          />
        </Pressable>
        <View style={styles.headerTitleWrap} pointerEvents="none">
          <AppText
            fontSize={AppFontSize.subtitle}
            fontWeight="medium"
            style={styles.headerTitle}
          >
            Live
          </AppText>
        </View>
        <Pressable
          style={styles.iconBtn}
          onPress={() => {
            setSearchOpen(o => !o);
            if (searchOpen) setQuery('');
          }}
          hitSlop={8}
          accessibilityLabel="ค้นหาไลฟ์"
        >
          <Ionicons
            name={searchOpen ? 'close' : 'search-outline'}
            size={scale(24)}
            color={AppColors.white}
          />
        </Pressable>
      </View>

      {searchOpen && (
        <View style={styles.searchBox}>
          <Ionicons
            name="search-outline"
            size={scale(16)}
            color={AppColors.textTertiary}
          />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="ค้นหาชื่อไลฟ์หรือผู้ไลฟ์"
            placeholderTextColor={AppColors.textTertiary}
            style={styles.searchInput}
            autoFocus
            returnKeyType="search"
          />
        </View>
      )}

      <View style={styles.featured}>
        {featured ? (
          <LiveFeaturedPreview
            stream={featured}
            paused={showViewer || showPublisher}
            onPress={handleWatchStream}
          />
        ) : (
          <View style={styles.emptyCard}>
            {!loadedOnce ? (
              <AppSpinner size="large" />
            ) : (
              <>
                <Ionicons
                  name="radio-outline"
                  size={scale(36)}
                  color={AppColors.textTertiary}
                />
                <AppText fontSize={AppFontSize.body} style={styles.emptyText}>
                  ยังไม่มีใครไลฟ์อยู่ตอนนี้
                </AppText>
                <Pressable
                  style={({ pressed }) => [
                    styles.goLiveBtn,
                    pressed && { opacity: PRESSED_OPACITY },
                  ]}
                  onPress={() => setShowPublisher(true)}
                >
                  <Ionicons
                    name="videocam"
                    size={scale(16)}
                    color={AppColors.white}
                  />
                  <AppText
                    fontSize={AppFontSize.body}
                    fontWeight="medium"
                    style={styles.white}
                  >
                    เริ่มไลฟ์
                  </AppText>
                </Pressable>
              </>
            )}
          </View>
        )}
      </View>

      <View style={styles.chips}>
        {TABS.map(t => {
          const active = tab === t.key;
          return (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              style={[styles.chip, active && styles.chipActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <AppText fontSize={AppFontSize.caption} style={styles.white}>
                {t.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const emptyList = loadedOnce ? (
    <View style={styles.empty}>
      <AppText fontSize={AppFontSize.body} style={styles.emptyText}>
        {query.trim()
          ? 'ไม่พบไลฟ์ที่ค้นหา'
          : tab === 'following'
          ? 'ยังไม่มีไลฟ์จากคนที่คุณติดตาม'
          : 'ยังไม่มีไลฟ์ในตอนนี้'}
      </AppText>
    </View>
  ) : null;

  return (
    <>
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.content}
        data={visibleStreams}
        keyExtractor={item => item.id}
        ListHeaderComponent={header}
        ListEmptyComponent={emptyList}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <LiveListItem
            stream={item}
            following={followed.has(hostKey(item))}
            onPress={handleWatchStream}
            onToggleFollow={toggleFollow}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={loadingStreams && loadedOnce}
            onRefresh={fetchStreams}
            tintColor={AppColors.primary}
            colors={[AppColors.primary]}
            progressBackgroundColor={AppColors.sheet}
            progressViewOffset={insets.top}
          />
        }
      />

      <LiveViewer
        visible={showViewer}
        onClose={handleCloseViewer}
        streamId={selectedStream?.id}
        streamKey={selectedStream?.streamKey}
        title={selectedStream?.title}
      />

      <StreamPublisher visible={showPublisher} onClose={handleClosePublisher} />
    </>
  );
};

export default StreamSection;
