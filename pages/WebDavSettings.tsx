import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowBackIcon,
  CheckIcon,
  CloudQueueIcon,
  ExportIcon,
  InfoIcon,
} from '../components/Icons';
import {
  WebDavChangeUploadMode,
  WebDavLaunchSyncDelay,
  WebDavPeriodicSyncInterval,
  WebDavRuntimeState,
  WebDavSettings as WebDavSettingsShape,
} from '../types';
import {
  loadWebDavRuntimeState,
  loadWebDavSettings,
  performWebDavSync,
  saveWebDavSettings,
  subscribeWebDavRuntimeState,
  uploadLocalWebDavBackup,
} from '../services/webDavSyncService';

interface WebDavSettingsProps {
  onBack: () => void;
}

interface SegmentOption<T extends string | number> {
  label: string;
  value: T;
}

interface SegmentedControlProps<T extends string | number> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}

const LAUNCH_SYNC_OPTIONS: SegmentOption<WebDavLaunchSyncDelay>[] = [
  { label: '不进行', value: 'never' },
  { label: '1秒', value: '1s' },
  { label: '10秒', value: '10s' },
];

const PERIODIC_SYNC_OPTIONS: SegmentOption<WebDavPeriodicSyncInterval>[] = [
  { label: '不自动同步', value: 'off' },
  { label: '30秒', value: 30 },
  { label: '60秒', value: 60 },
];

const CHANGE_UPLOAD_OPTIONS: SegmentOption<WebDavChangeUploadMode>[] = [
  { label: '关闭', value: 'off' },
  { label: '开启', value: 'full' },
  { label: '仅同步增量', value: 'incremental' },
];

const STATUS_LABELS: Record<WebDavRuntimeState['status'], string> = {
  idle: '待同步',
  syncing: '同步中',
  success: '同步完成',
  error: '同步失败',
};

function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  disabled = false,
}: SegmentedControlProps<T>) {
  return (
    <div className={`flex rounded-full bg-surface-container-high p-1 border border-outline/10 dark:border-white/5 ${disabled ? 'opacity-60' : ''}`}>
      {options.map((option) => {
        const isSelected = option.value === value;

        return (
          <button
            key={String(option.value)}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={`flex min-h-11 flex-1 items-center justify-center rounded-full px-2 text-xs font-bold transition-all sm:text-sm ${
              isSelected
                ? 'bg-surface text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

const WebDavSettings: React.FC<WebDavSettingsProps> = ({ onBack }) => {
  const [settings, setSettings] = useState<WebDavSettingsShape>(() => loadWebDavSettings());
  const [runtimeState, setRuntimeState] = useState<WebDavRuntimeState>(() => loadWebDavRuntimeState());
  const [actionError, setActionError] = useState('');

  const isBusy = runtimeState.status === 'syncing';
  const lastSyncText = runtimeState.lastSyncAt
    ? new Date(runtimeState.lastSyncAt).toLocaleString()
    : '尚未同步';

  useEffect(() => {
    saveWebDavSettings(settings);
  }, [settings]);

  useEffect(() => {
    return subscribeWebDavRuntimeState(setRuntimeState);
  }, []);

  const updateSetting = <Key extends keyof WebDavSettingsShape>(
    key: Key,
    value: WebDavSettingsShape[Key],
  ) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const runAction = async (action: () => Promise<unknown>) => {
    setActionError('');
    try {
      await action();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <div
      className="flex min-h-screen flex-col bg-background pb-10 text-on-background"
    >
      <div className="sticky top-0 z-20 flex items-center bg-background/90 p-4 pt-12 backdrop-blur-xl">
        <button
          type="button"
          onClick={onBack}
          className="mr-2 flex size-10 shrink-0 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-on-surface/10"
        >
          <ArrowBackIcon className="h-6 w-6" />
        </button>
        <h1 className="flex-1 text-2xl font-semibold tracking-tight text-on-surface">WebDAV 同步</h1>
      </div>

      <div className="no-scrollbar mt-2 flex flex-col gap-6 overflow-y-auto px-4 pb-20">
        <div className="flex flex-col gap-4 rounded-3xl border border-outline/10 bg-surface-container p-5 shadow-sm dark:border-white/5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-3 text-primary">
                <CloudQueueIcon className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold text-on-surface">启用 WebDAV</span>
                <span className="text-xs text-on-surface-variant">{settings.enabled ? '已开启' : '未开启'}</span>
              </div>
            </div>
            <button
              type="button"
              aria-pressed={settings.enabled}
              onClick={() => updateSetting('enabled', !settings.enabled)}
              className={`relative h-8 w-14 rounded-full transition-colors ${
                settings.enabled ? 'bg-primary' : 'bg-surface-variant'
              }`}
            >
              <motion.span
                className="absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow-sm"
                animate={{ x: settings.enabled ? 24 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>

          <div className="h-px bg-outline/10" />

          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1">
              <span className="ml-1 text-xs font-bold text-primary">WebDAV 地址</span>
              <input
                type="url"
                value={settings.serverUrl}
                onChange={(event) => updateSetting('serverUrl', event.target.value)}
                placeholder="https://example.com/dav"
                className="w-full rounded-xl border-none bg-surface-container-high p-3 text-sm text-on-surface transition-all placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary/50"
              />
            </label>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="ml-1 text-xs font-bold text-primary">用户名</span>
                <input
                  type="text"
                  value={settings.username}
                  onChange={(event) => updateSetting('username', event.target.value)}
                  className="w-full rounded-xl border-none bg-surface-container-high p-3 text-sm text-on-surface transition-all placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary/50"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="ml-1 text-xs font-bold text-primary">密码</span>
                <input
                  type="password"
                  value={settings.password}
                  onChange={(event) => updateSetting('password', event.target.value)}
                  className="w-full rounded-xl border-none bg-surface-container-high p-3 text-sm text-on-surface transition-all placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary/50"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1">
              <span className="ml-1 text-xs font-bold text-primary">远程文件路径</span>
              <input
                type="text"
                value={settings.remotePath}
                onChange={(event) => updateSetting('remotePath', event.target.value)}
                placeholder="/MatchaAuth/tokens.json"
                className="w-full rounded-xl border-none bg-surface-container-high p-3 font-mono text-sm text-on-surface transition-all placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary/50"
              />
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="px-2 text-lg font-bold text-on-surface">同步频率</h3>

          <div className="flex flex-col gap-5 rounded-3xl border border-outline/10 bg-surface-container p-5 shadow-sm dark:border-white/5">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-on-surface">开启应用后同步</span>
                {settings.launchSyncDelay !== 'never' && <CheckIcon className="h-5 w-5 shrink-0 text-primary" />}
              </div>
              <SegmentedControl
                options={LAUNCH_SYNC_OPTIONS}
                value={settings.launchSyncDelay}
                onChange={(value) => updateSetting('launchSyncDelay', value)}
                disabled={!settings.enabled}
              />
            </div>

            <div className="h-px bg-outline/10" />

            <div className="flex flex-col gap-3">
              <span className="text-sm font-bold text-on-surface">每隔多久同步</span>
              <SegmentedControl
                options={PERIODIC_SYNC_OPTIONS}
                value={settings.periodicSyncInterval}
                onChange={(value) => updateSetting('periodicSyncInterval', value)}
                disabled={!settings.enabled}
              />
            </div>

            <div className="h-px bg-outline/10" />

            <div className="flex flex-col gap-3">
              <span className="text-sm font-bold text-on-surface">发生更改自动上传</span>
              <SegmentedControl
                options={CHANGE_UPLOAD_OPTIONS}
                value={settings.changeUploadMode}
                onChange={(value) => updateSetting('changeUploadMode', value)}
                disabled={!settings.enabled}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="px-2 text-lg font-bold text-on-surface">状态</h3>
          <div className="flex flex-col gap-4 rounded-3xl border border-outline/10 bg-surface-container p-5 shadow-sm dark:border-white/5">
            <div className="flex items-center gap-4">
              <div className={`rounded-full p-3 ${
                runtimeState.status === 'error'
                  ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                  : 'bg-primary/10 text-primary'
              }`}>
                <InfoIcon className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold text-on-surface">{STATUS_LABELS[runtimeState.status]}</p>
                <p className="truncate text-xs text-on-surface-variant">{lastSyncText}</p>
              </div>
            </div>

            {(runtimeState.lastError || actionError) && (
              <div className="rounded-xl bg-red-500/10 p-3 text-sm font-medium text-red-600 dark:text-red-400">
                {actionError || runtimeState.lastError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={isBusy || !settings.enabled}
                onClick={() => runAction(() => performWebDavSync('manual'))}
                className="flex min-h-12 items-center justify-center rounded-full bg-primary px-4 text-sm font-bold text-on-primary shadow-sm transition-all hover:shadow-md disabled:opacity-50 disabled:shadow-none"
              >
                {isBusy ? '同步中' : '立即同步'}
              </button>
              <button
                type="button"
                disabled={isBusy || !settings.enabled}
                onClick={() => runAction(() => uploadLocalWebDavBackup('manual-upload'))}
                className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-secondary-container px-4 text-sm font-bold text-on-secondary-container shadow-sm transition-all hover:shadow-md disabled:opacity-50 disabled:shadow-none"
              >
                <ExportIcon className="h-5 w-5" />
                上传当前数据
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebDavSettings;
