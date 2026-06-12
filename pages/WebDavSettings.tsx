import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowBackIcon,
  CheckIcon,
  CloudQueueIcon,
  InfoIcon,
  SettingsIcon,
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
  testWebDavConnection,
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
  const [showPassword, setShowPassword] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);

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
    setTestSuccess(false);
    try {
      await action();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : String(error));
    }
  };

  const runTestAction = async () => {
    setActionError('');
    setTestSuccess(false);
    setIsTesting(true);
    try {
      await testWebDavConnection(settings);
      setTestSuccess(true);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background pb-10 text-on-background">
      {/* Header */}
      <div className="sticky top-0 z-20 flex flex-col bg-background/90 px-4 pt-12 pb-3 backdrop-blur-xl">
        <div className="flex items-center">
          <button
            type="button"
            onClick={onBack}
            className="mr-2 flex size-10 shrink-0 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-on-surface/10"
          >
            <ArrowBackIcon className="h-6 w-6" />
          </button>
          <div className="flex flex-col">
             <h1 className="text-xl font-bold tracking-tight text-on-surface">WebDAV 同步</h1>
             <span className="text-[13px] text-on-surface-variant font-medium">备份与恢复</span>
          </div>
        </div>
      </div>

      <div className="no-scrollbar flex flex-col gap-4 overflow-y-auto px-4 pb-20 mt-2">
        {/* Main Card */}
        <div className="bg-surface-container-lowest dark:bg-surface-container rounded-[28px] shadow-sm border border-outline/5 dark:border-white/5 p-5">
           
           {/* Header Info */}
           <div className="flex items-start gap-4 mb-5">
              <div className="size-[52px] rounded-[20px] bg-primary-container/80 dark:bg-primary-container text-primary dark:text-on-primary-container flex items-center justify-center shrink-0">
                 <CloudQueueIcon className="w-7 h-7" />
              </div>
              <div className="flex flex-col pt-1">
                 <h2 className="text-[17px] font-bold text-on-surface">WebDAV 数据同步</h2>
                 <p className="text-[13px] text-on-surface-variant mt-0.5 leading-snug pr-4">备份至自己的 WebDAV 云 (坚果云、Nextcloud 等)。</p>
              </div>
           </div>



           {/* Master Toggle */}
           <label className="flex items-center justify-between pb-4 mb-4 border-b border-outline/10 cursor-pointer">
              <span className="text-[15px] font-bold text-on-surface">启用 WebDAV 同步</span>
              <button
                  type="button"
                  aria-pressed={settings.enabled}
                  onClick={() => updateSetting('enabled', !settings.enabled)}
                  className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                      settings.enabled ? 'bg-primary' : 'bg-surface-variant border border-outline/20 dark:border-white/10'
                  }`}
              >
                  <motion.span
                      className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm"
                      animate={{ x: settings.enabled ? 20 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
              </button>
           </label>

           <AnimatePresence>
             {settings.enabled && (
                <motion.div
                   initial={{ opacity: 0, height: 0 }}
                   animate={{ opacity: 1, height: 'auto' }}
                   exit={{ opacity: 0, height: 0 }}
                   className="flex flex-col gap-4 overflow-hidden"
                >
                   {/* Inputs */}
                   <label className="flex flex-col gap-1.5">
                     <span className="text-[13px] font-bold text-on-surface-variant ml-1">服务器 URL</span>
                     <input
                         type="url"
                         value={settings.serverUrl}
                         onChange={(event) => updateSetting('serverUrl', event.target.value)}
                         placeholder="https://dav.example.com/dav/"
                         className="w-full rounded-[20px] border border-outline/20 bg-transparent px-4 py-3.5 text-[15px] text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/40"
                     />
                   </label>

                   <div className="grid grid-cols-2 gap-3">
                     <label className="flex flex-col gap-1.5">
                       <span className="text-[13px] font-bold text-on-surface-variant ml-1">用户名</span>
                       <input
                           type="text"
                           value={settings.username}
                           onChange={(event) => updateSetting('username', event.target.value)}
                           placeholder="username"
                           className="w-full rounded-[20px] border border-outline/20 bg-transparent px-4 py-3.5 text-[15px] text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/40"
                       />
                     </label>
                     <label className="flex flex-col gap-1.5 relative">
                       <span className="text-[13px] font-bold text-on-surface-variant ml-1">密码</span>
                       <input
                           type={showPassword ? 'text' : 'password'}
                           value={settings.password}
                           onChange={(event) => updateSetting('password', event.target.value)}
                           placeholder="password"
                           className="w-full rounded-[20px] border border-outline/20 bg-transparent pl-4 pr-12 py-3.5 text-[15px] text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/40"
                       />
                       <button
                           type="button"
                           onClick={() => setShowPassword(!showPassword)}
                           className="absolute right-4 bottom-[13px] text-[13px] text-on-surface-variant font-bold active:opacity-50 transition-opacity"
                       >
                           {showPassword ? '隐藏' : '显示'}
                       </button>
                     </label>
                   </div>

                   <label className="flex flex-col gap-1.5 mb-2">
                     <span className="text-[13px] font-bold text-on-surface-variant ml-1">备份目录（远端路径）</span>
                     <input
                         type="text"
                         value={settings.remotePath}
                         onChange={(event) => updateSetting('remotePath', event.target.value)}
                         placeholder="/MatchaAuth/"
                         className="w-full rounded-[20px] border border-outline/20 bg-transparent px-4 py-3.5 text-[15px] font-mono text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/40"
                     />
                   </label>

                   {/* Status Message */}
                   <AnimatePresence>
                   {(runtimeState.lastError || actionError) && (
                      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-2xl bg-error-container/50 border border-error/20 p-3 text-[13px] font-medium text-on-error-container break-words">
                          {actionError || runtimeState.lastError}
                      </motion.div>
                   )}
                   {testSuccess && !actionError && (
                      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-2xl bg-secondary-container/50 border border-secondary/20 p-3 text-[13px] font-medium text-on-secondary-container flex items-center gap-2">
                          <CheckIcon className="w-4 h-4 shrink-0" /> <span className="truncate">测试连接成功</span>
                      </motion.div>
                   )}
                   {runtimeState.status === 'success' && !actionError && !testSuccess && (
                      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-2xl bg-secondary-container/50 border border-secondary/20 p-3 text-[13px] font-medium text-on-secondary-container flex items-center gap-2">
                          <CheckIcon className="w-4 h-4 shrink-0" /> <span className="truncate">{STATUS_LABELS[runtimeState.status]} ({lastSyncText})</span>
                      </motion.div>
                   )}
                   </AnimatePresence>

                   {/* Buttons */}
                   <div className="flex flex-wrap items-center gap-3 mt-1">
                      <button
                          type="button"
                          disabled={isBusy || isTesting}
                          onClick={runTestAction}
                          className="flex h-11 items-center justify-center gap-2 px-5 rounded-full border border-outline/20 font-bold text-[14px] hover:bg-on-surface/5 active:scale-[0.98] transition-all disabled:opacity-50"
                      >
                          <InfoIcon className="w-[18px] h-[18px]" />
                          {isTesting ? '连接中...' : '测试连接'}
                      </button>
                      <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => runAction(() => performWebDavSync('manual'))}
                          className="flex h-11 items-center justify-center gap-2 px-5 rounded-full border border-outline/20 font-bold text-[14px] hover:bg-on-surface/5 active:scale-[0.98] transition-all disabled:opacity-50"
                      >
                          <CloudQueueIcon className="w-[18px] h-[18px]" />
                          {isBusy && runtimeState.lastReason === 'manual' ? '同步中...' : '双向同步'}
                      </button>
                      <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => runAction(() => uploadLocalWebDavBackup('manual-upload'))}
                          className="flex h-11 items-center justify-center gap-2 px-6 rounded-full bg-primary text-on-primary font-bold text-[14px] shadow-sm hover:shadow-md hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50"
                      >
                          <CloudQueueIcon className="w-[18px] h-[18px]" />
                          {isBusy && runtimeState.lastReason === 'manual-upload' ? '备份中...' : '立即备份'}
                      </button>
                   </div>
                </motion.div>
             )}
           </AnimatePresence>
        </div>

        <AnimatePresence>
          {settings.enabled && (
             <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
             >
                {/* Advanced Settings Card */}
                <div className="bg-surface-container-lowest dark:bg-surface-container rounded-[28px] shadow-sm border border-outline/5 dark:border-white/5 p-5 flex flex-col gap-5">
                    <h3 className="text-[14px] font-bold text-on-surface-variant flex items-center gap-2 uppercase tracking-wide">
                       <SettingsIcon className="w-[18px] h-[18px]" /> 自动同步规则
                    </h3>
                    
                    <div className="flex flex-col gap-2.5">
                        <span className="text-[13px] font-bold text-on-surface px-1">开启应用时同步</span>
                        <SegmentedControl
                            options={LAUNCH_SYNC_OPTIONS}
                            value={settings.launchSyncDelay}
                            onChange={(value) => updateSetting('launchSyncDelay', value)}
                        />
                    </div>

                    <div className="h-px w-full bg-outline/10 rounded-full" />

                    <div className="flex flex-col gap-2.5">
                        <span className="text-[13px] font-bold text-on-surface px-1">应用运行期间同步</span>
                        <SegmentedControl
                            options={PERIODIC_SYNC_OPTIONS}
                            value={settings.periodicSyncInterval}
                            onChange={(value) => updateSetting('periodicSyncInterval', value)}
                        />
                    </div>

                    <div className="h-px w-full bg-outline/10 rounded-full" />

                    <div className="flex flex-col gap-2.5">
                        <span className="text-[13px] font-bold text-on-surface px-1">数据变更时上传</span>
                        <SegmentedControl
                            options={CHANGE_UPLOAD_OPTIONS}
                            value={settings.changeUploadMode}
                            onChange={(value) => updateSetting('changeUploadMode', value)}
                        />
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
