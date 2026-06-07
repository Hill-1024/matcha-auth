import { Capacitor, CapacitorHttp } from '@capacitor/core';
import {
  Token,
  WebDavChangeUploadMode,
  WebDavRuntimeState,
  WebDavSettings,
} from '../types';

const TOKENS_STORAGE_KEY = 'matcha_tokens';
const SETTINGS_STORAGE_KEY = 'matcha_webdav_settings';
const RUNTIME_STORAGE_KEY = 'matcha_webdav_runtime';
const LOCAL_STATE_STORAGE_KEY = 'matcha_webdav_local_state';

const SETTINGS_CHANGED_EVENT = 'matcha-webdav-settings-changed';
const RUNTIME_CHANGED_EVENT = 'matcha-webdav-runtime-changed';
const TOKENS_CHANGED_EVENT = 'matcha-tokens-changed';
const TOKENS_REMOTE_EVENT = 'matcha-tokens-remote-update';

type PersistedToken = Pick<Token, 'id' | 'issuer' | 'account' | 'secret' | 'icon' | 'color' | 'period'>;

interface SyncTokenRecord {
  token: PersistedToken;
  updatedAt: number;
  order: number;
}

interface SyncDeletedRecord {
  id: string;
  deletedAt: number;
}

interface SyncBackupDocument {
  app: 'matcha-auth';
  schemaVersion: 1;
  deviceId: string;
  updatedAt: number;
  records: SyncTokenRecord[];
  deleted: SyncDeletedRecord[];
  partial?: boolean;
}

interface WebDavLocalState {
  deviceId: string;
  tokenMeta: Record<string, number>;
  deletedMeta: Record<string, number>;
  knownTokens: Record<string, PersistedToken>;
  pendingUpserts: string[];
  pendingDeletes: string[];
  lastSnapshot: string;
}

interface WebDavSyncResult {
  changed: boolean;
  message: string;
}

interface WebDavHttpResponse {
  status: number;
  ok: boolean;
  json: () => Promise<unknown>;
}

const DEFAULT_SETTINGS: WebDavSettings = {
  enabled: false,
  serverUrl: '',
  username: '',
  password: '',
  remotePath: '/MatchaAuth/tokens.json',
  launchSyncDelay: 'never',
  periodicSyncInterval: 60,
  changeUploadMode: 'off',
};

const DEFAULT_RUNTIME: WebDavRuntimeState = {
  status: 'idle',
};

let activeSync: Promise<WebDavSyncResult> | null = null;
let schedulerCleanup: (() => void) | null = null;

export const loadWebDavSettings = (): WebDavSettings => {
  const saved = readJson<Partial<WebDavSettings>>(SETTINGS_STORAGE_KEY, {});

  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    periodicSyncInterval: saved.periodicSyncInterval === 'off'
      ? 'off'
      : saved.periodicSyncInterval === 30 ? 30 : 60,
    changeUploadMode: normalizeChangeUploadMode(saved.changeUploadMode),
    launchSyncDelay: saved.launchSyncDelay === '1s' || saved.launchSyncDelay === '10s'
      ? saved.launchSyncDelay
      : 'never',
  };
};

export const saveWebDavSettings = (settings: WebDavSettings) => {
  const nextSettings = {
    ...DEFAULT_SETTINGS,
    ...settings,
    serverUrl: settings.serverUrl.trim(),
    remotePath: settings.remotePath.trim() || DEFAULT_SETTINGS.remotePath,
  };

  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(nextSettings));
  window.dispatchEvent(new CustomEvent<WebDavSettings>(SETTINGS_CHANGED_EVENT, { detail: nextSettings }));
};

export const subscribeWebDavSettings = (listener: (settings: WebDavSettings) => void) => {
  const handler = (event: Event) => listener((event as CustomEvent<WebDavSettings>).detail);
  window.addEventListener(SETTINGS_CHANGED_EVENT, handler);
  return () => window.removeEventListener(SETTINGS_CHANGED_EVENT, handler);
};

export const loadWebDavRuntimeState = (): WebDavRuntimeState => {
  return {
    ...DEFAULT_RUNTIME,
    ...readJson<Partial<WebDavRuntimeState>>(RUNTIME_STORAGE_KEY, {}),
  };
};

export const subscribeWebDavRuntimeState = (listener: (state: WebDavRuntimeState) => void) => {
  const handler = (event: Event) => listener((event as CustomEvent<WebDavRuntimeState>).detail);
  window.addEventListener(RUNTIME_CHANGED_EVENT, handler);
  return () => window.removeEventListener(RUNTIME_CHANGED_EVENT, handler);
};

export const readTokensFromStorage = (): Token[] => {
  const stored = readJson<unknown>(TOKENS_STORAGE_KEY, []);
  if (!Array.isArray(stored)) {
    return [];
  }

  return stored.flatMap((item) => {
    const token = hydrateStoredToken(item);
    return token ? [token] : [];
  });
};

export const writeTokensToStorage = (tokens: Token[]) => {
  localStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(tokens.map(toStoredToken)));
};

export const createTokenSnapshot = (tokens: Token[]) => {
  return JSON.stringify(tokens.map(toPersistedToken));
};

export const rememberTokenSnapshot = (tokens: Token[]) => {
  const state = loadLocalState();
  state.knownTokens = toTokenRecord(tokens);
  state.lastSnapshot = createTokenSnapshot(tokens);
  for (const token of tokens) {
    if (!state.tokenMeta[token.id]) {
      state.tokenMeta[token.id] = Date.now();
    }
  }
  saveLocalState(state);
};

export const notifyLocalTokensChanged = (tokens: Token[]) => {
  const now = Date.now();
  const currentTokens = toTokenRecord(tokens);
  const state = loadLocalState();
  const pendingUpserts = new Set(state.pendingUpserts);
  const pendingDeletes = new Set(state.pendingDeletes);

  for (const [id, token] of Object.entries(currentTokens)) {
    const knownToken = state.knownTokens[id];
    if (!knownToken || JSON.stringify(knownToken) !== JSON.stringify(token)) {
      state.tokenMeta[id] = now;
      delete state.deletedMeta[id];
      pendingUpserts.add(id);
      pendingDeletes.delete(id);
    }
  }

  for (const id of Object.keys(state.knownTokens)) {
    if (!currentTokens[id]) {
      state.deletedMeta[id] = now;
      delete state.tokenMeta[id];
      pendingDeletes.add(id);
      pendingUpserts.delete(id);
    }
  }

  state.knownTokens = currentTokens;
  state.pendingUpserts = Array.from(pendingUpserts);
  state.pendingDeletes = Array.from(pendingDeletes);
  state.lastSnapshot = createTokenSnapshot(tokens);
  saveLocalState(state);
  window.dispatchEvent(new CustomEvent(TOKENS_CHANGED_EVENT));
};

export const subscribeTokenRemoteUpdates = (listener: (tokens: Token[]) => void) => {
  const handler = (event: Event) => listener((event as CustomEvent<Token[]>).detail);
  window.addEventListener(TOKENS_REMOTE_EVENT, handler);
  return () => window.removeEventListener(TOKENS_REMOTE_EVENT, handler);
};

export const performWebDavSync = async (reason = 'manual'): Promise<WebDavSyncResult> => {
  if (activeSync) {
    return activeSync;
  }

  activeSync = runWebDavSync(reason)
    .finally(() => {
      activeSync = null;
    });

  return activeSync;
};

export const uploadLocalWebDavBackup = async (reason = 'manual-upload'): Promise<WebDavSyncResult> => {
  const settings = loadWebDavSettings();

  try {
    assertWebDavReady(settings);
    setRuntimeState({ status: 'syncing', lastReason: reason });
    const tokens = readTokensFromStorage();
    const backup = buildBackupFromLocal(tokens);
    await uploadBackupDocument(settings, settings.remotePath, backup);
    clearPendingChanges();
    setRuntimeState({ status: 'success', lastSyncAt: new Date().toISOString(), lastReason: reason });
    return { changed: true, message: 'uploaded' };
  } catch (error) {
    setRuntimeState({ status: 'error', lastError: getErrorMessage(error), lastReason: reason });
    throw error;
  }
};

export const startWebDavSyncScheduler = () => {
  if (schedulerCleanup) {
    schedulerCleanup();
  }

  let launchTimer: number | undefined;
  let intervalTimer: number | undefined;
  let changeTimer: number | undefined;

  const clearTimers = () => {
    if (launchTimer) window.clearTimeout(launchTimer);
    if (intervalTimer) window.clearInterval(intervalTimer);
    if (changeTimer) window.clearTimeout(changeTimer);
    launchTimer = undefined;
    intervalTimer = undefined;
    changeTimer = undefined;
  };

  const setupTimers = () => {
    clearTimers();
    const settings = loadWebDavSettings();
    if (!settings.enabled) {
      return;
    }

    if (settings.launchSyncDelay !== 'never') {
      const delayMs = settings.launchSyncDelay === '1s' ? 1000 : 10000;
      launchTimer = window.setTimeout(() => {
        performWebDavSync('launch').catch(() => {});
      }, delayMs);
    }

    if (settings.periodicSyncInterval !== 'off') {
      intervalTimer = window.setInterval(() => {
        performWebDavSync('interval').catch(() => {});
      }, settings.periodicSyncInterval * 1000);
    }
  };

  const handleTokensChanged = () => {
    const settings = loadWebDavSettings();
    if (!settings.enabled || settings.changeUploadMode === 'off') {
      return;
    }

    if (changeTimer) {
      window.clearTimeout(changeTimer);
    }

    changeTimer = window.setTimeout(() => {
      const latestSettings = loadWebDavSettings();
      if (!latestSettings.enabled || latestSettings.changeUploadMode === 'off') {
        return;
      }

      if (latestSettings.changeUploadMode === 'incremental') {
        uploadIncrementalChanges('change-incremental').catch(() => {});
      } else {
        uploadLocalWebDavBackup('change-full').catch(() => {});
      }
    }, 1200);
  };

  window.addEventListener(SETTINGS_CHANGED_EVENT, setupTimers);
  window.addEventListener(TOKENS_CHANGED_EVENT, handleTokensChanged);
  setupTimers();

  schedulerCleanup = () => {
    clearTimers();
    window.removeEventListener(SETTINGS_CHANGED_EVENT, setupTimers);
    window.removeEventListener(TOKENS_CHANGED_EVENT, handleTokensChanged);
    schedulerCleanup = null;
  };

  return schedulerCleanup;
};

const runWebDavSync = async (reason: string): Promise<WebDavSyncResult> => {
  const settings = loadWebDavSettings();

  try {
    assertWebDavReady(settings);
    setRuntimeState({ status: 'syncing', lastReason: reason });
    const localTokens = readTokensFromStorage();
    const localBackup = buildBackupFromLocal(localTokens);
    const remoteBackup = await downloadConsolidatedBackup(settings);

    if (!remoteBackup) {
      await uploadBackupDocument(settings, settings.remotePath, localBackup);
      applyBackupToLocal(localBackup, false);
      setRuntimeState({ status: 'success', lastSyncAt: new Date().toISOString(), lastReason: reason });
      return { changed: true, message: 'created remote backup' };
    }

    const mergedBackup = mergeBackupDocuments(localBackup, remoteBackup);
    const localChanged = !areBackupsEquivalent(localBackup, mergedBackup);
    const remoteChanged = !areBackupsEquivalent(remoteBackup, mergedBackup);

    if (localChanged) {
      applyBackupToLocal(mergedBackup, true);
    } else {
      applyBackupToLocal(mergedBackup, false);
    }

    if (remoteChanged) {
      await uploadBackupDocument(settings, settings.remotePath, mergedBackup);
    }

    await deletePatchDocument(settings);
    clearPendingChanges();
    setRuntimeState({ status: 'success', lastSyncAt: new Date().toISOString(), lastReason: reason });

    return {
      changed: localChanged || remoteChanged,
      message: localChanged || remoteChanged ? 'synced changes' : 'already up to date',
    };
  } catch (error) {
    setRuntimeState({ status: 'error', lastError: getErrorMessage(error), lastReason: reason });
    throw error;
  }
};

const uploadIncrementalChanges = async (reason: string): Promise<WebDavSyncResult> => {
  const settings = loadWebDavSettings();

  try {
    assertWebDavReady(settings);
    setRuntimeState({ status: 'syncing', lastReason: reason });
    const localPatch = buildPendingPatchDocument();
    if (!localPatch.records.length && !localPatch.deleted.length) {
      setRuntimeState({ status: 'success', lastSyncAt: new Date().toISOString(), lastReason: reason });
      return { changed: false, message: 'no incremental changes' };
    }

    const patchPath = getPatchPath(settings.remotePath);
    const remotePatch = await downloadBackupDocument(settings, patchPath);
    const nextPatch = remotePatch ? mergeBackupDocuments(remotePatch, localPatch, true) : localPatch;
    await uploadBackupDocument(settings, patchPath, nextPatch);
    clearPendingChanges();
    setRuntimeState({ status: 'success', lastSyncAt: new Date().toISOString(), lastReason: reason });
    return { changed: true, message: 'uploaded incremental changes' };
  } catch (error) {
    setRuntimeState({ status: 'error', lastError: getErrorMessage(error), lastReason: reason });
    throw error;
  }
};

const downloadConsolidatedBackup = async (settings: WebDavSettings) => {
  const remoteBackup = await downloadBackupDocument(settings, settings.remotePath);
  const patchBackup = await downloadBackupDocument(settings, getPatchPath(settings.remotePath));

  if (remoteBackup && patchBackup) {
    return mergeBackupDocuments(remoteBackup, patchBackup);
  }

  return remoteBackup || patchBackup;
};

const downloadBackupDocument = async (settings: WebDavSettings, remotePath: string): Promise<SyncBackupDocument | null> => {
  const response = await fetchWebDav(settings, buildRemoteUrl(settings, remotePath), { method: 'GET' });
  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`WebDAV 下载失败 (${response.status})`);
  }

  const rawData = await response.json();
  return normalizeBackupDocument(rawData, loadLocalState().deviceId);
};

const uploadBackupDocument = async (settings: WebDavSettings, remotePath: string, document: SyncBackupDocument) => {
  await ensureParentCollections(settings, remotePath);
  const response = await fetchWebDav(settings, buildRemoteUrl(settings, remotePath), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
    },
    body: JSON.stringify({
      ...document,
      updatedAt: Date.now(),
    }, null, 2),
  });

  if (!response.ok) {
    throw new Error(`WebDAV 上传失败 (${response.status})`);
  }
};

const deletePatchDocument = async (settings: WebDavSettings) => {
  const response = await fetchWebDav(settings, buildRemoteUrl(settings, getPatchPath(settings.remotePath)), {
    method: 'DELETE',
  });

  if (response.status !== 404 && !response.ok) {
    console.warn(`WebDAV patch cleanup failed: ${response.status}`);
  }
};

const ensureParentCollections = async (settings: WebDavSettings, remotePath: string) => {
  const segments = getPathSegments(remotePath);
  segments.pop();

  let currentPath = '';
  for (const segment of segments) {
    currentPath += `/${segment}`;
    const response = await fetchWebDav(settings, buildRemoteUrl(settings, currentPath), {
      method: 'MKCOL',
    });

    if (![201, 405].includes(response.status) && !response.ok) {
      throw new Error(`WebDAV 目录创建失败 (${response.status})`);
    }
  }
};

const fetchWebDav = async (
  settings: WebDavSettings,
  url: string,
  init: RequestInit,
): Promise<WebDavHttpResponse> => {
  const headers = new Headers(init.headers);
  if (settings.username || settings.password) {
    headers.set('Authorization', `Basic ${toBase64(`${settings.username}:${settings.password}`)}`);
  }

  if (shouldUseNativeHttp()) {
    return fetchWebDavNative(url, init, headers);
  }

  try {
    const response = await fetch(url, {
      ...init,
      headers,
    });

    return {
      status: response.status,
      ok: response.ok,
      json: () => response.json(),
    };
  } catch (error) {
    throw new Error(getWebDavNetworkErrorMessage(error));
  }
};

const fetchWebDavNative = async (
  url: string,
  init: RequestInit,
  headers: Headers,
): Promise<WebDavHttpResponse> => {
  try {
    const response = await CapacitorHttp.request({
      url,
      method: init.method || 'GET',
      headers: headersToRecord(headers),
      data: typeof init.body === 'string' ? init.body : undefined,
      responseType: 'text',
      connectTimeout: 15000,
      readTimeout: 30000,
    });

    return {
      status: response.status,
      ok: response.status >= 200 && response.status < 300,
      json: async () => parseResponseData(response.data),
    };
  } catch (error) {
    throw new Error(getWebDavNetworkErrorMessage(error));
  }
};

const shouldUseNativeHttp = () => {
  return Capacitor.getPlatform() !== 'web' && Capacitor.isPluginAvailable('CapacitorHttp');
};

const headersToRecord = (headers: Headers): Record<string, string> => {
  const record: Record<string, string> = {};
  headers.forEach((value, key) => {
    record[key] = value;
  });
  return record;
};

const parseResponseData = (data: unknown) => {
  if (typeof data !== 'string') {
    return data;
  }

  if (!data.trim()) {
    return null;
  }

  return JSON.parse(data);
};

const buildBackupFromLocal = (tokens: Token[]): SyncBackupDocument => {
  const state = ensureLocalStateForTokens(tokens);
  const records = tokens.map((token, index) => ({
    token: toPersistedToken(token),
    updatedAt: state.tokenMeta[token.id] || Date.now(),
    order: index,
  }));

  return {
    app: 'matcha-auth',
    schemaVersion: 1,
    deviceId: state.deviceId,
    updatedAt: Date.now(),
    records,
    deleted: Object.entries(state.deletedMeta).map(([id, deletedAt]) => ({ id, deletedAt })),
  };
};

const buildPendingPatchDocument = (): SyncBackupDocument => {
  const state = loadLocalState();
  const tokens = readTokensFromStorage();
  const tokenMap = new Map(tokens.map((token) => [token.id, token]));
  const pendingUpserts = unique(state.pendingUpserts);
  const pendingDeletes = unique(state.pendingDeletes);

  return {
    app: 'matcha-auth',
    schemaVersion: 1,
    deviceId: state.deviceId,
    updatedAt: Date.now(),
    records: pendingUpserts.flatMap((id) => {
      const token = tokenMap.get(id);
      if (!token) {
        return [];
      }

      return [{
        token: toPersistedToken(token),
        updatedAt: state.tokenMeta[id] || Date.now(),
        order: tokens.findIndex((item) => item.id === id),
      }];
    }),
    deleted: pendingDeletes.map((id) => ({
      id,
      deletedAt: state.deletedMeta[id] || Date.now(),
    })),
    partial: true,
  };
};

const mergeBackupDocuments = (
  left: SyncBackupDocument,
  right: SyncBackupDocument,
  partial = false,
): SyncBackupDocument => {
  const records = new Map<string, SyncTokenRecord>();
  const deleted = new Map<string, SyncDeletedRecord>();

  for (const document of [left, right]) {
    for (const record of document.records) {
      const id = record.token.id;
      const existing = records.get(id);
      if (!existing || record.updatedAt >= existing.updatedAt) {
        records.set(id, record);
      }
    }

    for (const record of document.deleted) {
      const existing = deleted.get(record.id);
      if (!existing || record.deletedAt >= existing.deletedAt) {
        deleted.set(record.id, record);
      }
    }
  }

  for (const [id, record] of records) {
    const deletedRecord = deleted.get(id);
    if (deletedRecord && deletedRecord.deletedAt >= record.updatedAt) {
      records.delete(id);
    }
  }

  for (const [id, deletedRecord] of deleted) {
    const record = records.get(id);
    if (record && record.updatedAt > deletedRecord.deletedAt) {
      deleted.delete(id);
    }
  }

  return {
    app: 'matcha-auth',
    schemaVersion: 1,
    deviceId: loadLocalState().deviceId,
    updatedAt: Date.now(),
    records: Array.from(records.values()).sort(compareRecords),
    deleted: Array.from(deleted.values()).sort((a, b) => a.id.localeCompare(b.id)),
    partial,
  };
};

const applyBackupToLocal = (backup: SyncBackupDocument, notifyUi: boolean) => {
  const tokens = backup.records.sort(compareRecords).map((record) => hydratePersistedToken(record.token));
  writeTokensToStorage(tokens);

  const state = loadLocalState();
  state.tokenMeta = {};
  state.deletedMeta = {};
  state.knownTokens = {};

  for (const record of backup.records) {
    state.tokenMeta[record.token.id] = record.updatedAt;
    state.knownTokens[record.token.id] = record.token;
  }

  for (const deletedRecord of backup.deleted) {
    state.deletedMeta[deletedRecord.id] = deletedRecord.deletedAt;
  }

  state.pendingUpserts = [];
  state.pendingDeletes = [];
  state.lastSnapshot = createTokenSnapshot(tokens);
  saveLocalState(state);

  if (notifyUi) {
    window.dispatchEvent(new CustomEvent<Token[]>(TOKENS_REMOTE_EVENT, { detail: tokens }));
  }
};

const clearPendingChanges = () => {
  const state = loadLocalState();
  state.pendingUpserts = [];
  state.pendingDeletes = [];
  saveLocalState(state);
};

const ensureLocalStateForTokens = (tokens: Token[]) => {
  const state = loadLocalState();
  let changed = false;
  const now = Date.now();

  for (const token of tokens) {
    if (!state.tokenMeta[token.id]) {
      state.tokenMeta[token.id] = now;
      changed = true;
    }
  }

  if (!state.lastSnapshot) {
    state.knownTokens = toTokenRecord(tokens);
    state.lastSnapshot = createTokenSnapshot(tokens);
    changed = true;
  }

  if (changed) {
    saveLocalState(state);
  }

  return state;
};

const loadLocalState = (): WebDavLocalState => {
  const saved = readJson<Partial<WebDavLocalState>>(LOCAL_STATE_STORAGE_KEY, {});
  return {
    deviceId: saved.deviceId || createDeviceId(),
    tokenMeta: saved.tokenMeta || {},
    deletedMeta: saved.deletedMeta || {},
    knownTokens: saved.knownTokens || {},
    pendingUpserts: saved.pendingUpserts || [],
    pendingDeletes: saved.pendingDeletes || [],
    lastSnapshot: saved.lastSnapshot || '',
  };
};

const saveLocalState = (state: WebDavLocalState) => {
  localStorage.setItem(LOCAL_STATE_STORAGE_KEY, JSON.stringify(state));
};

const setRuntimeState = (patch: Partial<WebDavRuntimeState>) => {
  const nextState = {
    ...loadWebDavRuntimeState(),
    ...patch,
  };

  if (patch.status !== 'error') {
    nextState.lastError = patch.lastError;
  }

  localStorage.setItem(RUNTIME_STORAGE_KEY, JSON.stringify(nextState));
  window.dispatchEvent(new CustomEvent<WebDavRuntimeState>(RUNTIME_CHANGED_EVENT, { detail: nextState }));
};

const assertWebDavReady = (settings: WebDavSettings) => {
  if (!settings.enabled) {
    throw new Error('WebDAV 同步未开启');
  }

  if (!settings.serverUrl.trim()) {
    throw new Error('请填写 WebDAV 地址');
  }

  if (!settings.remotePath.trim()) {
    throw new Error('请填写远程文件路径');
  }
};

const normalizeBackupDocument = (data: unknown, fallbackDeviceId: string): SyncBackupDocument => {
  if (isSyncBackupDocument(data)) {
    return {
      app: 'matcha-auth',
      schemaVersion: 1,
      deviceId: data.deviceId || fallbackDeviceId,
      updatedAt: Number(data.updatedAt) || Date.now(),
      records: data.records.flatMap((record, index) => {
        const token = hydratePersistedToken(record.token);
        return [{
          token: toPersistedToken(token),
          updatedAt: Number(record.updatedAt) || Date.now(),
          order: Number.isFinite(record.order) ? record.order : index,
        }];
      }),
      deleted: Array.isArray(data.deleted)
        ? data.deleted.flatMap((record) => {
          if (!record || typeof record.id !== 'string') {
            return [];
          }

          return [{
            id: record.id,
            deletedAt: Number(record.deletedAt) || Date.now(),
          }];
        })
        : [],
      partial: Boolean(data.partial),
    };
  }

  if (isLegacyTokenArray(data)) {
    return legacyTokensToBackup(data, fallbackDeviceId);
  }

  if (isLegacyTokenObject(data)) {
    return legacyTokensToBackup(data.tokens, fallbackDeviceId, Number(data.updatedAt) || Date.now());
  }

  throw new Error('WebDAV 文件格式无法识别');
};

const legacyTokensToBackup = (tokens: unknown[], deviceId: string, updatedAt = Date.now()): SyncBackupDocument => {
  return {
    app: 'matcha-auth',
    schemaVersion: 1,
    deviceId,
    updatedAt,
    records: tokens.flatMap((item, index) => {
      const token = hydrateStoredToken(item);
      if (!token) {
        return [];
      }

      return [{
        token: toPersistedToken(token),
        updatedAt,
        order: index,
      }];
    }),
    deleted: [],
  };
};

const hydrateStoredToken = (value: unknown): Token | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const token = value as Partial<Token>;
  if (!token.id || !token.secret) {
    return null;
  }

  return hydratePersistedToken({
    id: String(token.id),
    issuer: String(token.issuer || 'Unknown'),
    account: String(token.account || 'Account'),
    secret: String(token.secret),
    icon: token.icon,
    color: token.color,
    period: Number(token.period) || 30,
  });
};

const hydratePersistedToken = (token: PersistedToken): Token => {
  const period = Number(token.period) || 30;

  return {
    id: token.id,
    issuer: token.issuer || 'Unknown',
    account: token.account || 'Account',
    secret: token.secret,
    icon: token.icon || 'key',
    color: token.color,
    period,
    code: '000000',
    remaining: period,
  };
};

const toStoredToken = (token: Token): Token => {
  const period = Number(token.period) || 30;

  return {
    ...hydratePersistedToken(toPersistedToken(token)),
    code: '000000',
    remaining: period,
  };
};

const toPersistedToken = (token: Token): PersistedToken => {
  return {
    id: token.id,
    issuer: token.issuer,
    account: token.account,
    secret: token.secret,
    icon: token.icon,
    color: token.color,
    period: Number(token.period) || 30,
  };
};

const toTokenRecord = (tokens: Token[]) => {
  return Object.fromEntries(tokens.map((token) => [token.id, toPersistedToken(token)]));
};

const buildRemoteUrl = (settings: WebDavSettings, remotePath: string) => {
  const baseUrl = settings.serverUrl.trim().replace(/\/+$/, '');
  const encodedPath = getPathSegments(remotePath).map(encodeURIComponent).join('/');
  return `${baseUrl}/${encodedPath}`;
};

const getPatchPath = (remotePath: string) => {
  return remotePath.endsWith('.json')
    ? remotePath.replace(/\.json$/, '.patch.json')
    : `${remotePath}.patch.json`;
};

const getPathSegments = (remotePath: string) => {
  return remotePath.split('/').map((segment) => segment.trim()).filter(Boolean);
};

const compareRecords = (a: SyncTokenRecord, b: SyncTokenRecord) => {
  if (a.order !== b.order) {
    return a.order - b.order;
  }

  return b.updatedAt - a.updatedAt;
};

const areBackupsEquivalent = (left: SyncBackupDocument, right: SyncBackupDocument) => {
  const normalize = (document: SyncBackupDocument) => JSON.stringify({
    records: document.records.map((record) => ({
      token: record.token,
      updatedAt: record.updatedAt,
      order: record.order,
    })).sort(compareRecords),
    deleted: document.deleted.slice().sort((a, b) => a.id.localeCompare(b.id)),
  });

  return normalize(left) === normalize(right);
};

const readJson = <T>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
};

const isSyncBackupDocument = (value: unknown): value is SyncBackupDocument => {
  return Boolean(
    value &&
    typeof value === 'object' &&
    Array.isArray((value as SyncBackupDocument).records),
  );
};

const isLegacyTokenArray = (value: unknown): value is unknown[] => Array.isArray(value);

const isLegacyTokenObject = (value: unknown): value is { tokens: unknown[]; updatedAt?: number } => {
  return Boolean(
    value &&
    typeof value === 'object' &&
    Array.isArray((value as { tokens?: unknown[] }).tokens),
  );
};

const normalizeChangeUploadMode = (mode?: WebDavChangeUploadMode): WebDavChangeUploadMode => {
  return mode === 'full' || mode === 'incremental' ? mode : 'off';
};

const unique = (values: string[]) => Array.from(new Set(values));

const createDeviceId = () => {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `device-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const toBase64 = (value: string) => {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
};

const getErrorMessage = (error: unknown) => {
  return error instanceof Error ? error.message : String(error);
};

const getWebDavNetworkErrorMessage = (error: unknown) => {
  const message = getErrorMessage(error);
  const platform = Capacitor.getPlatform();

  if (message.includes('Failed to fetch') || message.includes('Network request failed')) {
    if (platform === 'web') {
      return '网络请求失败：浏览器环境可能被 WebDAV 服务的 CORS 策略拦截。请在 Android/iOS 应用中使用，或为 WebDAV 服务开启 CORS。';
    }

    return '网络请求失败：请检查 WebDAV 地址、证书是否可信、网络是否可达，以及服务器是否允许当前请求方法。';
  }

  return message;
};
