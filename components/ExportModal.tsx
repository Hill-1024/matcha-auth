import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import QRCode from 'qrcode';
import { Token } from '../types';
import { generateOtpauthUri } from '../services/totpService';
import { generateMigrationUri } from '../services/migrationService';
import { CloseIcon } from './Icons';

interface ExportModalProps {
    data: Token | Token[];
    onClose: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ data, onClose }) => {
    const [qrUrl, setQrUrl] = useState<string>('');
    const isBatch = Array.isArray(data);
    const title = isBatch ? `批量导出 (${data.length}个)` : '导出令牌';
    const secretText = isBatch ? '批量导出数据已包含在二维码中' : (data as Token).secret;

    useEffect(() => {
        const generate = async () => {
            try {
                let uri = '';
                if (isBatch) {
                    uri = generateMigrationUri(data as Token[]);
                } else {
                    uri = generateOtpauthUri(data as Token);
                }

                const url = await QRCode.toDataURL(uri, {
                    width: 300,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    }
                });
                setQrUrl(url);
            } catch (err) {
                console.error(err);
            }
        };
        generate();
    }, [data, isBatch]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="relative bg-surface-container w-full max-w-sm rounded-[2rem] p-6 shadow-xl flex flex-col items-center z-10"
            >
                <div className="w-full flex justify-end mb-2">
                    <button onClick={onClose} className="p-2 hover:bg-surface-variant rounded-full text-on-surface-variant">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                <h3 className="text-xl font-bold text-on-surface mb-1">{title}</h3>
                <p className="text-sm text-on-surface-variant mb-6 text-center">使用其他设备扫描此二维码以导入</p>

                <div className="bg-white p-4 rounded-3xl shadow-sm mb-6">
                    {qrUrl ? (
                        <img src={qrUrl} alt="Token QR Code" className="w-48 h-48" />
                    ) : (
                        <div className="w-48 h-48 bg-gray-100 animate-pulse rounded-xl"></div>
                    )}
                </div>

                <div className="w-full bg-surface-container-high p-4 rounded-xl">
                    <p className="text-xs text-on-surface-variant font-mono break-all text-center select-all">
                        {secretText}
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default ExportModal;