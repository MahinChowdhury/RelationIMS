import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import api from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';

const GlobalSearch = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const codeReader = useRef<BrowserMultiFormatReader | null>(null);

    useEffect(() => {
        return () => {
            if (codeReader.current) {
                codeReader.current.reset();
            }
        };
    }, []);

    useEffect(() => {
        if (isScanning) {
            const timer = setTimeout(() => {
                startScanner();
            }, 100);
            return () => {
                clearTimeout(timer);
                if (codeReader.current) {
                    codeReader.current.reset();
                    codeReader.current = null;
                }
            };
        }
    }, [isScanning]);

    const startScanner = () => {
        if (!videoRef.current) return;
        if (codeReader.current) return;

        codeReader.current = new BrowserMultiFormatReader();
        codeReader.current.decodeFromVideoDevice(null, videoRef.current, (result, err) => {
            if (result) {
                const code = result.getText();
                codeReader.current?.reset();
                codeReader.current = null;
                setIsScanning(false);
                setQuery(code);
                handleSearch(code);
            }
            if (err && !(err instanceof NotFoundException)) {
                console.error(err);
            }
        }).catch(err => console.error("Camera start failed", err));
    };

    const handleSearch = async (term: string) => {
        if (!term.trim()) return;
        setLoading(true);
        try {
            const res = await api.get<any>(`/ProductItem/code/${term.trim()}`);
            if (res.data && res.data.ProductId) {
                navigate(`/products/${res.data.ProductId}`);
                setQuery('');
            } else {
                alert(t.globalSearch.productNotFound);
            }
        } catch (err) {
            console.error("Search failed", err);
            if ((err as any)?.response?.status === 404) {
                alert(t.globalSearch.itemNotFound.replace('{term}', term));
            } else {
                alert(t.globalSearch.errorSearching);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch(query);
        }
    };

    return (
        <>
            <div className="fixed top-3 right-16 lg:right-6 z-[60] flex items-center animate-in fade-in slide-in-from-top-4 duration-500 gap-2 hidden lg:block">
                <div className="relative group flex items-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-full border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-black/20 overflow-hidden">

                    {/* QR Scanner Button - Desktop Only */}
                    <button
                        onClick={() => setIsScanning(true)}
                        className="pl-3 pr-2 py-2 text-gray-400 hover:text-primary transition-colors border-r border-gray-100 dark:border-gray-700"
                        title={t.globalSearch.scanBarcode}
                    >
                        <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
                    </button>

                    {/* Search Input */}
                    <div className="relative">
                        <input
                            type="text"
                            className="
                                block w-16 sm:w-20 md:w-24
                                h-4 sm:h-4 
                                bg-transparent 
                                px-2             
                                text-sm 
                                text-text-main dark:text-white 
                                placeholder-gray-400 
                                focus:outline-none 
                                focus:w-36 sm:focus:w-40 md:focus:w-44
                                transition-all duration-200
                                rounded-md
                            "
                            placeholder="SKU"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={loading}
                        />
                        {loading && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                <span className="material-symbols-outlined text-sm animate-spin text-primary">progress_activity</span>
                            </div>
                        )}
                        {!loading && query && (
                            <button
                                onClick={() => setQuery('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                            >
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Scanner Modal */}
            {isScanning && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-black border border-white/10 rounded-2xl overflow-hidden max-w-md w-full relative shadow-2xl">
                        <div className="relative aspect-[4/3] bg-gray-900">
                            <video
                                ref={videoRef}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 border-2 border-white/20 m-12 rounded-lg pointer-events-none">
                                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary"></div>
                                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary"></div>
                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary"></div>
                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary"></div>
                            </div>

                            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur rounded px-2 py-1 flex items-center gap-2 border border-white/10">
                                <div className="size-2 bg-red-500 rounded-full animate-pulse"></div>
                                <span className="text-[10px] font-bold text-white uppercase tracking-wider">{t.common.live}</span>
                            </div>
                        </div>

                        <div className="p-4 flex justify-between items-center bg-gray-900 border-t border-white/10">
                            <p className="text-gray-400 text-sm">{t.orders.pointCameraAtBarcode}</p>
                            <button
                                onClick={() => setIsScanning(false)}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-bold transition-colors"
                            >
                                {t.common.cancel}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default GlobalSearch;
