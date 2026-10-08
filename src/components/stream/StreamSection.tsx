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
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { IS_TABLET } from '../../constants/platform';
import { logWarn } from '../../helpers/logger';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import {
  AppFontSize,
  AppRadius,
  PRESSED_OPACITY,
  sharedTopSpace,
} from '../../styles/sharedstyles';
import AppSpinner from '../loading/AppSpinner';
import Search, { SEARCH_BAR_HEIGHT } from '../search/Search';
import SegmentedPills from '../segments/SegmentedPills';
import AppEmptyState from '../states/AppEmptyState';
import AppFlatList from '../views/AppFlatList';
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
 * Live page: same header/search/empty-state components as the Course tab,
 * a playing preview of one live, filter pills, and the list of lives.
 */
const StreamSection = () => {
  const { verticalScale, responsiveRadius } = useResponsive();

  const [showViewer, setShowViewer] = useState(false);
  const [showPublisher, setShowPublisher] = useState(false);
  const [selectedStream, setSelectedStream] =
    useState<LiveStreamSession | null>(null);
  const [liveStreams, setLiveStreams] = useState<LiveStreamSession[]>([]);
  const [loadedOnce, setLoadedOnce] = useState(false);

  const [tab, setTab] = useState<TabKey>('live');
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
      }
    }
  }, []);

  // For onPress/onRefresh (don't pass the event straight into loadStreams)
  const fetchStreams = useCallback(() => loadStreams(false), [loadStreams]);

  // Spinner under the search bar only while the user pulls to refresh
  // (reloads after closing a live happen quietly)
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const onPullRefresh = useCallback(async () => {
    setPullRefreshing(true);
    try {
      await loadStreams(false);
    } finally {
      if (mountedRef.current) setPullRefreshing(false);
    }
  }, [loadStreams]);

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

  const searchBarHeight = verticalScale(SEARCH_BAR_HEIGHT);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        list: { flex: 1 },
        // flexGrow lets the empty message fill (and center in) the space left
        content: {
          flexGrow: 1,
          gap: verticalScale(IS_TABLET ? 14 : 12),
        },
        // Same header as the Course tab: big title + search bar
        headerRow: {
          marginTop: sharedTopSpace,
          marginBottom: verticalScale(IS_TABLET ? 24 : 18),
        },
        title: {
          marginBottom: verticalScale(12),
        },
        goLiveIconBtn: {
          width: searchBarHeight,
          height: searchBarHeight,
          borderRadius: responsiveRadius(AppRadius.md),
          backgroundColor: AppColors.backgroundInteractive,
          alignItems: 'center',
          justifyContent: 'center',
        },
        chipsTop: { marginTop: 0 },
        chips: {
          marginTop: verticalScale(IS_TABLET ? 20 : 16),
          marginBottom: verticalScale(4),
        },
        loading: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
        empty: {
          flex: 1,
          justifyContent: 'center',
          paddingVertical: verticalScale(24),
        },
      }),
    [verticalScale, responsiveRadius, searchBarHeight],
  );

  const staticHeader = (
    <View style={styles.headerRow}>
      <AppText
        style={styles.title}
        fontSize={AppFontSize.h1}
        fontWeight="semiBold"
      >
        ไลฟ์สด
      </AppText>

      <Search
        value={query}
        onChangeText={setQuery}
        placeholder="ค้นหาชื่อไลฟ์หรือผู้ไลฟ์"
        withHorizontalPadding={false}
        trailingAction={
          <TouchableOpacity
            style={styles.goLiveIconBtn}
            activeOpacity={PRESSED_OPACITY}
            onPress={() => setShowPublisher(true)}
            accessibilityRole="button"
            accessibilityLabel="เริ่มไลฟ์"
          >
            <Ionicons
              name="videocam-outline"
              size={IS_TABLET ? 24 : 20}
              color={AppColors.white}
            />
          </TouchableOpacity>
        }
      />
    </View>
  );

  const listHeader = (
    <View>
      {/* No one live: skip the box, the list below already says so */}
      {featured && (
        <LiveFeaturedPreview
          stream={featured}
          paused={showViewer || showPublisher}
          onPress={handleWatchStream}
        />
      )}

      <View style={[styles.chips, !featured && styles.chipsTop]}>
        <SegmentedPills
          options={TABS.map(t => ({ label: t.label, value: t.key }))}
          value={tab}
          onChange={setTab}
          fontSize={AppFontSize.caption}
          paddingVertical={6}
          paddingHorizontal={14}
        />
      </View>
    </View>
  );

  // First load: one spinner in the middle of the screen (no header/cards yet)
  const firstLoad = !loadedOnce;

  const emptyList = firstLoad ? (
    <View style={styles.loading}>
      <AppSpinner size="large" />
    </View>
  ) : (
    <AppEmptyState
      containerStyle={styles.empty}
      icon={query.trim() ? 'search-outline' : 'radio-outline'}
      title={
        query.trim()
          ? 'ไม่พบไลฟ์ที่ค้นหา'
          : tab === 'following'
          ? 'ยังไม่มีไลฟ์จากคนที่คุณติดตาม'
          : 'ยังไม่มีไลฟ์ในตอนนี้'
      }
    />
  );

  return (
    <>
      <AppFlatList
        style={styles.list}
        contentContainerStyle={styles.content}
        withHorizontalPadding
        staticHeader={staticHeader}
        header={firstLoad ? null : listHeader}
        data={firstLoad ? [] : visibleStreams}
        keyExtractor={(item: LiveStreamSession) => item.id}
        ListEmptyComponent={emptyList}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        renderItem={({ item }: { item: LiveStreamSession }) => (
          <LiveListItem
            stream={item}
            following={followed.has(hostKey(item))}
            onPress={handleWatchStream}
            onToggleFollow={toggleFollow}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={pullRefreshing}
            onRefresh={onPullRefresh}
            tintColor={AppColors.primary}
            colors={[AppColors.primary]}
            progressBackgroundColor={AppColors.sheet}
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
