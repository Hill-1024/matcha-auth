import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Variants, LayoutGroup } from 'framer-motion';
import { Token, PopupType } from '../types';
import TokenCard from '../components/TokenCard';
import ScannerModal from '../components/ScannerModal';
import ExportModal from '../components/ExportModal';
import ActionSheet from '../components/ActionSheet';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import Toast from '../components/Toast';
import { generateTotpValues, parseOtpauthUri } from '../services/totpService';
import { parseMigrationUri } from '../services/migrationService';
import { initIconService } from '../services/iconService';
import {
    SettingsIcon,
    SearchIcon,
    CloseIcon,
    SearchOffIcon,
    AddIcon,
    QrCodeScannerIcon,
    KeyboardIcon,
    ExportIcon
} from '../components/Icons';

interface TokenListProps {
    onSettingsClick: () => void;
    onTheTop: PopupType;
    setOnTheTop: (popup: PopupType) => void;
}

const TokenList: React.FC<TokenListProps> = ({ onSettingsClick, onTheTop, setOnTheTop }) => {
    // Load initial state from local storage or empty array
    const [tokens, setTokens] = useState<Token[]>(() => {
        const saved = localStorage.getItem('matcha_tokens');
        return saved ? JSON.parse(saved) : [];
    });

    // Init Icon Service
    useEffect(() => {
        initIconService();
    }, []);

    const [search, setSearch] = useState('');
    const [exportData, setExportData] = useState<Token | Token[] | null>(null);
    const [selectedToken, setSelectedToken] = useState<Token | null>(null); // For ActionSheet
    const [tokenToDelete, setTokenToDelete] = useState<Token | null>(null); // For DeleteConfirmModal

    // Toast State
    const [toastMessage, setToastMessage] = useState('');
    const [isToastVisible, setIsToastVisible] = useState(false);

    // Add Modal State
    const [newIssuer, setNewIssuer] = useState('');
    const [newAccount, setNewAccount] = useState('');
    const [newSecret, setNewSecret] = useState('');

    // Save to local storage whenever tokens change
    useEffect(() => {
        localStorage.setItem('matcha_tokens', JSON.stringify(tokens));
    }, [tokens]);

    const handleUpdateToken = useCallback((id: string, updates: Partial<Token>) => {
        setTokens(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    }, []);

    // The Heartbeat: Update TOTP codes every second
    useEffect(() => {
        const interval = setInterval(() => {
            setTokens(currentTokens => currentTokens.map(t => {
                const { code, remaining } = generateTotpValues(t.secret, t.period);
                // Only trigger update if values changed to avoid unnecessary re-renders
                if (t.code !== code || t.remaining !== remaining) {
                    return { ...t, code, remaining };
                }
                return t;
            }));
        }, 1000);

        // Initial calculation on mount
        setTokens(currentTokens => currentTokens.map(t => {
            const { code, remaining } = generateTotpValues(t.secret, t.period);
            return { ...t, code, remaining };
        }));

        return () => clearInterval(interval);
    }, []);

    const handleCopy = (code: string) => {
        const cleanCode = code.replace(/\s/g, '');
        navigator.clipboard.writeText(cleanCode);

        // Show Toast
        setToastMessage(`已复制: ${cleanCode}`);
        setIsToastVisible(true);

        // Hide logic is handled inside Toast component via onclose,
        // but we can also manually reset strict state if needed,
        // though the component handles the timeout visually.
        setTimeout(() => setIsToastVisible(false), 2000);
    };

    const handleAddToken = () => {
        if (!newIssuer || !newAccount || !newSecret) return;

        const newToken: Token = {
            id: Math.random().toString(36).substr(2, 9),
            issuer: newIssuer,
            account: newAccount,
            secret: newSecret.replace(/\s/g, '').toUpperCase(), // Clean secret
            code: '000000', // Will be calculated immediately by effect
            icon: 'key',
            period: 30,
            remaining: 30
        };

        setTokens(prev => [newToken, ...prev]);
        setOnTheTop('none');
        resetForm();
    };

    // Use useCallback to ensure the function reference remains stable across re-renders.
    const handleScanSuccess = useCallback((uri: string) => {
        if (uri.startsWith('otpauth-migration://')) {
            try {
                const newTokens = parseMigrationUri(uri);
                if (newTokens.length > 0) {
                    setTokens(prev => [...newTokens, ...prev]);
                    setOnTheTop('none');
                    setToastMessage(`成功导入 ${newTokens.length} 个令牌`);
                    setIsToastVisible(true);
                    setTimeout(() => setIsToastVisible(false), 2000);
                } else {
                    alert("未找到有效的令牌");
                }
            } catch (error) {
                console.error("Migration parsing error:", error);
                alert("解析批量导入QR Code失败");
            }
            return;
        }

        const parsed = parseOtpauthUri(uri);
        const validParsed = parsed ? parsed.filter((p): p is Partial<Token> & { secret: string } => !!p.secret) : [];

        if (validParsed.length > 0) {
            const newTokens = validParsed.map(p => ({
                id: Math.random().toString(36).substr(2, 9),
                issuer: p.issuer || 'Unknown',
                account: p.account || 'Account',
                secret: p.secret,
                code: 'Loading',
                icon: 'key',
                period: p.period || 30,
                remaining: 30
            }));
            setTokens(prev => [...newTokens, ...prev]);
            setOnTheTop('none');
            setToastMessage(`成功导入 ${newTokens.length} 个令牌`);
            setIsToastVisible(true);
            setTimeout(() => setIsToastVisible(false), 2000);
        } else {
            alert("无效的QR Code");
        }
    }, [setOnTheTop]);

    const confirmDelete = () => {
        if (tokenToDelete) {
            setTokens(prev => prev.filter(t => t.id !== tokenToDelete.id));
            setOnTheTop('none');
        }
    };

    const resetForm = () => {
        setNewIssuer('');
        setNewAccount('');
        setNewSecret('');
    };

    const filteredTokens = tokens.filter(t =>
        t.issuer.toLowerCase().includes(search.toLowerCase()) ||
        t.account.toLowerCase().includes(search.toLowerCase())
    );

    // Animation Variants
    const containerVariants: Variants = {
        hidden: {
            opacity: 0,
            transition: {
                staggerChildren: 0.05,
                staggerDirection: -1
            }
        },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.07,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { y: 20, opacity: 0, scale: 0.95 },
        visible: {
            y: 0,
            opacity: 1,
            scale: 1,
            transition: { type: 'spring', stiffness: 300, damping: 24 }
        },
        exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-full min-h-screen bg-background pb-5"
        >
            {/* Top Bar */}
            <div className="sticky top-0 z-20 flex items-center justify-between bg-surface dark:bg-surface p-4 pt-12 shadow-sm transition-colors">
                <h2 className="text-on-surface text-3xl font-bold leading-tight tracking-tight flex-1">令牌</h2>
                <div className="flex items-center justify-end gap-3">
                    <button
                        onClick={() => {
                            setExportData(tokens);
                            setOnTheTop('export');
                        }}
                        className="flex items-center justify-center rounded-full h-10 w-10 bg-surface-container-high text-on-surface-variant hover:bg-surface-variant transition-colors"
                        title="批量导出">
                        <ExportIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={onSettingsClick}
                        className="flex items-center justify-center rounded-full h-10 w-10 bg-surface-container-high text-on-surface-variant hover:bg-surface-variant transition-colors"
                        title="设置">
                        <SettingsIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="px-4 pb-6 pt-2 z-10 sticky top-[88px] bg-background">
                <div className="relative flex w-full items-center rounded-full bg-surface-container-high h-[56px] transition-colors overflow-hidden group focus-within:bg-surface-variant">
                    <div className="flex items-center justify-center pl-4 pr-3 text-on-surface-variant">
                        <SearchIcon className="w-6 h-6" />
                    </div>
                    <input
                        className="flex w-full bg-transparent border-none text-on-surface placeholder:text-on-surface-variant focus:ring-0 text-base font-normal h-full rounded-full"
                        placeholder="搜索账户"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="flex items-center justify-center pr-4 text-on-surface-variant">
                            <CloseIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* List */}
            <div className="flex flex-col gap-3 px-4 overflow-y-auto no-scrollbar pb-24">
                <LayoutGroup>
                    <AnimatePresence mode='popLayout'>
                        {filteredTokens.map(token => (
                            <motion.div
                                layout
                                key={token.id}
                                variants={itemVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >
                                <TokenCard
                                    token={token}
                                    onCopy={handleCopy}
                                    onUpdateToken={handleUpdateToken}
                                    onMoreClick={(t) => {
                                        setSelectedToken(t);
                                        setOnTheTop('actionSheet');
                                    }}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </LayoutGroup>

                {filteredTokens.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-20 opacity-50"
                    >
                        <SearchOffIcon className="w-16 h-16 mb-4" />
                        <p className="text-lg font-medium">无令牌</p>
                        <button onClick={() => {
                            setOnTheTop('addModal');
                        }} className="mt-4 text-primary font-bold">
                            添加一个?
                        </button>
                    </motion.div>
                )}
            </div>

            {/* Toast Notification */}
            <Toast
                message={toastMessage}
                isVisible={isToastVisible}
                onClose={() => setIsToastVisible(false)}
            />

            {/* FAB Group */}
            <AnimatePresence>
                {onTheTop === 'fab' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-20 bg-black/20 backdrop-blur-[2px]"
                        onClick={() => setOnTheTop('none')}
                    />
                )}
            </AnimatePresence>

            <div className="fixed bottom-8 right-5 z-30 flex flex-col items-end pointer-events-none">
                <AnimatePresence>
                    {onTheTop === 'fab' && (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            className="flex flex-col items-end gap-4 mb-4 pointer-events-auto"
                        >
                            {/* Sub FAB: Scan */}
                            <motion.div variants={itemVariants} className="flex items-center gap-3">
                                <span className="bg-surface-container-high text-on-surface text-sm font-bold px-3 py-1.5 rounded-xl shadow-sm border border-outline/10">扫描导入</span>
                                <button
                                    onClick={() => {
                                        setOnTheTop('scanner');
                                    }}
                                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container shadow-lg hover:brightness-110 transition-all"
                                >
                                    <QrCodeScannerIcon className="w-6 h-6" />
                                </button>
                            </motion.div>

                            {/* Sub FAB: Manual */}
                            <motion.div variants={itemVariants} className="flex items-center gap-3">
                                <span className="bg-surface-container-high text-on-surface text-sm font-bold px-3 py-1.5 rounded-xl shadow-sm border border-outline/10">手动输入</span>
                                <button
                                    onClick={() => {
                                        setOnTheTop('addModal');
                                    }}
                                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container shadow-lg hover:brightness-110 transition-all"
                                >
                                    <KeyboardIcon className="w-6 h-6" />
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main FAB */}
                <motion.button
                    onClick={() => {
                        if (onTheTop === 'fab') {
                            setOnTheTop('none');
                        } else {
                            setOnTheTop('fab');
                        }
                    }}
                    className={`pointer-events-auto group flex h-[3.5rem] w-[3.5rem] items-center justify-center rounded-2xl shadow-lg shadow-primary/30 hover:shadow-xl z-30 ${onTheTop === 'fab' ? 'bg-red-500 text-white shadow-red-500/30' : 'bg-primary text-on-primary'}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    animate={{ rotate: onTheTop === 'fab' ? 135 : 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                    <AddIcon className="w-8 h-8" />
                </motion.button>
            </div>

            {/* Modals & Sheets */}

            {/* Action Sheet for Options */}
            <AnimatePresence>
                {onTheTop === 'actionSheet' && selectedToken && (
                    <ActionSheet
                        key="action-sheet"
                        token={selectedToken}
                        onClose={() => setOnTheTop('none')}
                        onExport={() => {
                            setExportData(selectedToken);
                            setOnTheTop('export');
                        }}
                        onDelete={() => {
                            setTokenToDelete(selectedToken);
                            setOnTheTop('deleteConfirm');
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {onTheTop === 'deleteConfirm' && tokenToDelete && (
                    <DeleteConfirmModal
                        key="delete-confirm"
                        token={tokenToDelete}
                        onConfirm={confirmDelete}
                        onCancel={() => setOnTheTop('none')}
                    />
                )}
            </AnimatePresence>

            {/* Scanner */}
            <AnimatePresence>
                {onTheTop === 'scanner' && (
                    <ScannerModal key="scanner" onScan={handleScanSuccess} onClose={() => setOnTheTop('none')} />
                )}
            </AnimatePresence>

            {/* Export QR */}
            <AnimatePresence>
                {onTheTop === 'export' && exportData && (
                    <ExportModal key="export" data={exportData} onClose={() => setOnTheTop('none')} />
                )}
            </AnimatePresence>

            {/* Add Token Modal (Manual) */}
            <AnimatePresence>
                {onTheTop === 'addModal' && (
                    <div key="add-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={() => setOnTheTop('none')}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="relative bg-surface-container w-full max-w-sm rounded-[2rem] p-6 shadow-xl border border-outline/10 dark:border-white/5 z-10"
                        >
                            <h3 className="text-xl font-bold text-on-surface mb-1">添加令牌</h3>
                            <p className="text-sm text-on-surface-variant mb-6">手动输入密钥详情</p>

                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold text-primary ml-1">发行方 (Issuer)</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        className="w-full bg-surface-container-high rounded-xl border-none p-3 text-on-surface focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-on-surface-variant/50"
                                        placeholder="例如: Google"
                                        value={newIssuer}
                                        onChange={(e) => setNewIssuer(e.target.value)}
                                    />
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold text-primary ml-1">账户 (Account)</label>
                                    <input
                                        type="text"
                                        className="w-full bg-surface-container-high rounded-xl border-none p-3 text-on-surface focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-on-surface-variant/50"
                                        placeholder="例如: user@email.com"
                                        value={newAccount}
                                        onChange={(e) => setNewAccount(e.target.value)}
                                    />
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold text-primary ml-1">密钥 (Secret Key)</label>
                                    <input
                                        type="text"
                                        className="w-full bg-surface-container-high rounded-xl border-none p-3 text-on-surface focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-on-surface-variant/50 font-mono text-sm"
                                        placeholder="例如: JBSWY3DPEHPK3PXP"
                                        value={newSecret}
                                        onChange={(e) => setNewSecret(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 mt-8">
                                <button
                                    onClick={() => { setOnTheTop('none'); resetForm(); }}
                                    className="px-4 py-2 text-primary font-bold text-sm hover:bg-primary/10 rounded-full transition-colors"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleAddToken}
                                    disabled={!newIssuer || !newAccount || !newSecret}
                                    className="px-6 py-2 bg-primary text-on-primary font-bold text-sm rounded-full shadow-sm hover:shadow-md disabled:opacity-50 disabled:shadow-none transition-all"
                                >
                                    保存
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default TokenList;