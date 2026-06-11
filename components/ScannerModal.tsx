import React, { useEffect, useRef, useState } from 'react';
import jsQR, { type Point, type QRCode } from 'jsqr';
import { Capacitor } from '@capacitor/core';
import { Camera } from '@capacitor/camera';
import { CloseIcon, QrCodeScannerIcon } from './Icons';
import { motion } from 'framer-motion';

interface ScannerModalProps {
    onScan: (data: string) => boolean | void;
    onClose: () => void;
}

type ScanPhase = 'searching' | 'detected' | 'invalid';

interface QrOverlay {
    x: number;
    y: number;
    width: number;
    height: number;
    corners: Point[];
    detectedAt: number;
}

type CameraTrackCapabilities = MediaTrackCapabilities & {
    focusMode?: string[];
};

type CameraTrackConstraintSet = MediaTrackConstraintSet & {
    focusMode?: string;
};

const NORMAL_SCAN_WIDTH = 640;
const HIGH_DETAIL_SCAN_WIDTH = 960;
const SCAN_INTERVAL_MS = 120;
const HIGH_DETAIL_INTERVAL_MS = 360;
const BOX_HIDE_DELAY_MS = 520;
const SUCCESS_DELAY_MS = 180;

const isTokenQrData = (data: string) => {
    const normalized = data.trim().toLowerCase();
    return normalized.startsWith('otpauth://') || normalized.startsWith('otpauth-migration://');
};

const getVideoPlacement = (video: HTMLVideoElement) => {
    const rect = video.getBoundingClientRect();
    const videoAspect = video.videoWidth / video.videoHeight;
    const containerAspect = rect.width / rect.height;

    if (videoAspect > containerAspect) {
        const width = rect.height * videoAspect;
        return {
            x: (rect.width - width) / 2,
            y: 0,
            width,
            height: rect.height,
        };
    }

    const height = rect.width / videoAspect;
    return {
        x: 0,
        y: (rect.height - height) / 2,
        width: rect.width,
        height,
    };
};

const mapPointToOverlay = (
    point: Point,
    canvas: HTMLCanvasElement,
    placement: ReturnType<typeof getVideoPlacement>
): Point => ({
    x: placement.x + (point.x / canvas.width) * placement.width,
    y: placement.y + (point.y / canvas.height) * placement.height,
});

const mapQrToOverlay = (
    code: QRCode,
    canvas: HTMLCanvasElement,
    video: HTMLVideoElement
): QrOverlay => {
    const placement = getVideoPlacement(video);
    const corners = [
        mapPointToOverlay(code.location.topLeftCorner, canvas, placement),
        mapPointToOverlay(code.location.topRightCorner, canvas, placement),
        mapPointToOverlay(code.location.bottomRightCorner, canvas, placement),
        mapPointToOverlay(code.location.bottomLeftCorner, canvas, placement),
    ];
    const xs = corners.map(point => point.x);
    const ys = corners.map(point => point.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const padding = Math.max(10, Math.min(maxX - minX, maxY - minY) * 0.08);

    return {
        x: minX - padding,
        y: minY - padding,
        width: maxX - minX + padding * 2,
        height: maxY - minY + padding * 2,
        corners,
        detectedAt: Date.now(),
    };
};

const requestCameraStream = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('当前环境不支持摄像头');
    }

    const primaryConstraints: MediaStreamConstraints = {
        audio: false,
        video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30, max: 30 },
        },
    };

    const fallbackConstraints: MediaStreamConstraints = {
        audio: false,
        video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 24, max: 30 },
        },
    };

    try {
        return await navigator.mediaDevices.getUserMedia(primaryConstraints);
    } catch {
        return navigator.mediaDevices.getUserMedia(fallbackConstraints);
    }
};

const tuneCameraTrack = async (stream: MediaStream) => {
    const [track] = stream.getVideoTracks();
    if (!track?.getCapabilities || !track.applyConstraints) return;

    const capabilities = track.getCapabilities() as CameraTrackCapabilities;
    const advanced: CameraTrackConstraintSet[] = [];

    if (capabilities.focusMode?.includes('continuous')) {
        advanced.push({ focusMode: 'continuous' });
    }

    if (advanced.length > 0) {
        await track.applyConstraints({ advanced }).catch(() => {});
    }
};

const ScannerModal: React.FC<ScannerModalProps> = ({ onScan, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const scanTimerRef = useRef<number | null>(null);
    const boxTimerRef = useRef<number | null>(null);
    const completeTimerRef = useRef<number | null>(null);
    const lastHighDetailScanRef = useRef(0);
    const hasScannedRef = useRef(false);

    const [error, setError] = useState('');
    const [isInitializing, setIsInitializing] = useState(true);
    const [qrOverlay, setQrOverlay] = useState<QrOverlay | null>(null);
    const [scanPhase, setScanPhase] = useState<ScanPhase>('searching');

    useEffect(() => {
        let stream: MediaStream | null = null;
        let disposed = false;

        const clearBoxLater = () => {
            if (boxTimerRef.current) {
                window.clearTimeout(boxTimerRef.current);
            }

            boxTimerRef.current = window.setTimeout(() => {
                if (!hasScannedRef.current) {
                    setQrOverlay(null);
                    setScanPhase('searching');
                }
            }, BOX_HIDE_DELAY_MS);
        };

        const scheduleScan = (scanFrame: () => void) => {
            if (!disposed && !hasScannedRef.current) {
                scanTimerRef.current = window.setTimeout(scanFrame, SCAN_INTERVAL_MS);
            }
        };

        const scanFrame = () => {
            const video = videoRef.current;

            try {
                if (!video || video.readyState < video.HAVE_ENOUGH_DATA || video.videoWidth === 0) {
                    return;
                }

                if (!canvasRef.current) {
                    canvasRef.current = document.createElement('canvas');
                }

                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                if (!ctx) {
                    return;
                }

                const now = Date.now();
                const shouldUseHighDetail = now - lastHighDetailScanRef.current > HIGH_DETAIL_INTERVAL_MS;
                const targetWidth = shouldUseHighDetail ? HIGH_DETAIL_SCAN_WIDTH : NORMAL_SCAN_WIDTH;

                if (shouldUseHighDetail) {
                    lastHighDetailScanRef.current = now;
                }

                const processingWidth = Math.min(targetWidth, video.videoWidth);
                const scale = processingWidth / video.videoWidth;
                const scaledWidth = Math.round(video.videoWidth * scale);
                const scaledHeight = Math.round(video.videoHeight * scale);

                if (canvas.width !== scaledWidth) canvas.width = scaledWidth;
                if (canvas.height !== scaledHeight) canvas.height = scaledHeight;

                ctx.drawImage(video, 0, 0, scaledWidth, scaledHeight);

                const imageData = ctx.getImageData(0, 0, scaledWidth, scaledHeight);
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: shouldUseHighDetail ? 'attemptBoth' : 'dontInvert',
                });

                if (code?.data) {
                    const overlay = mapQrToOverlay(code, canvas, video);
                    setQrOverlay(overlay);

                    if (isTokenQrData(code.data)) {
                        hasScannedRef.current = true;
                        setScanPhase('detected');
                        completeTimerRef.current = window.setTimeout(() => {
                            const accepted = onScan(code.data);
                            if (accepted === false) {
                                hasScannedRef.current = false;
                                setScanPhase('invalid');
                                clearBoxLater();
                                scheduleScan(scanFrame);
                            }
                        }, SUCCESS_DELAY_MS);
                        return;
                    }

                    setScanPhase('invalid');
                    clearBoxLater();
                }
            } finally {
                scheduleScan(scanFrame);
            }
        };

        const startCamera = async () => {
            try {
                if (Capacitor.isNativePlatform()) {
                    const status = await Camera.checkPermissions();
                    if (status.camera !== 'granted') {
                        const request = await Camera.requestPermissions({ permissions: ['camera'] });
                        if (request.camera !== 'granted') throw new Error('权限被拒绝');
                    }
                }

                const nextStream = await requestCameraStream();
                if (disposed) {
                    nextStream.getTracks().forEach(track => track.stop());
                    return;
                }

                stream = nextStream;
                await tuneCameraTrack(stream);

                const video = videoRef.current;
                if (!video) return;

                video.srcObject = stream;
                video.onloadedmetadata = () => {
                    video.play()
                        .then(() => {
                            if (disposed) return;
                            setIsInitializing(false);
                            setScanPhase('searching');
                            scheduleScan(scanFrame);
                        })
                        .catch(() => {
                            setError('无法播放摄像头画面');
                            setIsInitializing(false);
                        });
                };
            } catch (err) {
                console.error('Camera Start Error:', err);
                setError(err instanceof Error ? err.message : '无法启动摄像头');
                setIsInitializing(false);
            }
        };

        startCamera();

        return () => {
            disposed = true;
            if (scanTimerRef.current) window.clearTimeout(scanTimerRef.current);
            if (boxTimerRef.current) window.clearTimeout(boxTimerRef.current);
            if (completeTimerRef.current) window.clearTimeout(completeTimerRef.current);
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [onScan]);

    const title = error
        ? '无法使用摄像头'
        : scanPhase === 'detected'
            ? '已识别二维码'
            : scanPhase === 'invalid'
                ? '这不是令牌二维码'
                : '正在寻找二维码';

    const subtitle = error
        ? error
        : scanPhase === 'detected'
            ? '正在导入令牌'
            : scanPhase === 'invalid'
                ? '请换成 Matcha 或 Google Authenticator 的迁移二维码'
                : '将二维码放入画面即可';

    const polygonPoints = qrOverlay?.corners.map(point => `${point.x},${point.y}`).join(' ');
    const accentColor = scanPhase === 'invalid' ? '#ef4444' : 'var(--md-sys-color-primary)';

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background text-on-surface"
        >
            <div className="absolute inset-0 overflow-hidden bg-black">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    disablePictureInPicture
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-out ${isInitializing || error ? 'opacity-0' : 'opacity-100'}`}
                />

                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,transparent_48%,rgba(0,0,0,0.34)_100%)]" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/0 to-black/65" />

                {polygonPoints && qrOverlay && (
                    <>
                        <svg className="pointer-events-none absolute inset-0 z-20 h-full w-full">
                            <motion.polygon
                                key={qrOverlay.detectedAt}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                points={polygonPoints}
                                fill={scanPhase === 'invalid' ? 'rgba(239,68,68,0.14)' : 'rgba(135,154,108,0.16)'}
                                stroke={accentColor}
                                strokeWidth="3"
                                strokeLinejoin="round"
                            />
                        </svg>
                        <motion.div
                            key={`box-${qrOverlay.detectedAt}`}
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="pointer-events-none absolute z-20 rounded-[1.35rem] border-2 shadow-[0_0_40px_rgba(0,0,0,0.28)]"
                            style={{
                                left: qrOverlay.x,
                                top: qrOverlay.y,
                                width: qrOverlay.width,
                                height: qrOverlay.height,
                                borderColor: accentColor,
                                boxShadow: scanPhase === 'invalid'
                                    ? '0 0 0 9999px rgba(0,0,0,0.16), 0 0 28px rgba(239,68,68,0.32)'
                                    : '0 0 0 9999px rgba(0,0,0,0.12), 0 0 32px rgba(135,154,108,0.34)',
                            }}
                        />
                    </>
                )}
            </div>

            <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-4 pt-12">
                <div>
                    <h3 className="text-lg font-bold text-white drop-shadow-sm">扫描二维码</h3>
                    <p className="text-xs font-medium text-white/70 drop-shadow-sm">Matcha Auth</p>
                </div>
                <button
                    onClick={onClose}
                    className="flex size-11 items-center justify-center rounded-full border border-white/10 bg-black/25 text-white backdrop-blur-xl transition-colors hover:bg-black/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                    aria-label="关闭扫描"
                >
                    <CloseIcon className="h-6 w-6" />
                </button>
            </div>

            <div
                className="absolute inset-x-4 z-30"
                style={{ bottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
            >
                <div className="flex items-center gap-4 rounded-3xl border border-white/10 bg-surface-container/95 p-4 text-on-surface shadow-2xl backdrop-blur-xl dark:border-white/5">
                    <div className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${error || scanPhase === 'invalid' ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'}`}>
                        {isInitializing && !error ? (
                            <div className="size-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                            <QrCodeScannerIcon className="h-7 w-7" />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-base font-bold leading-tight">{isInitializing && !error ? '启动相机中' : title}</p>
                        <p className="mt-1 text-sm font-medium leading-snug text-on-surface-variant">{subtitle}</p>
                    </div>
                    {error && (
                        <button
                            onClick={onClose}
                            className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-bold text-on-primary shadow-sm"
                        >
                            关闭
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default ScannerModal;
