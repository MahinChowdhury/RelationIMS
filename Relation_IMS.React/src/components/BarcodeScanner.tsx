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
            // Small delay to ensure video element is mounted and ready
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
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl border-2 border-[#d0e7d7] overflow-hidden">

                {/* Header */}
                <div className="bg-gradient-to-r from-[#4e9767] to-[#3d7a52] p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black">Scan Barcode</h2>
                                <p className="text-sm text-white/80">Use camera or upload image</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/20 rounded-xl transition-all text-2xl font-bold"
                        >
                            ×
                        </button>
                    </div>
                </div>

                {/* Mode Tabs */}
                <div className="flex border-b-2 border-[#e7f3eb] bg-[#f8fcf9]">
                    <button
                        onClick={() => handleModeChange('camera')}
                        className={`flex-1 py-4 px-6 flex items-center justify-center gap-2 transition-all hover:bg-white/50 ${mode === 'camera'
                                ? 'bg-white text-[#4e9767] font-bold border-b-2 border-[#4e9767]'
                                : 'text-gray-600'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Camera Scan
                    </button>
                    <button
                        onClick={() => handleModeChange('upload')}
                        className={`flex-1 py-4 px-6 flex items-center justify-center gap-2 transition-all hover:bg-white/50 ${mode === 'upload'
                                ? 'bg-white text-[#4e9767] font-bold border-b-2 border-[#4e9767]'
                                : 'text-gray-600'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Upload Image
                    </button>
                </div>

                {/* Camera Mode */}
                {mode === 'camera' && (
                    <div className="relative bg-black">
                        <video
                            ref={videoRef}
                            className={`w-full h-[400px] object-cover ${!enabled ? 'hidden' : ''}`}
                        ></video>

                        {/* Loading State */}
                        {!enabled && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-16 h-16 border-4 border-[#e7f3eb] border-t-[#4e9767] rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-white text-lg font-semibold">Initializing camera...</p>
                                </div>
                            </div>
                        )}

                        {/* Scanning Overlay */}
                        {enabled && (
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64">
                                    <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-[#4e9767] rounded-tl-2xl"></div>
                                    <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-[#4e9767] rounded-tr-2xl"></div>
                                    <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-[#4e9767] rounded-bl-2xl"></div>
                                    <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-[#4e9767] rounded-br-2xl"></div>

                                    <div className="absolute inset-0 overflow-hidden">
                                        <div className="w-full h-0.5 bg-[#4e9767] shadow-lg shadow-[#4e9767]/50 animate-[scan_2s_ease-in-out_infinite]"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <style>{`
              @keyframes scan {
                0% { transform: translateY(0); }
                100% { transform: translateY(256px); }
              }
            `}</style>
                    </div>
                )}

                {/* Upload Mode */}
                {mode === 'upload' && (
                    <div className="relative bg-gradient-to-br from-[#f8fcf9] to-white">
                        <div className="h-[400px] flex items-center justify-center p-8">
                            <div className="text-center w-full max-w-md">
                                {uploadedImage ? (
                                    <div className="mb-6">
                                        <img src={uploadedImage} className="max-h-64 mx-auto rounded-xl shadow-lg border-2 border-[#d0e7d7]" alt="Uploaded barcode" />
                                        {isProcessing && (
                                            <div className="mt-4">
                                                <div className="w-12 h-12 border-4 border-[#e7f3eb] border-t-[#4e9767] rounded-full animate-spin mx-auto"></div>
                                                <p className="text-[#4e9767] font-semibold mt-3">Processing image...</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div
                                        className="border-3 border-dashed border-[#d0e7d7] rounded-2xl p-12 bg-white hover:bg-[#f8fcf9] transition-colors cursor-pointer"
                                        onClick={() => fileInputRef.current?.click()}
                                        onDragOver={onDragOver}
                                        onDrop={onDrop}
                                    >
                                        <div className="w-20 h-20 bg-gradient-to-br from-[#4e9767] to-[#3d7a52] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                        </div>
                                        <p className="text-xl font-bold text-[#0e1b12] mb-2">Drop image here or click to upload</p>
                                        <p className="text-sm text-gray-600 mb-4">Supports JPG, PNG, or any image format</p>
                                        <button className="bg-gradient-to-r from-[#4e9767] to-[#3d7a52] text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-shadow">
                                            Choose File
                                        </button>
                                    </div>
                                )}

                                {uploadedImage && !isProcessing && (
                                    <button
                                        onClick={resetUpload}
                                        className="mt-4 text-[#4e9767] font-semibold hover:underline"
                                    >
                                        Upload Different Image
                                    </button>
                                )}
                            </div>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={onFileSelected}
                            className="hidden"
                        />
                    </div>
                )}

                {/* Footer */}
                <div className="p-6 bg-gradient-to-br from-[#f8fcf9] to-white border-t-2 border-[#e7f3eb]">
                    <div className="flex items-center gap-3 text-[#0e1b12]">
                        <svg className="w-5 h-5 text-[#4e9767] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        {mode === 'camera' && (
                            <p className="text-sm font-medium">
                                Hold your camera steady and position the barcode within the frame. The scanner will automatically detect and read it.
                            </p>
                        )}
                        {mode === 'upload' && (
                            <p className="text-sm font-medium">
                                Upload a clear image of your barcode. Ensure the barcode is visible and not blurry for best results.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
