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
        <div className="fixed inset-0 bg-black/95 z-[60] flex flex-col h-[100dvh]">
            {/* Header / Camera Section - Top Half */}
            <div className="flex-1 relative bg-black min-h-[40vh] border-b border-gray-800">
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover opacity-80"
                />

                {/* Overlay UI */}
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

                    {/* Scanner Rect */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-40 border-2 border-primary/50 rounded-lg">
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-primary -mt-1 -ml-1"></div>
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-primary -mt-1 -mr-1"></div>
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-primary -mb-1 -ml-1"></div>
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-primary -mb-1 -mr-1"></div>
                        <div className="absolute inset-x-0 h-[2px] bg-primary/80 shadow-[0_0_10px_rgba(23,207,84,0.8)] animate-[scan-vertical_2s_ease-in-out_infinite]"></div>
                    </div>

                    {/* Instruction */}
                    <div className="absolute bottom-4 left-0 right-0 text-center">
                        <p className="text-white/80 text-sm font-medium shadow-black drop-shadow-md">
                            Point at a barcode to scan
                        </p>
                    </div>
                </div>
            </div>

            {/* List Section - Bottom Half */}
            <div className="h-[45vh] bg-gray-900 border-t border-gray-800 flex flex-col rounded-t-2xl -mt-4 relative z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                {/* Drag Handle / Header */}
                <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="bg-gray-800 p-2 rounded-lg text-primary">
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

                {/* Scrollable List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {scannedItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-2">
                            <span className="material-symbols-outlined text-4xl">qr_code_scanner</span>
                            <p className="text-sm">No items scanned yet</p>
                        </div>
                    ) : (
                        [...scannedItems].sort((a, b) => b.scannedAt.getTime() - a.scannedAt.getTime()).map((item) => ( // Show newest first
                            <div key={item.id} className="bg-gray-800/50 p-3 rounded-xl border border-gray-700/50 flex items-center justify-between animate-in slide-in-from-bottom-2 fade-in duration-300">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.isValid === false ? 'bg-red-900/20 text-red-500' : 'bg-primary/10 text-primary'}`}>
                                        <span className="material-symbols-outlined text-[20px]">
                                            {item.isValid === false ? 'error' : 'inventory_2'}
                                        </span>
                                    </div>
                                    <div>
                                        <h4 className={`font-bold text-sm ${item.isValid === false ? 'text-red-400' : 'text-white'}`}>
                                            {item.description || item.code}
                                        </h4>
                                        <p className="text-xs text-gray-500">Code: {item.code}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="bg-gray-900 px-3 py-1 rounded-md border border-gray-700">
                                        <span className="text-white font-mono font-bold">x{item.count}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer Action */}
                <div className="p-4 bg-gray-900 border-t border-gray-800">
                    <button
                        onClick={onClose}
                        className="w-full py-3.5 bg-primary hover:bg-green-600 active:scale-95 transition-all text-white font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined">check</span>
                        Done & Review
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes scan-vertical {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
            `}</style>
        </div>
    );
}
