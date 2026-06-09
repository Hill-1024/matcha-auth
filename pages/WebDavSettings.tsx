import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  { label: '仅增量', value: 'incremental' },
];

const STATUS_LABELS: Record<WebDavRuntimeState['status'], string> = {
  idle: '待同步',
  syncing: '同步中...',
  success: '同步成功',
  error: '同步失败',
};

// Material Design 3 Segmented Button
function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  disabled = false,
}: SegmentedControlProps<T>) {
  return (
    <div className={`flex rounded-full border border-outline/20 dark:border-white/10 overflow-hidden ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {options.map((option, index) => {
        const isSelected = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={`flex flex-1 min-h-[40px] items-center justify-center text-[13px] font-bold transition-colors duration-200 ${
              isSelected
                ? 'bg-secondary-container text-on-secondary-container'
                : 'bg-transparent text-on-surface-variant hover:bg-on-surface/5'
            } ${index !== 0 ? 'border-l border-outline/20 dark:border-white/10' : ''}`}
          >
            {isSelected && <CheckIcon className="w-4 h-4 mr-1 shrink-0" />}
            <span className="truncate">{option.label}</span>
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
    <div className="flex min-h-screen flex-col bg-background pb-10 text-on-background">
      {/* Header */}
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

      <div className="no-scrollbar flex flex-col gap-2 overflow-y-auto px-4 pb-20">
        
        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center py-6">
            <div className="size-20 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shadow-sm mb-4">
                <CloudQueueIcon className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-on-surface">云端数据备份</h2>
            <p className="text-sm text-on-surface-variant mt-1 px-8 text-center leading-relaxed">
                将您的令牌安全同步至个人的 WebDAV 服务器，跨设备保持数据一致。
            </p>
        </div>

        {/* Master Toggle */}
        <div className="bg-surface-container rounded-[28px] p-2 shadow-sm border border-outline/5 dark:border-white/5 mx-2">
            <label className="flex items-center justify-between p-4 cursor-pointer rounded-[20px] hover:bg-surface-container-high transition-colors active:bg-surface-container-high">
                <div className="flex flex-col min-w-0 pr-4">
                    <span className="text-lg font-bold text-on-surface">启用 WebDAV 同步</span>
                    <span className="text-sm text-on-surface-variant mt-0.5 truncate">{settings.enabled ? '已开启自动同步' : '当前已停用'}</span>
                </div>
                <button
                    type="button"
                    aria-pressed={settings.enabled}
                    onClick={() => updateSetting('enabled', !settings.enabled)}
                    className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
                        settings.enabled ? 'bg-primary' : 'bg-surface-variant border border-outline/20 dark:border-white/10'
                    }`}
                >
                    <motion.span
                        className="absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow-sm"
                        animate={{ x: settings.enabled ? 24 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                </button>
            </label>
        </div>

        <AnimatePresence>
        {settings.enabled && (
            <motion.div
                initial={{ opacity: 0, height: 0, y: -20 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="flex flex-col gap-6 mt-6 px-2 overflow-hidden"
            >
                {/* Server Configuration */}
                <div className="flex flex-col gap-3">
                    <h3 className="text-sm font-bold text-primary px-2 tracking-wide uppercase">服务器配置</h3>
                    <div className="flex flex-col gap-4 rounded-3xl bg-surface-container p-5 shadow-sm border border-outline/5 dark:border-white/5">
                        <label className="flex flex-col gap-1.5">
                            <span className="ml-1 text-xs font-bold text-on-surface-variant">服务器地址</span>
                            <input
                                type="url"
                                value={settings.serverUrl}
                                onChange={(event) => updateSetting('serverUrl', event.target.value)}
                                placeholder="https://example.com/dav"
                                className="w-full rounded-2xl border-none bg-surface-container-high px-4 py-3.5 text-sm text-on-surface transition-shadow placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary"
                            />
                        </label>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <label className="flex flex-col gap-1.5">
                                <span className="ml-1 text-xs font-bold text-on-surface-variant">用户名</span>
                                <input
                                    type="text"
                                    value={settings.username}
                                    onChange={(event) => updateSetting('username', event.target.value)}
                                    placeholder="Username"
                                    className="w-full rounded-2xl border-none bg-surface-container-high px-4 py-3.5 text-sm text-on-surface transition-shadow placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary"
                                />
                            </label>

                            <label className="flex flex-col gap-1.5">
                                <span className="ml-1 text-xs font-bold text-on-surface-variant">密码</span>
                                <input
                                    type="password"
                                    value={settings.password}
                                    onChange={(event) => updateSetting('password', event.target.value)}
                                    placeholder="Password or App Token"
                                    className="w-full rounded-2xl border-none bg-surface-container-high px-4 py-3.5 text-sm text-on-surface transition-shadow placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary"
                                />
                            </label>
                        </div>

                        <label className="flex flex-col gap-1.5">
                            <span className="ml-1 text-xs font-bold text-on-surface-variant">远程文件路径</span>
                            <input
                                type="text"
                                value={settings.remotePath}
                                onChange={(event) => updateSetting('remotePath', event.target.value)}
                                placeholder="/MatchaAuth/tokens.json"
                                className="w-full rounded-2xl border-none bg-surface-container-high px-4 py-3.5 font-mono text-sm text-on-surface transition-shadow placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary"
                            />
                        </label>
                    </div>
                </div>

                {/* Sync Frequency */}
                <div className="flex flex-col gap-3">
                    <h3 className="text-sm font-bold text-primary px-2 tracking-wide uppercase">同步行为</h3>
                    <div className="flex flex-col gap-5 rounded-3xl bg-surface-container p-5 shadow-sm border border-outline/5 dark:border-white/5">
                        <div className="flex flex-col gap-2.5">
                            <span className="text-sm font-bold text-on-surface px-1">开启应用时同步</span>
                            <SegmentedControl
                                options={LAUNCH_SYNC_OPTIONS}
                                value={settings.launchSyncDelay}
                                onChange={(value) => updateSetting('launchSyncDelay', value)}
                            />
                        </div>

                        <div className="h-px w-full bg-outline/10 dark:bg-white/10 rounded-full" />

                        <div className="flex flex-col gap-2.5">
                            <span className="text-sm font-bold text-on-surface px-1">应用运行期间同步</span>
                            <SegmentedControl
                                options={PERIODIC_SYNC_OPTIONS}
                                value={settings.periodicSyncInterval}
                                onChange={(value) => updateSetting('periodicSyncInterval', value)}
                            />
                        </div>

                        <div className="h-px w-full bg-outline/10 dark:bg-white/10 rounded-full" />

                        <div className="flex flex-col gap-2.5">
                            <span className="text-sm font-bold text-on-surface px-1">数据变更时上传</span>
                            <SegmentedControl
                                options={CHANGE_UPLOAD_OPTIONS}
                                value={settings.changeUploadMode}
                                onChange={(value) => updateSetting('changeUploadMode', value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Status and Manual Sync */}
                <div className="flex flex-col gap-3">
                    <h3 className="text-sm font-bold text-primary px-2 tracking-wide uppercase">当前状态</h3>
                    <div className="flex flex-col gap-5 rounded-3xl bg-surface-container p-5 shadow-sm border border-outline/5 dark:border-white/5">
                        
                        <div className="flex items-center gap-4">
                            <div className={`rounded-2xl p-3.5 flex items-center justify-center shrink-0 ${
                                runtimeState.status === 'error'
                                    ? 'bg-error-container text-on-error-container'
                                    : runtimeState.status === 'success'
                                    ? 'bg-secondary-container text-on-secondary-container'
                                    : 'bg-primary-container text-on-primary-container'
                            }`}>
                                <InfoIcon className="h-7 w-7" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-lg font-bold text-on-surface leading-snug">{STATUS_LABELS[runtimeState.status]}</span>
                                <span className="text-xs text-on-surface-variant truncate mt-0.5">{lastSyncText}</span>
                            </div>
                        </div>

                        {(runtimeState.lastError || actionError) && (
                            <div className="rounded-2xl bg-error-container/50 border border-error/20 p-4 text-sm font-medium text-on-error-container break-words">
                                {actionError || runtimeState.lastError}
                            </div>
                        )}

                        <div className="flex flex-col gap-3 mt-1">
                            <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => runAction(() => performWebDavSync('manual'))}
                                className="flex min-h-[48px] items-center justify-center rounded-full bg-primary text-on-primary font-bold text-sm shadow-sm transition-all hover:shadow-md hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                            >
                                {isBusy ? '正在同步...' : '立即同步数据'}
                            </button>
                            <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => runAction(() => uploadLocalWebDavBackup('manual-upload'))}
                                className="flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-surface-container-high text-on-surface font-bold text-sm shadow-sm transition-all hover:bg-surface-variant active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none border border-outline/10 dark:border-white/5"
                            >
                                <ExportIcon className="h-5 w-5" />
                                仅上传当前数据
                            </button>
                        </div>

                    </div>
                </div>

            </motion.div>
        )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default WebDavSettings;
