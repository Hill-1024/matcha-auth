import React from 'react';
import { RGB } from '../types';
import { hexToRgb, rgbToHex } from '../services/themeService';
import { BUILD_INFO } from '@/buildInfo';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowBackIcon,
    LightModeIcon,
    DarkModeIcon,
    SmartphoneIcon,
    AppLogoIcon,
    MoreHorizIcon,
    CheckIcon,
    TuneIcon,
    PaletteIcon,
    InfoIcon
} from '../components/Icons';

interface ThemeSettingsProps {
    onBack: () => void;
    themeMode: 'light' | 'dark' | 'system';
    setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
    selectedPreset: string;
    setSelectedPreset: (name: string) => void;
    customRgb: RGB;
    setCustomRgb: (rgb: RGB) => void;
    isMonetAvailable: boolean;
}

const PRESETS = [
    { name: 'Matcha', label: '抹茶', color: '#879A6C' },
    { name: 'Sage', label: '鼠尾草', color: '#74968C' },
    { name: 'Clay', label: '黏土', color: '#8C887D' },
    { name: 'Wheat', label: '小麦', color: '#D4C5A3' },
    { name: 'Lavender', label: '薰衣草', color: '#8F8FBC' },
    { name: 'Rose', label: '玫瑰', color: '#BC8F8F' },
];

const ThemeSettings: React.FC<ThemeSettingsProps> = ({
                                                         onBack,
                                                         themeMode,
                                                         setThemeMode,
                                                         selectedPreset,
                                                         setSelectedPreset,
                                                         customRgb,
                                                         setCustomRgb,
                                                         isMonetAvailable
                                                     }) => {

    const handlePresetSelect = (name: string, hex: string) => {
        setSelectedPreset(name);
        if (name !== 'Dynamic') {
            setCustomRgb(hexToRgb(hex));
        }
    };

    const handleRgbChange = (channel: 'r' | 'g' | 'b', value: number) => {
        setCustomRgb({ ...customRgb, [channel]: value });
        setSelectedPreset('Custom');
    };

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
                <h1 className="text-2xl font-semibold tracking-tight text-on-surface flex-1">主题与风格</h1>
            </div>

            <div className="flex flex-col px-4 gap-6 mt-2 overflow-y-auto no-scrollbar pb-20">

                {/* Preview Card */}
                <div className="flex flex-col gap-3">
                    <div className="relative overflow-hidden rounded-[2rem] bg-primary-container p-6 shadow-sm group border border-transparent">
                        {/* Abstract Blobs for visual flair */}
                        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/20 blur-3xl"></div>
                        <div className="absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl"></div>

                        <div className="relative z-10 flex flex-col gap-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-on-primary">
                                        <AppLogoIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-on-primary-container text-base font-bold leading-none">Matcha 令牌</p>
                                        <p className="text-on-primary-container/60 text-xs font-medium mt-1">正在验证身份...</p>
                                    </div>
                                </div>
                                <div className="rounded-full bg-on-primary-container/10 px-2 py-1">
                                    <MoreHorizIcon className="w-5 h-5 text-on-primary-container/40" />
                                </div>
                            </div>

                            <div className="flex items-end justify-between">
                                <p className="text-primary font-display text-5xl font-extrabold tracking-widest drop-shadow-sm">
                                    482 195
                                </p>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-primary text-xs font-bold">复制验证码</span>
                                </div>
                                <div className="relative size-6">
                                    <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                                        <path className="text-on-primary-container/10" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4"></path>
                                        <path className="text-primary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="75, 100" strokeLinecap="round" strokeWidth="4"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                    <p className="text-center text-xs text-on-surface-variant font-medium">当前主题预览</p>
                </div>

                {/* Theme Mode Selector (Segmented Control) */}
                <div className="flex flex-col gap-3">
                    <h3 className="text-lg font-bold text-on-surface px-2">外观模式</h3>
                    <div className="flex bg-surface-container-high p-1 rounded-full border border-outline/10 dark:border-white/5">
                        <button
                            onClick={() => setThemeMode('light')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-sm font-bold transition-all duration-200 ${themeMode === 'light' ? 'bg-surface shadow-md text-primary scale-100' : 'text-on-surface-variant hover:text-on-surface scale-95 opacity-70 hover:opacity-100'}`}
                        >
                            <LightModeIcon className="w-5 h-5" />
                            <span>浅色</span>
                        </button>
                        <button
                            onClick={() => setThemeMode('dark')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-sm font-bold transition-all duration-200 ${themeMode === 'dark' ? 'bg-surface shadow-md text-primary scale-100' : 'text-on-surface-variant hover:text-on-surface scale-95 opacity-70 hover:opacity-100'}`}
                        >
                            <DarkModeIcon className="w-5 h-5" />
                            <span>深色</span>
                        </button>
                        <button
                            onClick={() => setThemeMode('system')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-sm font-bold transition-all duration-200 ${themeMode === 'system' ? 'bg-surface shadow-md text-primary scale-100' : 'text-on-surface-variant hover:text-on-surface scale-95 opacity-70 hover:opacity-100'}`}
                        >
                            <SmartphoneIcon className="w-5 h-5" />
                            <span>系统</span>
                        </button>
                    </div>
                </div>

                {/* Dynamic Color Toggle */}
                {isMonetAvailable && (
                    <div className="flex flex-col gap-3">
                        <h3 className="text-lg font-bold text-on-surface px-2">动态取色 (Monet)</h3>
                        <div
                            className="flex items-center justify-between bg-surface-container-high p-4 rounded-[2rem] border border-outline/10 dark:border-white/5 cursor-pointer hover:bg-surface-variant/50 transition-colors"
                            onClick={() => {
                                if (selectedPreset === 'Dynamic') {
                                    setSelectedPreset('Matcha');
                                } else {
                                    setSelectedPreset('Dynamic');
                                }
                            }}
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-full text-primary">
                                    <PaletteIcon className="w-6 h-6" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-base font-bold text-on-surface">跟随壁纸颜色</span>
                                    <span className="text-xs text-on-surface-variant">根据当前壁纸自动生成主题色</span>
                                </div>
                            </div>
                            {/* Switch */}
                            <div className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${selectedPreset === 'Dynamic' ? 'bg-primary' : 'bg-surface-variant'}`}>
                                <motion.div
                                    className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-sm"
                                    animate={{ x: selectedPreset === 'Dynamic' ? 24 : 0 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Static Colors */}
                <motion.div
                    className="flex flex-col gap-4"
                    animate={{
                        opacity: selectedPreset === 'Dynamic' ? 0.5 : 1,
                        filter: selectedPreset === 'Dynamic' ? 'grayscale(100%)' : 'grayscale(0%)'
                    }}
                    transition={{ duration: 0.3 }}
                >
                    <h3 className="text-lg font-bold text-on-surface px-2">静态预设</h3>
                    {/* Increased bottom padding to prevent label clipping and hid overflow-y */}
                    <div className={`flex items-center gap-3 overflow-x-auto pt-4 pb-10 px-4 scrollbar-hide overflow-y-hidden ${selectedPreset === 'Dynamic' ? 'pointer-events-none' : ''}`}>

                        {PRESETS.map((preset) => (
                            <button
                                key={preset.name}
                                onClick={() => handlePresetSelect(preset.name, preset.color)}
                                className={`group relative size-14 shrink-0 rounded-full border-2 transition-transform hover:scale-105 active:scale-95 flex items-center justify-center shadow-sm ${selectedPreset === preset.name ? 'border-primary' : 'border-transparent'}`}
                                style={{ backgroundColor: preset.color }}
                            >
                                {selectedPreset === preset.name && (
                                    <CheckIcon className="w-6 h-6 drop-shadow-md text-white" />
                                )}
                                <span className="absolute -bottom-6 text-xs font-semibold text-on-surface-variant whitespace-nowrap">{preset.label}</span>
                            </button>
                        ))}

                        <div className="w-px h-8 bg-outline/20 mx-1"></div>

                        <button
                            onClick={() => setSelectedPreset('Custom')}
                            className={`group relative size-14 shrink-0 rounded-full border-2 bg-surface-container transition-all hover:scale-105 active:scale-95 flex items-center justify-center ${selectedPreset === 'Custom' ? 'border-primary' : 'border-outline/20 dark:border-white/10'}`}>
                            <TuneIcon className="w-6 h-6 text-on-surface-variant" />
                            <span className="absolute -bottom-6 text-xs font-medium text-on-surface-variant whitespace-nowrap">自定义</span>
                        </button>
                    </div>
                </motion.div>

                {/* Custom RGB Sliders */}
                <AnimatePresence>
                    {selectedPreset === 'Custom' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="rounded-3xl bg-surface p-5 shadow-sm border border-outline/10 dark:border-white/5 mt-2 overflow-hidden"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <PaletteIcon className="w-5 h-5 text-on-surface-variant" />
                                    <span className="text-sm font-bold text-on-surface">自定义 RGB</span>
                                </div>
                                <div className="size-6 rounded-full border border-outline/10 dark:border-white/10 shadow-sm" style={{ backgroundColor: rgbToHex(customRgb) }}></div>
                            </div>

                            <div className="flex flex-col gap-5">
                                {/* RED */}
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">红 (R)</label>
                                        <span className="text-xs font-mono bg-surface-variant text-on-surface-variant px-1.5 py-0.5 rounded">{customRgb.r}</span>
                                    </div>
                                    <div className="relative flex items-center h-4 w-full">
                                        <div className="absolute w-full h-1 bg-gradient-to-r from-gray-200 to-red-400 rounded-full dark:from-gray-700"></div>
                                        <input
                                            className="accent-red-500 relative z-10"
                                            max="255" min="0" type="range"
                                            value={customRgb.r}
                                            onChange={(e) => handleRgbChange('r', parseInt(e.target.value))}
                                        />
                                    </div>
                                </div>

                                {/* GREEN */}
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">绿 (G)</label>
                                        <span className="text-xs font-mono bg-surface-variant text-on-surface-variant px-1.5 py-0.5 rounded">{customRgb.g}</span>
                                    </div>
                                    <div className="relative flex items-center h-4 w-full">
                                        <div className="absolute w-full h-1 bg-gradient-to-r from-gray-200 to-green-400 rounded-full dark:from-gray-700"></div>
                                        <input
                                            className="accent-green-500 relative z-10"
                                            max="255" min="0" type="range"
                                            value={customRgb.g}
                                            onChange={(e) => handleRgbChange('g', parseInt(e.target.value))}
                                        />
                                    </div>
                                </div>

                                {/* BLUE */}
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">蓝 (B)</label>
                                        <span className="text-xs font-mono bg-surface-variant text-on-surface-variant px-1.5 py-0.5 rounded">{customRgb.b}</span>
                                    </div>
                                    <div className="relative flex items-center h-4 w-full">
                                        <div className="absolute w-full h-1 bg-gradient-to-r from-gray-200 to-blue-400 rounded-full dark:from-gray-700"></div>
                                        <input
                                            className="accent-blue-500 relative z-10"
                                            max="255" min="0" type="range"
                                            value={customRgb.b}
                                            onChange={(e) => handleRgbChange('b', parseInt(e.target.value))}
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* About App Section */}
                <div className="flex flex-col gap-4 mt-6">
                    <h3 className="text-lg font-bold text-on-surface px-2">关于应用</h3>
                    <div className="bg-surface-container rounded-3xl p-5 shadow-sm border border-outline/10 dark:border-white/5 flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-surface rounded-full text-primary">
                                <InfoIcon className="w-6 h-6" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-on-surface text-lg">{BUILD_INFO.appName}</span>
                                <span className="text-xs text-on-surface-variant">{BUILD_INFO.description}</span>
                            </div>
                        </div>

                        <div className="w-full h-px bg-outline/10"></div>

                        <div className="grid grid-cols-2 gap-4">
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

export default ThemeSettings;