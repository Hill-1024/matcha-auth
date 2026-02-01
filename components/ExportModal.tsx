import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Token } from '../types';
import { generateOtpauthUri } from '../services/totpService';
import { CloseIcon } from './Icons';

interface ExportModalProps {
  token: Token;
  onClose: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ token, onClose }) => {
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    const generate = async () => {
      try {
        const uri = generateOtpauthUri(token);
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
  }, [token]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface-container w-full max-w-sm rounded-[2rem] p-6 shadow-xl flex flex-col items-center">
        <div className="w-full flex justify-end mb-2">
            <button onClick={onClose} className="p-2 hover:bg-surface-variant rounded-full text-on-surface-variant">
                <CloseIcon className="w-6 h-6" />
            </button>
        </div>
        
        <h3 className="text-xl font-bold text-on-surface mb-1">导出令牌</h3>
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
                {token.secret}
             </p>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;