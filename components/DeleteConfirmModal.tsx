import React from 'react';
import { motion } from 'framer-motion';
import { Token } from '../types';

interface DeleteConfirmModalProps {
  token: Token;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ token, onConfirm, onCancel }) => {
  return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onCancel}
        />
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative bg-surface-container w-full max-w-sm rounded-[2rem] p-6 shadow-xl border border-outline/10 z-10"
        >
          <h3 className="text-xl font-bold text-on-surface mb-2">删除令牌?</h3>
          <p className="text-sm text-on-surface-variant mb-6">
            确定要移除 <span className="font-bold text-on-surface">{token.issuer} ({token.account})</span> 吗？此操作无法撤销。
          </p>

          <div className="flex items-center justify-end gap-2">
            <button
                onClick={onCancel}
                className="px-4 py-2 text-primary font-bold text-sm hover:bg-primary/10 rounded-full transition-colors"
            >
              取消
            </button>
            <button
                onClick={onConfirm}
                className="px-6 py-2 bg-red-500 text-white font-bold text-sm rounded-full shadow-sm hover:bg-red-600 transition-all"
            >
              删除
            </button>
          </div>
        </motion.div>
      </div>
  );
};

export default DeleteConfirmModal;