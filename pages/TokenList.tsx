import React, { useState, useEffect, useCallback } from 'react';
import { Token } from '../types';
import TokenCard from '../components/TokenCard';
import ScannerModal from '../components/ScannerModal';
import ExportModal from '../components/ExportModal';
import ActionSheet from '../components/ActionSheet';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import Toast from '../components/Toast';
import { generateTotpValues, parseOtpauthUri } from '../services/totpService';
import { 
    SettingsIcon, 
    SearchIcon, 
    CloseIcon, 
    SearchOffIcon, 
    AddIcon,
    QrCodeScannerIcon,
    KeyboardIcon
} from '../components/Icons';

interface TokenListProps {
  onSettingsClick: () => void;
  isScannerOpen: boolean;
  setIsScannerOpen: (isOpen: boolean) => void;
}

const TokenList: React.FC<TokenListProps> = ({ onSettingsClick, isScannerOpen, setIsScannerOpen }) => {
  // Load initial state from local storage or empty array
  const [tokens, setTokens] = useState<Token[]>(() => {
    const saved = localStorage.getItem('matcha_tokens');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [exportToken, setExportToken] = useState<Token | null>(null);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null); // For ActionSheet
  const [tokenToDelete, setTokenToDelete] = useState<Token | null>(null); // For DeleteConfirmModal
  const [isFabOpen, setIsFabOpen] = useState(false); // Controls the FAB Menu
  
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
    setIsAddModalOpen(false);
    resetForm();
  };

  // Use useCallback to ensure the function reference remains stable across re-renders.
  const handleScanSuccess = useCallback((uri: string) => {
    const parsed = parseOtpauthUri(uri);
    if (parsed && parsed.secret) {
        const newToken: Token = {
            id: Math.random().toString(36).substr(2, 9),
            issuer: parsed.issuer || 'Unknown',
            account: parsed.account || 'Account',
            secret: parsed.secret,
            code: 'Loading',
            icon: 'key',
            period: parsed.period || 30,
            remaining: 30
        };
        setTokens(prev => [newToken, ...prev]);
        setIsScannerOpen(false);
    } else {
        alert("无效的二维码");
    }
  }, [setIsScannerOpen]);

  const confirmDelete = () => {
      if (tokenToDelete) {
          setTokens(prev => prev.filter(t => t.id !== tokenToDelete.id));
          setTokenToDelete(null);
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

  return (
    <div className="flex flex-col h-full min-h-screen bg-background pb-5">
      {/* Top Bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between bg-surface dark:bg-surface p-4 pt-12 shadow-sm transition-colors">
        <h2 className="text-on-surface text-3xl font-bold leading-tight tracking-tight flex-1">令牌</h2>
        <div className="flex items-center justify-end gap-3">
          {/* Removed QrCodeScannerIcon from here */}
          <button 
             onClick={onSettingsClick}
             className="flex items-center justify-center rounded-full h-10 w-10 bg-surface-container-high text-on-surface-variant hover:bg-surface-variant transition-colors">
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
        {filteredTokens.map(token => (
          <TokenCard 
            key={token.id} 
            token={token} 
            onCopy={handleCopy} 
            onMoreClick={(t) => setSelectedToken(t)}
          />
        ))}
        {filteredTokens.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <SearchOffIcon className="w-16 h-16 mb-4" />
            <p className="text-lg font-medium">无令牌</p>
            <button onClick={() => setIsAddModalOpen(true)} className="mt-4 text-primary font-bold">
                添加一个?
            </button>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      <Toast 
        message={toastMessage} 
        isVisible={isToastVisible} 
        onClose={() => setIsToastVisible(false)} 
      />

      {/* FAB Group */}
      
      {/* Backdrop for FAB Menu */}
      {isFabOpen && (
        <div 
            className="fixed inset-0 z-20 bg-black/20 backdrop-blur-[1px] transition-opacity" 
            onClick={() => setIsFabOpen(false)}
        ></div>
      )}

      <div className="fixed bottom-8 right-5 z-30 flex flex-col items-end gap-3">
        {/* Sub FAB: Scan */}
        {isFabOpen && (
          <div className="flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-200">
             <span className="bg-surface-container-high text-on-surface text-sm font-bold px-3 py-1.5 rounded-xl shadow-sm border border-outline/10">二维码导入</span>
             <button 
               onClick={() => { setIsFabOpen(false); setIsScannerOpen(true); }}
               className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container shadow-lg hover:brightness-110 transition-all"
             >
               <QrCodeScannerIcon className="w-6 h-6" />
             </button>
          </div>
        )}

        {/* Sub FAB: Manual */}
        {isFabOpen && (
          <div className="flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-200 delay-75">
             <span className="bg-surface-container-high text-on-surface text-sm font-bold px-3 py-1.5 rounded-xl shadow-sm border border-outline/10">手动输入</span>
             <button 
               onClick={() => { setIsFabOpen(false); setIsAddModalOpen(true); }}
               className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container shadow-lg hover:brightness-110 transition-all"
             >
               <KeyboardIcon className="w-6 h-6" />
             </button>
          </div>
        )}

        {/* Main FAB */}
        <button 
          onClick={() => setIsFabOpen(!isFabOpen)}
          className={`group flex h-[3.5rem] w-[3.5rem] items-center justify-center rounded-2xl bg-primary text-on-primary shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 ${isFabOpen ? 'rotate-[-135deg] bg-red-500 text-white shadow-red-500/30' : ''}`}
        >
          <AddIcon className="w-8 h-8" />
        </button>
      </div>

      {/* Modals & Sheets */}
      
      {/* Action Sheet for Options */}
      {selectedToken && (
        <ActionSheet 
            token={selectedToken}
            onClose={() => setSelectedToken(null)}
            onExport={() => {
                setExportToken(selectedToken);
                setSelectedToken(null);
            }}
            onDelete={() => {
                setTokenToDelete(selectedToken);
                setSelectedToken(null);
            }}
        />
      )}
      
      {/* Delete Confirmation Modal */}
      {tokenToDelete && (
          <DeleteConfirmModal 
            token={tokenToDelete}
            onConfirm={confirmDelete}
            onCancel={() => setTokenToDelete(null)}
          />
      )}

      {/* Scanner */}
      {isScannerOpen && (
          <ScannerModal onScan={handleScanSuccess} onClose={() => setIsScannerOpen(false)} />
      )}

      {/* Export QR */}
      {exportToken && (
          <ExportModal token={exportToken} onClose={() => setExportToken(null)} />
      )}

      {/* Add Token Modal (Manual) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-surface-container w-full max-w-sm rounded-[2rem] p-6 shadow-xl animate-in zoom-in-95 duration-200 border border-outline/10">
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
                onClick={() => { setIsAddModalOpen(false); resetForm(); }}
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
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenList;