import React from 'react';
import { motion } from 'framer-motion';
import { Token } from '../types';
import { QrCodeScannerIcon, KeyIcon, DeleteIcon } from './Icons';

interface ActionSheetProps {
  token: Token;
  onClose: () => void;
  onExport: () => void;
  onDelete: () => void;
}

const ActionSheet: React.FC<ActionSheetProps> = ({ token, onClose, onExport, onDelete }) => {
  return (
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
        {/* Backdrop */}
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        />

        {/* Sheet Content */}
        <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full max-w-sm bg-surface-container rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-xl z-10"
        >
          {/* Handle bar for mobile feel */}
          <div className="w-12 h-1.5 bg-on-surface-variant/20 rounded-full mx-auto mb-6 sm:hidden"></div>

          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className="flex items-center justify-center size-12 rounded-xl bg-primary/10 text-primary shrink-0">
              {token.icon?.startsWith('http') ? (
                  <img src={token.icon} className="size-8 object-contain" alt="" />
              ) : (
                  <KeyIcon className="size-6" />
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <h3 className="text-lg font-bold text-on-surface truncate">{token.issuer}</h3>
              <p className="text-sm text-on-surface-variant truncate">{token.account}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={onExport}
                className="flex items-center gap-4 w-full p-4 rounded-xl bg-surface-container-high hover:bg-surface-variant transition-colors text-on-surface"
            >
              <div className="p-2 bg-background rounded-full">
                <QrCodeScannerIcon className="w-5 h-5" />
              </div>
              <div className="flex flex-col items-start">
                <span className="font-semibold">导出二维码</span>
                <span className="text-xs text-on-surface-variant">显示用于迁移的二维码</span>
              </div>
            </motion.button>

            <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={onDelete}
                className="flex items-center gap-4 w-full p-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-colors text-red-600 dark:text-red-400 mt-2"
            >
              <div className="p-2 bg-background/50 rounded-full">
                <DeleteIcon className="w-5 h-5" />
              </div>
              <div className="flex flex-col items-start">
                <span className="font-semibold">移除令牌</span>
                <span className="text-xs opacity-70">此操作无法撤销</span>
              </div>
            </motion.button>
          </div>

          {/* Cancel Button */}
          <button
              onClick={onClose}
              className="w-full mt-6 py-3 text-center text-primary font-bold hover:bg-primary/5 rounded-full transition-colors"
          >
            取消
          </button>
        </motion.div>
      </div>
  );
};

export default ActionSheet;