import { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import type { ScannedItem } from '../../types';

interface InventoryTransferScannerProps {
    enabled: boolean;
    scannedItems: ScannedItem[];
    onScanned: (code: string) => void;
    onClose: () => void;
    onError?: (error: any) => void;
    onValidate?: (code: string) => boolean;
}

export default function InventoryTransferScanner({
    enabled,
    scannedItems,
    onScanned,
    onClose,
    onError,
    onValidate
}: InventoryTransferScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const codeReaderRef = useRef<BrowserMultiFormatReader>(new BrowserMultiFormatReader());
    const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

    // Auto-calculate totals
    const totalItems = scannedItems.reduce((acc, item) => acc + item.count, 0);

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

                        // Prevent rapid-fire duplicates if desired, or handle debouncing
                        // For this use case, we might want to allow rapid scanning, but 
                        // let's add a tiny debounce to prevent 60fps scanning of same code
                        if (barcode !== lastScannedCode) {
                            console.log('✅ Barcode detected:', barcode);

                            // Validate if validator provided
                            let isValid = true;
                            if (onValidate) {
                                isValid = onValidate(barcode);
                            }

                            if (isValid) {
                                onScanned(barcode);
                                setLastScannedCode(barcode);
                                // Read-out reset timeout
                                setTimeout(() => setLastScannedCode(null), 1500);
                            } else {
                                // Optional: Error sound or feedback for invalid item
                            }
                        }
                    }
                    if (error && !(error instanceof NotFoundException)) {
                        // ignore common frame errors
                    }
                }
            );
        } catch (err) {
            console.error('Failed to start camera:', err);
            if (onError) onError(err);
        }
    }, [onScanned, onError, lastScannedCode, onValidate]);

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

    return (
        <div
            className={`
    fixed inset-0 z-[60] flex flex-col bg-black
    md:items-center md:justify-center md:p-6 lg:p-8
    h-[100dvh] overflow-hidden
  `}
        >
            {/* Inner wrapper – constrains width on desktop, full-bleed on mobile */}
            <div
                className={`
      flex flex-col w-full h-full
      md:max-w-4xl lg:max-w-5xl xl:max-w-6xl
      md:rounded-2xl md:shadow-2xl md:overflow-hidden
      bg-black
    `}
            >
                {/* Header / Camera Section – now takes available height */}
                <div className="flex-1 relative bg-black min-h-[40vh] md:min-h-[50vh] border-b border-gray-800">
                    <video
                        ref={videoRef}
                        className="absolute inset-0 w-full h-full object-cover opacity-80"
                        playsInline // helps on mobile
                    />

                    {/* Overlay UI – same as before */}
                    <div className="absolute inset-0 pointer-events-none">
                        {/* Top Bar */}
                        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent">
                            <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                                <p className="text-white text-xs font-bold flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                    Live Scanner
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="pointer-events-auto bg-white/10 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/20 transition-all"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Scanner guide rectangle – centered */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 sm:w-80 md:w-96 h-40 sm:h-48 md:h-56 border-2 border-primary/50 rounded-xl md:rounded-2xl">
                            <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-primary -mt-1 -ml-1"></div>
                            <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-primary -mt-1 -mr-1"></div>
                            <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-primary -mb-1 -ml-1"></div>
                            <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-primary -mb-1 -mr-1"></div>
                            <div className="absolute inset-x-0 h-[3px] bg-primary/80 shadow-[0_0_12px_rgba(23,207,84,0.9)] animate-[scan-vertical_2.4s_ease-in-out_infinite]"></div>
                        </div>

                        {/* Instruction text */}
                        <div className="absolute bottom-6 sm:bottom-8 left-0 right-0 text-center">
                            <p className="text-white/80 text-sm sm:text-base font-medium shadow-black drop-shadow-md">
                                Point at a barcode to scan
                            </p>
                        </div>
                    </div>
                </div>

                {/* List Section – bottom panel */}
                <div className="h-[45vh] md:h-auto md:max-h-[45vh] bg-gray-900 border-t border-gray-800 flex flex-col rounded-t-3xl md:rounded-none relative z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] md:shadow-none">
                    {/* Drag Handle / Header – hide drag handle visual on desktop */}
                    <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900 rounded-t-3xl md:rounded-none">
                        <div className="flex items-center gap-3">
                            <div className="bg-gray-800 p-2 rounded-lg text-primary hidden md:block">
                                <span className="material-symbols-outlined text-[20px]">checklist</span>
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm">Scanned Items</h3>
                                <p className="text-gray-500 text-xs">{scannedItems.length} unique items</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total Units</p>
                            <p className="text-2xl font-bold text-primary leading-none">{totalItems}</p>
                        </div>
                    </div>

                    {/* Scrollable list – same as before */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 md:space-y-4">
                        {/* ... your existing list rendering logic ... */}
                    </div>

                    {/* Footer Action */}
                    <div className="p-4 sm:p-6 bg-gray-900 border-t border-gray-800">
                        <button
                            onClick={onClose}
                            className="w-full py-3.5 sm:py-4 bg-primary hover:bg-primary-dark active:scale-95 transition-all text-white font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined">check</span>
                            Done & Review
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
    @keyframes scan-vertical {
      0%   { top: 0%; opacity: 0; }
      10%  { opacity: 1; }
      90%  { opacity: 1; }
      100% { top: 100%; opacity: 0; }
    }
  `}</style>
        </div>
    );
}
