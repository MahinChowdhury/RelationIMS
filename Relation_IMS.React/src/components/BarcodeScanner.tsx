import { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

interface BarcodeScannerProps {
    enabled: boolean;
    onScanned: (barcode: string) => void;
    onError?: (error: any) => void;
    onClose: () => void;
}

export default function BarcodeScanner({ enabled, onScanned, onError, onClose }: BarcodeScannerProps) {
    const [mode, setMode] = useState<'camera' | 'upload'>('camera');
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const codeReaderRef = useRef<BrowserMultiFormatReader>(new BrowserMultiFormatReader());

    const resetUpload = useCallback(() => {
        setUploadedImage(null);
        setIsProcessing(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

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
                        stopScanning();
                    }
                    if (error && !(error instanceof NotFoundException)) {
                        console.error('Scan error:', error);
                        if (onError) onError(error);
                    }
                }
            );
        } catch (err) {
            console.error('Failed to start camera:', err);
            if (onError) onError(err);
        }
    }, [onScanned, onError, stopScanning]);

    useEffect(() => {
        if (enabled && mode === 'camera') {
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
    }, [enabled, mode, startScanning, stopScanning]);

    const handleModeChange = (newMode: 'camera' | 'upload') => {
        if (mode === newMode) return;
        setMode(newMode);
        if (newMode === 'camera') {
            resetUpload();
        } else {
            stopScanning();
        }
    };

    const decodeFromImage = async (imageSrc: string) => {
        setIsProcessing(true);
        try {
            const img = new Image();
            img.src = imageSrc;
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });

            const result = await codeReaderRef.current.decodeFromImageElement(img);
            const barcode = result.getText();
            console.log('✅ Barcode detected from image:', barcode);
            onScanned(barcode);
        } catch (err) {
            console.error('Failed to decode barcode from image:', err);
            if (onError) onError({ message: 'No barcode found in image. Please try a different image.' });
        } finally {
            setIsProcessing(false);
        }
    };

    const processFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            setUploadedImage(result);
            decodeFromImage(result);
        };
        reader.readAsDataURL(file);
    };

    const onFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            processFile(event.target.files[0]);
        }
    };

    const onDrop = (event: React.DragEvent) => {
        event.preventDefault();
        event.stopPropagation();
        if (event.dataTransfer.files && event.dataTransfer.files[0]) {
            processFile(event.dataTransfer.files[0]);
        }
    };

    const onDragOver = (event: React.DragEvent) => {
        event.preventDefault();
        event.stopPropagation();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-background-dark rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col">

                {/* Header - unchanged size */}
                <div className="bg-white dark:bg-background-dark p-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined text-[28px]">qr_code_scanner</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-extrabold text-text-main dark:text-white tracking-tight">Scan Barcode</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Use camera or upload image</p>
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

                {/* Mode Tabs - slightly reduced vertical padding for better proportion */}
                <div className="flex border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-black/20 flex-shrink-0">
                    <button
                        onClick={() => handleModeChange('camera')}
                        className={`flex-1 py-3 px-6 flex items-center justify-center gap-2 transition-all font-bold text-sm ${
                            mode === 'camera'
                                ? 'bg-white dark:bg-background-dark text-primary border-b-2 border-primary shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                    >
                        <span className="material-symbols-outlined text-[20px]">videocam</span>
                        Camera Scan
                    </button>
                    <button
                        onClick={() => handleModeChange('upload')}
                        className={`flex-1 py-3 px-6 flex items-center justify-center gap-2 transition-all font-bold text-sm ${
                            mode === 'upload'
                                ? 'bg-white dark:bg-background-dark text-primary border-b-2 border-primary shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                    >
                        <span className="material-symbols-outlined text-[20px]">upload_file</span>
                        Upload Image
                    </button>
                </div>

                {/* Main Content Area - Increased height for camera */}
                <div className="flex-1 min-h-0 overflow-hidden">
                    {/* Camera Mode - Taller scanner */}
                    {mode === 'camera' && (
                        <div className="relative bg-black h-full">
                            <video
                                ref={videoRef}
                                className={`w-full h-full object-cover ${!enabled ? 'hidden' : ''}`}
                            />

                            {/* Loading State */}
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

                            <style jsx>{`
                                @keyframes scan {
                                    0% { transform: translateY(-100%); opacity: 0; }
                                    20% { opacity: 1; }
                                    80% { opacity: 1; }
                                    100% { transform: translateY(200%); opacity: 0; }
                                }
                            `}</style>
                        </div>
                    )}

                    {/* Upload Mode - Matches camera height area */}
                    {mode === 'upload' && (
                        <div className="relative bg-gray-50 dark:bg-black/20 h-full flex items-center justify-center p-8">
                            <div className="text-center w-full max-w-md">
                                {uploadedImage ? (
                                    <div className="mb-6 relative">
                                        <img
                                            src={uploadedImage}
                                            className="max-h-96 mx-auto rounded-xl shadow-xl border-2 border-gray-200 dark:border-gray-700"
                                            alt="Uploaded barcode"
                                        />
                                        <button
                                            onClick={resetUpload}
                                            className="absolute -top-3 -right-3 bg-white dark:bg-gray-800 text-gray-600 hover:text-red-600 rounded-full p-2 shadow-lg transition-all"
                                        >
                                            <span className="material-symbols-outlined text-[24px]">close</span>
                                        </button>

                                        {isProcessing && (
                                            <div className="absolute inset-0 bg-white/90 dark:bg-black/90 flex items-center justify-center rounded-xl backdrop-blur-sm">
                                                <div className="text-center">
                                                    <div className="w-12 h-12 border-4 border-gray-300 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                                                    <p className="text-primary font-bold text-lg">Processing...</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div
                                        className="border-4 border-dashed border-gray-300 dark:border-gray-600 rounded-3xl p-12 bg-white dark:bg-background-dark hover:border-primary dark:hover:border-primary hover:bg-gray-50 dark:hover:bg-white/5 transition-all cursor-pointer group"
                                        onClick={() => fileInputRef.current?.click()}
                                        onDragOver={onDragOver}
                                        onDrop={onDrop}
                                    >
                                        <div className="w-20 h-20 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined text-[40px] text-gray-400 group-hover:text-primary transition-colors">
                                                upload_file
                                            </span>
                                        </div>
                                        <h3 className="text-2xl font-bold text-text-main dark:text-white mb-2">Click to upload</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">PNG, JPG, GIF or SVG (max 10MB)</p>
                                        <button className="px-8 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-base transition-all shadow-lg shadow-primary/30">
                                            Select Image
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={onFileSelected}
                    className="hidden"
                />

                {/* Footer - unchanged */}
                <div className="p-5 bg-gray-50 dark:bg-black/30 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
                    <div className="flex items-start gap-3 text-text-main dark:text-gray-300">
                        <span className="material-symbols-outlined text-[22px] text-primary mt-0.5">info</span>
                        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                                Hold your device steady. The scanner automatically detects barcode.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}