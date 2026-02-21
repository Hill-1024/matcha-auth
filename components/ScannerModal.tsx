import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Capacitor } from '@capacitor/core';
import { Camera } from '@capacitor/camera';
import { CloseIcon } from './Icons';
import { motion } from 'framer-motion';

interface ScannerModalProps {
    onScan: (data: string) => void;
    onClose: () => void;
}

const ScannerModal: React.FC<ScannerModalProps> = ({ onScan, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const requestRef = useRef<number>(0);
    const lastScanRef = useRef<number>(0); // To throttle scanning frequency
    const [error, setError] = useState<string>('');
    const [isInitializing, setIsInitializing] = useState(true);

    // 1. Setup Camera and Scanning Loop
    useEffect(() => {
        let stream: MediaStream | null = null;

        const startCamera = async () => {
            try {
                // Permission Check (Capacitor)
                if (Capacitor.isNativePlatform()) {
                    const status = await Camera.checkPermissions();
                    if (status.camera !== 'granted') {
                        const request = await Camera.requestPermissions({ permissions: ['camera'] });
                        if (request.camera !== 'granted') throw new Error("权限被拒绝");
                    }
                }

                // Native Browser API
                // We request HD, but we will process it at a lower resolution
                const constraints = {
                    video: {
                        facingMode: 'environment',
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        // @ts-ignore
                        focusMode: 'continuous'
                    }
                };

                stream = await navigator.mediaDevices.getUserMedia(constraints);

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    // Wait for video to be ready before starting loop
                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current?.play();
                        // Delay slightly to ensure the first frame is actually rendered before fading in
                        // This completely eliminates the "gray icon" flash
                        setTimeout(() => {
                            setIsInitializing(false);
                            requestRef.current = requestAnimationFrame(tick);
                        }, 150);
                    };
                }

            } catch (err: any) {
                console.error("Camera Start Error:", err);
                setError("无法启动摄像头");
                setIsInitializing(false);
            }
        };

        startCamera();

        // Cleanup
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            if (stream) {
                stream.getTracks().forEach(track => {
                    track.stop();
                });
            }
        };
    }, []);

    // 2. The Scanning Loop (Performance Optimized)
    const tick = () => {
        // Keep the loop running
        requestRef.current = requestAnimationFrame(tick);

        // Throttle: Only scan every 150ms (~6-7 FPS) to save CPU/Battery and allow UI thread to breathe
        const now = Date.now();
        if (now - lastScanRef.current < 150) {
            return;
        }
        lastScanRef.current = now;

        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            // Create canvas once
            if (!canvasRef.current) {
                canvasRef.current = document.createElement('canvas');
            }

            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            if (ctx) {
                // PERFORMANCE FIX: Downscale image for processing.
                // A 1080p image is too big for jsQR to process in real-time on mobile.
                // We scale it down so the width is roughly 480px, maintaining aspect ratio.
                // This is usually sufficient for QR codes and massive improves speed.
                const processingWidth = 480;
                const scale = processingWidth / video.videoWidth;

                const scaledWidth = video.videoWidth * scale;
                const scaledHeight = video.videoHeight * scale;

                if (canvas.width !== scaledWidth) canvas.width = scaledWidth;
                if (canvas.height !== scaledHeight) canvas.height = scaledHeight;

                // Draw current frame (Scaled down)
                ctx.drawImage(video, 0, 0, scaledWidth, scaledHeight);

                // Get image data
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                // Decode
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert", // Most 2FA QR codes are black on white.
                });

                if (code && code.data && code.data.length > 0) {
                    // Double check it's not empty
                    onScan(code.data);
                    // Note: We don't stop the loop here strictly, but the parent component usually unmounts us.
                }
            }
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col"
        >
            {/* 1. Fullscreen Video Feed */}
            <div className="relative flex-1 bg-black overflow-hidden">
                <video
                    ref={videoRef}
                    // CSS Magic: Opacity transition hides the ugly "empty video" icon
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-out ${isInitializing ? 'opacity-0' : 'opacity-100'}`}
                    playsInline // iOS requirement
                    muted // Autoplay requirement
                />

                {/* Visual Overlay - PURE CSS */}
                <div className="absolute inset-0 z-10 pointer-events-none">
                    {/*
                Layer 1: The Mask (Shadow Overlay)
                We use a massive box-shadow to create the dark overlay around the transparent center.
            */}
                    <div className="absolute top-[15%] left-[10%] right-[10%] bottom-[35%] rounded-[2.5rem] shadow-[0_0_0_5000px_rgba(0,0,0,0.6)]"></div>

                    {/*
                Layer 2: The Decorations (Minimalist Border)
                Removed the heavy theme-colored corners for a cleaner look.
            */}
                    <div className="absolute top-[15%] left-[10%] right-[10%] bottom-[35%] rounded-[2.5rem] overflow-hidden border border-white/20">
                        {/* Scanning Laser (GPU Accelerated) */}
                        {!isInitializing && (
                            <motion.div
                                initial={{ top: 0, opacity: 0 }}
                                animate={{ top: "100%", opacity: [0, 1, 1, 0] }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 2,
                                    ease: "linear"
                                }}
                                className="absolute inset-x-4 h-0.5 bg-white/50 shadow-[0_0_15px_rgba(255,255,255,0.5)] rounded-full"
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* 2. Controls Layer (Top) */}
            <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 pt-12">
                <h3 className="text-white/90 font-bold text-lg drop-shadow-md">扫描二维码</h3>
                <button
                    onClick={onClose}
                    className="p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-colors border border-white/10"
                >
                    <CloseIcon className="w-6 h-6" />
                </button>
            </div>

            {/* 3. Status Layer (Middle/Bottom) */}
            <div className="absolute top-[68%] inset-x-0 z-20 flex flex-col items-center justify-center pointer-events-none">
                {isInitializing && (
                    <div className="flex flex-col items-center gap-3 animate-pulse">
                        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <p className="text-white/80 text-sm font-medium">启动相机中...</p>
                    </div>
                )}

                {!isInitializing && !error && (
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-white/80 text-sm font-medium px-6 py-2 bg-black/30 backdrop-blur-md rounded-full border border-white/5"
                    >
                        对准二维码即可自动识别
                    </motion.p>
                )}

                {error && (
                    <div className="pointer-events-auto px-6 py-4 bg-surface-container/90 backdrop-blur-xl rounded-2xl shadow-xl flex flex-col items-center text-center gap-3 mx-8">
                        <div className="p-2 bg-red-500/10 text-red-500 rounded-full">
                            <CloseIcon className="w-6 h-6" />
                        </div>
                        <span className="text-on-surface text-sm font-bold">{error}</span>
                        <button
                            onClick={onClose}
                            className="text-primary font-bold text-sm px-4 py-2 hover:bg-primary/10 rounded-full"
                        >
                            关闭
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default ScannerModal;