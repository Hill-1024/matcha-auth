import React, { useEffect, useState } from 'react';
import { loadWebDavSettings, subscribeWebDavSettings } from '../services/webDavSyncService';
import { BUILD_INFO } from '@/buildInfo';
import { motion } from 'framer-motion';
import {
    ArrowBackIcon,
    PaletteIcon,
    InfoIcon,
    CloudQueueIcon
} from '../components/Icons';

interface SettingsProps {
    onBack: () => void;
    onWebDavClick: () => void;
    onAppearanceClick: () => void;
}

const Settings: React.FC<SettingsProps> = ({
                                                         onBack,
                                                         onWebDavClick,
                                                         onAppearanceClick
                                                     }) => {
    const [isWebDavEnabled, setIsWebDavEnabled] = useState(() => loadWebDavSettings().enabled);

    useEffect(() => {
        return subscribeWebDavSettings((settings) => {
            setIsWebDavEnabled(settings.enabled);
        });
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col h-full min-h-screen bg-background text-on-background pb-10"
        >
            {/* Header */}
            <div className="sticky top-0 z-20 flex items-center bg-background/90 backdrop-blur-xl p-4 pt-12">
                <button
                    onClick={onBack}
                    className="text-on-surface flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-on-surface/10 transition-colors mr-2">
                    <ArrowBackIcon className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-semibold tracking-tight text-on-surface flex-1">设置</h1>
            </div>

            <div className="flex flex-col px-4 gap-6 mt-2 overflow-y-auto no-scrollbar pb-20">

                {/* Settings Menu */}
                <div className="flex flex-col gap-3 mt-2">
                    <h3 className="text-base font-bold text-on-surface px-2">常用</h3>
                    
                    <div className="bg-surface-container rounded-2xl overflow-hidden shadow-sm border border-outline/10 dark:border-white/5 flex flex-col">
                        <button
                            type="button"
                            onClick={onAppearanceClick}
                            className="p-4 flex items-center justify-between gap-4 text-left hover:bg-surface-container-high transition-colors active:bg-surface-container-highest"
                        >
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="p-2.5 bg-primary/10 rounded-xl text-primary shrink-0">
                                    <PaletteIcon className="w-6 h-6" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="font-bold text-on-surface text-base">外观与主题</span>
                                    <span className="text-xs text-on-surface-variant">卡片样式与系统主题设置</span>
                                </div>
                            </div>
                            <ArrowBackIcon className="w-5 h-5 rotate-180 text-on-surface-variant shrink-0" />
                        </button>

                        <div className="h-px bg-outline/10 mx-4" />

                        <button
                            type="button"
                            onClick={onWebDavClick}
                            className="p-4 flex items-center justify-between gap-4 text-left hover:bg-surface-container-high transition-colors active:bg-surface-container-highest"
                        >
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="p-2.5 bg-primary/10 rounded-xl text-primary shrink-0">
                                    <CloudQueueIcon className="w-6 h-6" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="font-bold text-on-surface text-base">WebDAV 同步</span>
                                    <span className="text-xs text-on-surface-variant">{isWebDavEnabled ? '已开启' : '未开启'}</span>
                                </div>
                            </div>
                            <ArrowBackIcon className="w-5 h-5 rotate-180 text-on-surface-variant shrink-0" />
                        </button>
                    </div>
                </div>

                {/* About App Section */}
                <div className="flex flex-col gap-3 mt-4">
                    <h3 className="text-base font-bold text-on-surface px-2">关于应用</h3>
                    <div className="bg-surface-container rounded-2xl p-4 shadow-sm border border-outline/10 dark:border-white/5 flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-surface rounded-xl text-primary">
                                <InfoIcon className="w-6 h-6" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-on-surface text-base">{BUILD_INFO.appName}</span>
                                <span className="text-xs text-on-surface-variant">{BUILD_INFO.description}</span>
                            </div>
                        </div>

                        <div className="w-full h-px bg-outline/10"></div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold text-on-surface-variant/70 tracking-wider">版本 (Version)</span>
                                <span className="text-sm font-medium text-on-surface">{BUILD_INFO.version}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold text-on-surface-variant/70 tracking-wider">构建环境 (Env)</span>
                                <span className="text-sm font-medium text-on-surface">{BUILD_INFO.environment}</span>
                            </div>
                            <div className="flex flex-col col-span-2">
                                <span className="text-[10px] uppercase font-bold text-on-surface-variant/70 tracking-wider">构建时间 (Build Time)</span>
                                <span className="text-sm font-mono text-on-surface opacity-80">{BUILD_INFO.buildTime}</span>
                            </div>
                            <div className="flex flex-col col-span-2">
                                <span className="text-[10px] uppercase font-bold text-on-surface-variant/70 tracking-wider">项目地址 (Project Url)</span>
                                <span className="text-sm font-mono text-on-surface opacity-80">{BUILD_INFO.ProjectUrl}</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </motion.div>
    );
};

export default Settings;
