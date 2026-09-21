import axios, { AxiosError, AxiosInstance } from 'axios';
import { log, logError } from '../../helpers/logger';
import { STREAM_CONFIG, getHlsUrl } from './streamConfig';

export type LiveStreamSession = {
  id: string;
  title: string;
  description?: string;
  streamKey: string;
  ingestUrl: string;
  status: 'Idle' | 'Connecting' | 'Live' | 'Ended' | 'Error';
  visibility: 'Private' | 'Public' | 'Unlisted';
  currentViewers?: number;
  playbackHlsUrl?: string;
  recordingEnabled?: boolean;
  category?: string;
  tags?: string;
  createdAt?: string;
};

export type CreateStreamParams = {
  title: string;
  description?: string;
  visibility?: 'Private' | 'Public' | 'Unlisted';
  recordingEnabled?: boolean;
  category?: string;
  tags?: string;
};

export type PlaybackUrls = {
  hlsUrl: string;
  webrtcUrl?: string;
};

function pick<T>(
  raw: Record<string, unknown>,
  camel: string,
  pascal: string,
): T | undefined {
  const a = raw[camel];
  const b = raw[pascal];
  return (a !== undefined && a !== null ? a : b) as T | undefined;
}

function unwrapApiPayload(raw: any): any {
  if (!raw || typeof raw !== 'object') return raw;
  const r = raw as Record<string, unknown>;
  const nested =
    r.data ?? r.result ?? r.value ?? r.payload ?? r.liveStream ?? r.LiveStream;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    return nested;
  }
  return raw;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseCreatedStreamId(raw: any): string | null {
  if (raw == null) return null;
  if (typeof raw === 'string') {
    const s = raw.trim().replace(/^["']|["']$/g, '');
    return UUID_RE.test(s) ? s : null;
  }
  if (typeof raw === 'object') {
    const r = unwrapApiPayload(raw) as Record<string, unknown>;
    const id =
      r.id ??
      r.Id ??
      r.liveStreamId ??
      r.LiveStreamId ??
      r.streamId ??
      r.StreamId;
    if (typeof id === 'string' && UUID_RE.test(id.trim())) return id.trim();
  }
  return null;
}

export function normalizeLiveStreamSession(raw: any): LiveStreamSession {
  const unwrapped = unwrapApiPayload(raw);
  if (!unwrapped || typeof unwrapped !== 'object') {
    return unwrapped as LiveStreamSession;
  }
  const r = unwrapped as Record<string, unknown>;
  const idRaw =
    pick<string>(r, 'id', 'Id') ??
    pick<string>(r, 'liveStreamId', 'LiveStreamId') ??
    pick<string>(r, 'streamId', 'StreamId');
  const id = idRaw != null && idRaw !== '' ? String(idRaw) : '';
  const streamKey = String(pick<string>(r, 'streamKey', 'StreamKey') ?? '');
  const ingestUrl = String(pick<string>(r, 'ingestUrl', 'IngestUrl') ?? '');
  return {
    id,
    title: String(pick<string>(r, 'title', 'Title') ?? ''),
    description: pick<string>(r, 'description', 'Description'),
    streamKey,
    ingestUrl,
    status: (pick<string>(r, 'status', 'Status') ??
      'Idle') as LiveStreamSession['status'],
    visibility: (pick<string>(r, 'visibility', 'Visibility') ??
      'Public') as LiveStreamSession['visibility'],
    currentViewers: pick<number>(r, 'currentViewers', 'CurrentViewers'),
    playbackHlsUrl: pick<string>(r, 'playbackHlsUrl', 'PlaybackHlsUrl'),
    recordingEnabled: pick<boolean>(r, 'recordingEnabled', 'RecordingEnabled'),
    category: pick<string>(r, 'category', 'Category'),
    tags: pick<string>(r, 'tags', 'Tags'),
    createdAt:
      pick<string>(r, 'createdAt', 'CreatedAt') ??
      pick<string>(r, 'createdDate', 'CreatedDate'),
  };
}

function normalizePlayback(raw: any): PlaybackUrls {
  const unwrapped = unwrapApiPayload(raw);
  if (!unwrapped || typeof unwrapped !== 'object') {
    return { hlsUrl: '', webrtcUrl: undefined };
  }
  const r = unwrapped as Record<string, unknown>;
  const hlsUrl =
    pick<string>(r, 'hlsUrl', 'HlsUrl') ??
    pick<string>(r, 'hlsPlaybackUrl', 'HlsPlaybackUrl') ??
    pick<string>(r, 'playbackHlsUrl', 'PlaybackHlsUrl') ??
    pick<string>(r, 'playbackUrl', 'PlaybackUrl');
  const webrtc =
    pick<string>(r, 'webrtcUrl', 'WebrtcUrl') ??
    pick<string>(r, 'webrtcPlaybackUrl', 'WebrtcPlaybackUrl');
  return {
    hlsUrl: String(hlsUrl ?? ''),
    webrtcUrl: webrtc,
  };
}

function extractErrorMessage(err: AxiosError): string {
  const data = err.response?.data as any;
  if (!data) return err.message;

  if (typeof data === 'string') return data;

  if (data.errors && typeof data.errors === 'object') {
    const msgs = Object.entries(data.errors)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
      .join('\n');
    if (msgs) return msgs;
  }

  if (data.detail) return data.detail;
  if (data.message) return data.message;
  if (data.title && data.title !== 'One or more validation errors occurred.')
    return data.title;

  return JSON.stringify(data);
}

class LiveStreamService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: STREAM_CONFIG.apiBaseUrl,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': STREAM_CONFIG.apiKey,
      },
    });

    this.client.interceptors.response.use(
      res => {
        const fullUrl = `${res.config.baseURL ?? ''}${res.config.url ?? ''}`;
        log('Stream', 
          `[LiveStream] ${
            res.status
          } ${res.config.method?.toUpperCase()} ${fullUrl}`,
        );
        return res;
      },
      (err: AxiosError) => {
        const status = err.response?.status;
        const msg = extractErrorMessage(err);
        const fullUrl = `${err.config?.baseURL ?? ''}${err.config?.url ?? ''}`;
        logError('Stream', 
          `[LiveStream] FAIL ${status} ${err.config?.method?.toUpperCase()} ${fullUrl}`,
        );
        logError('Stream', 
          `[LiveStream] Response:`,
          JSON.stringify(err.response?.data),
        );

        const readable = new Error(`${status}: ${msg}`);
        (readable as any).status = status;
        (readable as any).serverData = err.response?.data;
        throw readable;
      },
    );
  }

  async list(
    params: { pageSize?: number; page?: number } = {},
  ): Promise<LiveStreamSession[]> {
    const res = await this.client.get('/livestream', { params });
    const raw = Array.isArray(res.data) ? res.data : res.data.items ?? [];
    return raw.map((item: any) => normalizeLiveStreamSession(item));
  }

  async getById(id: string): Promise<LiveStreamSession> {
    const res = await this.client.get(`/livestream/${id}`);
    return normalizeLiveStreamSession(res.data);
  }

  async create(data: CreateStreamParams): Promise<LiveStreamSession> {
    const body: Record<string, any> = {
      title: data.title,
      visibility: data.visibility ?? 'Public',
      recordingEnabled: data.recordingEnabled ?? true,
    };
    if (data.description) body.description = data.description;
    if (data.category) body.category = data.category;
    if (data.tags) body.tags = data.tags;

    log('Stream', '[LiveStream] POST /livestream body:', JSON.stringify(body));
    const res = await this.client.post('/livestream', body);
    log('Stream', '[LiveStream] POST /livestream raw:', JSON.stringify(res.data));

    const createdId = parseCreatedStreamId(res.data);
    if (createdId) {
      log('Stream', 
        '[LiveStream] POST /livestream คืนค่าแค่ id (string) — ดึงรายละเอียดด้วย GET /livestream/',
        createdId,
      );
      return this.getById(createdId);
    }

    return normalizeLiveStreamSession(res.data);
  }

  async update(
    id: string,
    data: Partial<CreateStreamParams>,
  ): Promise<LiveStreamSession> {
    const body: Record<string, any> = {};
    if (data.title !== undefined) body.title = data.title;
    if (data.description !== undefined) body.description = data.description;
    if (data.visibility !== undefined) body.visibility = data.visibility;
    if (data.recordingEnabled !== undefined)
      body.recordingEnabled = data.recordingEnabled;
    if (data.category !== undefined) body.category = data.category;
    if (data.tags !== undefined) body.tags = data.tags;

    const res = await this.client.put(`/livestream/${id}`, body);
    return normalizeLiveStreamSession(res.data);
  }

  async remove(id: string): Promise<void> {
    await this.client.delete(`/livestream/${id}`);
  }

  async start(id: string): Promise<LiveStreamSession> {
    const safeId = String(id ?? '').trim();
    if (!safeId || safeId === 'undefined') {
      throw new Error('ไม่มี stream id หลังสร้าง session');
    }
    const path = `/livestream/${safeId}/start`;
    const res = await this.client.post(path);
    return normalizeLiveStreamSession(res.data);
  }

  async stop(id: string): Promise<LiveStreamSession> {
    const res = await this.client.post(`/livestream/${id}/stop`);
    return normalizeLiveStreamSession(res.data);
  }

  async resetKey(id: string): Promise<LiveStreamSession> {
    const res = await this.client.post(`/livestream/${id}/reset-key`);
    return normalizeLiveStreamSession(res.data);
  }

  async getPlayback(id: string): Promise<PlaybackUrls> {
    const res = await this.client.get(`/livestream/${id}/playback`);
    return normalizePlayback(res.data);
  }

  async getHealth(id: string) {
    const res = await this.client.get(`/livestream/${id}/health`);
    return res.data;
  }

  async getAnalytics(id: string) {
    const res = await this.client.get(`/livestream/${id}/analytics`);
    return res.data;
  }

  buildHlsUrl(streamKey: string): string {
    return getHlsUrl(streamKey);
  }
}

const liveStreamService = new LiveStreamService();
export default liveStreamService;
