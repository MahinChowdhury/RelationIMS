import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

interface BarcodeScannerProps {
    enabled: boolean;
    onScanned: (barcode: string) => void;
    onError?: (error: any) => void;
    onClose: () => void;
}

export default function BarcodeScanner({ enabled, onScanned, onError, onClose }: BarcodeScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const codeReaderRef = useRef<BrowserMultiFormatReader>(new BrowserMultiFormatReader());

    const stopScanning = useCallback(() => {
        codeReaderRef.current.reset();
    }, []);

    const startScanning = useCallback(async () => {
        if (!videoRef.current) return;

        try {
            await codeReaderRef.current.decodeFromVideoDevice(
                null,
                videoRef.current,
                (result, error) => {
                    if (result) {
                        const barcode = result.getText();
                        console.log('✅ Barcode detected:', barcode);
                        onScanned(barcode);
                    }
                    if (error && !(error instanceof NotFoundException)) {
                        // ignore
                    }
                }
            );
        } catch (err) {
            console.error('Failed to start camera:', err);
            if (onError) onError(err);
        }
    }, [onScanned, onError, stopScanning]);

    useEffect(() => {
        if (enabled) {
            const timer = setTimeout(() => {
                startScanning();
            }, 100);
            return () => {
                clearTimeout(timer);
                stopScanning();
            };
        } else {
            stopScanning();
        }
    }, [enabled, startScanning, stopScanning]);

    return createPortal(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-start md:items-center justify-center p-4 pt-4 md:pt-0">
            <div className="bg-white dark:bg-background-dark rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col">

                {/* Header */}
                <div className="bg-white dark:bg-background-dark p-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined text-[28px]">qr_code_scanner</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-extrabold text-text-main dark:text-white tracking-tight">Scan Barcode</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Use camera to scan</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all"
                        >
                            <span className="material-symbols-outlined text-[24px]">close</span>
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 min-h-[400px] bg-black relative">
                    <video
                        ref={videoRef}
                        className={`w-full h-full object-cover ${!enabled ? 'hidden' : ''}`}
                    />

                    {/* Initializing State */}
                    {!enabled && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                            <div className="text-center">
                                <div className="w-12 h-12 border-4 border-gray-700 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-gray-400 text-sm font-semibold">Initializing camera...</p>
                            </div>
                        </div>
                    )}

                    {/* Scanning Overlay */}
                    {enabled && (
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 border border-white/20 rounded-xl backdrop-blur-[1px]">
                                <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-primary rounded-tl-xl"></div>
                                <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-primary rounded-tr-xl"></div>
                                <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-primary rounded-bl-xl"></div>
                                <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-primary rounded-br-xl"></div>

                                <div className="absolute inset-0 overflow-hidden rounded-xl">
                                    <div className="w-full h-1 bg-primary/80 shadow-[0_0_20px_rgba(23,207,84,0.8)] animate-[scan_3s_ease-in-out_infinite]"></div>
                                </div>
                            </div>
                            <div className="absolute bottom-8 left-0 w-full text-center">
                                <span className="inline-block px-5 py-2.5 bg-black/60 backdrop-blur-md rounded-full text-white text-sm font-medium">
                                    Point camera at a barcode
                                </span>
                            </div>
                        </div>
                    )}

                    <style>{`
                        @keyframes scan {
                            0% { transform: translateY(-100%); opacity: 0; }
                            20% { opacity: 1; }
                            80% { opacity: 1; }
                            100% { transform: translateY(200%); opacity: 0; }
                        }
                    `}</style>
                </div>

                {/* Footer */}
                <div className="p-5 bg-gray-50 dark:bg-black/30 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
                    <div className="flex items-start gap-3 text-text-main dark:text-gray-300">
                        <span className="material-symbols-outlined text-[22px] text-primary mt-0.5">info</span>
                        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                            Hold your device steady. The scanner automatically detects barcode.
                        </p>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
