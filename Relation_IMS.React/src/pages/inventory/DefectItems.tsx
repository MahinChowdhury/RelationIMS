import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import useIntersectionObserver from '../../hooks/useIntersectionObserver';
import useDebounce from '../../hooks/useDebounce';
import type { DefectItem } from '../../types/inventory';
import BarcodeScanner from '../../components/BarcodeScanner';
import { useLanguage } from '../../i18n/LanguageContext';

export default function DefectItems() {
    const { t } = useLanguage();
    // State
    const [defects, setDefects] = useState<DefectItem[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [totalCount, setTotalCount] = useState(0);

    // Scanner State
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    // Form State
    const [productCode, setProductCode] = useState('');
    const [reason, setReason] = useState('Damaged on arrival');
    const [registering, setRegistering] = useState(false);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 300);

    // Infinite Scroll Hook
    const { containerRef, isVisible } = useIntersectionObserver({ threshold: 0.1 });

    // Initial Load & Search Trigger
    useEffect(() => {
        loadDefects(true);
    }, [debouncedSearch]);

    // Infinite Scroll Trigger
    useEffect(() => {
        if (isVisible && !loading && hasMore) {
            setPage(prev => prev + 1);
        }
    }, [isVisible]);

    useEffect(() => {
        if (page > 1) {
            loadDefects(false);
        }
    }, [page]);

    // --- Logic ---
    const loadDefects = async (reset: boolean) => {
        if (reset) {
            setDefects([]);
            setPage(1);
            setHasMore(true);
        }

        setLoading(true);
        try {
            const params = new URLSearchParams({
                search: debouncedSearch || '',
                pageNumber: reset ? '1' : page.toString(),
                pageSize: '20'
            });

            const res = await api.get(`/ProductItem/defects?${params.toString()}`);
            const data = res.data;

            // Handle both array and object responses for robustness
            const newDefects = Array.isArray(data) ? data : (data.items || []);
            const count = data.totalCount || 0;

            if (reset) {
                setDefects(newDefects);
                setTotalCount(count || newDefects.length);
            } else {
                setDefects(prev => [...prev, ...newDefects]);
            }

            if (newDefects.length < 20) setHasMore(false);

        } catch (error) {
            console.error('Failed to load defects:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterDefect = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!productCode.trim()) return;

        setRegistering(true);
        try {
            await api.post(`/ProductItem/${productCode}/defect`, { reason });
            setProductCode('');
            loadDefects(true); // Reload list after successful registration
        } catch (error) {
            console.error('Failed to register defect:', error);
            alert(t.inventory.failedToRegisterDefect);
        } finally {
            setRegistering(false);
        }
    };

    const handleAction = async (id: number, action: 'sell' | 'restore') => {
        // Placeholder for actions as they were not explicitly defined in requirements beyond "logos"
        console.log(`Action ${action} for defect item ${id}`);
        // api.post(`/ProductItem/defect/${id}/${action}`) ...
    };

    const handleBarcodeScanned = (code: string) => {
        setProductCode(code);
        setIsScannerOpen(false);
        // Optionally trigger registration immediately
        // handleRegisterDefect(); 
    };

    return (
        <div className="container mx-auto max-w-7xl px-4 py-4 md:px-8 md:py-8 flex flex-col gap-6 md:gap-8">
            

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl md:text-4xl font-extrabold text-text-main dark:text-white tracking-tight">{t.inventory.defectedItems || 'Defected Items'}</h1>
                    <p className="text-text-secondary dark:text-gray-400 text-sm md:text-base max-w-2xl">
                        {t.inventory.defectSubtitle || 'Report and manage damaged inventory. Scan or enter a product code to log an issue.'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-text-main bg-white border border-gray-200 rounded-lg hover:bg-gray-50 dark:bg-[var(--color-surface-dark-card)] dark:border-[var(--color-surface-dark-border)] dark:text-gray-200 dark:hover:bg-white/5 transition-all shadow-sm">
                        <span className="material-symbols-outlined text-[20px]">print</span>
                        <span className="hidden sm:inline">{t.inventory.printLog || 'Print Log'}</span>
                        <span className="sm:hidden">{t.common.print || 'Print'}</span>
                    </button>
                </div>
            </div>

            {/* Register Form */}
            <div className="w-full bg-white dark:bg-[var(--color-surface-dark-card)] rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-[var(--color-surface-dark-border)] p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className="flex-1 w-full md:w-auto">
                    <label className="block text-sm font-bold text-text-main dark:text-white mb-2" htmlFor="product-code">
                        {t.inventory.registerDefectedItem || 'Register Defected Item'}
                    </label>
                    <div className="relative flex items-center">
                        <button
                            type="button"
                            onClick={() => setIsScannerOpen(true)}
                            className="absolute inset-y-0 left-0 flex items-center pl-3 hover:text-primary transition-colors z-10"
                            title={t.common.scan || "Scan Barcode"}
                        >
                            <span className="material-symbols-outlined text-gray-400">qr_code_scanner</span>
                        </button>
                        <input
                            autoFocus
                            type="text"
                            id="product-code"
                            value={productCode}
                            onChange={(e) => setProductCode(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRegisterDefect()}
                            className="block w-full p-4 pl-10 text-sm text-text-main border border-gray-300 rounded-lg bg-gray-50 focus:ring-primary focus:border-primary dark:bg-[var(--color-surface-dark-solid)] dark:border-[var(--color-surface-dark-border)] dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary dark:focus:border-primary transition-colors"
                            placeholder={t.inventory.scanQRPlaceholder || "Scan QR code or enter SKU (e.g. JEANS-001)"}
                        />
                    </div>
                    <p className="mt-2 text-xs text-text-secondary dark:text-gray-400">{t.inventory.pressEnterToRegister || 'Press Enter to register automatically.'}</p>
                </div>
                <div className="hidden md:block w-px h-16 bg-gray-200 dark:bg-[#2a4032]"></div>
                <div className="w-full md:w-auto flex flex-col gap-2">
                    <label className="block text-sm font-bold text-text-main dark:text-white" htmlFor="defect-reason">
                        {t.inventory.reasonOptional || 'Reason (Optional)'}
                    </label>
                    <select
                        id="defect-reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="bg-gray-50 border border-gray-300 text-text-main text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-[var(--color-surface-dark-solid)] dark:border-[var(--color-surface-dark-border)] dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary dark:focus:border-primary"
                    >
                        <option value="Damaged on arrival">{t.inventory.damagedOnArrival || 'Damaged on arrival'}</option>
                        <option value="Manufacturing defect">{t.inventory.manufacturingDefect || 'Manufacturing defect'}</option>
                        <option value="Customer return (damaged)">{t.inventory.customerReturnDamaged || 'Customer return (damaged)'}</option>
                        <option value="Expired / Obsolete">{t.inventory.expiredObsolete || 'Expired / Obsolete'}</option>
                        <option value="Other">{t.inventory.other || 'Other'}</option>
                    </select>
                </div>
                <div className="w-full md:w-auto mt-4 md:mt-6">
                    <button
                        onClick={() => handleRegisterDefect()}
                        disabled={registering || !productCode.trim()}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors shadow-sm focus:ring-4 focus:ring-primary/20 disabled:opacity-50"
                        title={t.inventory.markAsDefected || "Mark as Defected"}
                    >
                        {registering ? (
                            <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                        ) : (
                            <span className="material-symbols-outlined text-[24px]">arrow_forward</span>
                        )}
                        <span className="md:hidden">{registering ? t.inventory.processing || 'Processing...' : t.inventory.markAsDefected || 'Mark As Defected'}</span>
                    </button>
                </div>
            </div>

            {/* Table Section */}
            <div className="mt-2">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-text-main dark:text-white">{t.inventory.recentlyReported || 'Recently Reported Items'}</h3>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                                <span className="material-symbols-outlined text-gray-400 text-[18px]">search</span>
                            </div>
                            <input
                                type="text"
                                id="table-search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block p-2 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg w-64 bg-gray-50 focus:ring-primary focus:border-primary dark:bg-[var(--color-surface-dark-solid)] dark:border-[var(--color-surface-dark-border)] dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary dark:focus:border-primary"
                                placeholder={t.inventory.searchLogs || "Search logs..."}
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[var(--color-surface-dark-border)] shadow-sm bg-white dark:bg-[var(--color-surface-dark-card)]">
                    <table className="w-full text-sm text-left text-text-main dark:text-gray-300">
                        <thead className="text-xs text-text-secondary uppercase bg-gray-50 dark:bg-[var(--color-surface-dark-solid)] dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-4 font-bold" scope="col">{t.inventory.defectDate || 'Defect Date'}</th>
                                <th className="px-6 py-4 font-bold" scope="col">{t.common.product || 'Product Name'}</th>
                                <th className="px-6 py-4 font-bold" scope="col">{t.common.code || 'SKU / Code'}</th>
                                <th className="px-6 py-4 font-bold" scope="col">{t.common.description || 'Reason'}</th>
                                <th className="px-6 py-4 font-bold" scope="col">{t.common.status || 'Status'}</th>
                                <th className="px-6 py-4 font-bold" scope="col">{t.inventory.processedBy || 'Reported By'}</th>
                                <th className="px-6 py-4 font-bold text-right" scope="col">{t.common.actions || 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-[#2a4032]">
                            {defects.map((defect) => (
                                <tr key={defect.Id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-text-secondary dark:text-gray-400">
                                        {defect.DefectDate ? new Date(defect.DefectDate).toLocaleString() : (t.common.notAvailable || 'N/A')}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-text-main dark:text-white flex items-center gap-3">
                                        <div
                                            className="size-8 rounded bg-gray-100 bg-center bg-cover border border-gray-200 dark:border-gray-700"
                                            style={{ backgroundImage: `url("${defect.ProductImageUrl || 'https://via.placeholder.com/32'}")` }}
                                        ></div>
                                        <span>{defect.ProductName}</span>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs">{defect.Code}</td>
                                    <td className="px-6 py-4">
                                        <span className="text-text-main dark:text-gray-300">{defect.Reason}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${defect.Status === 'Pending' ? 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400' :
                                            defect.Status === 'Processing Return' ? 'text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400' :
                                                defect.Status === 'Discarded' ? 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300' :
                                                    'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400'
                                            }`}>
                                            {defect.Status === 'Pending' ? (t.inventory.pending || 'Pending') :
                                                defect.Status === 'Processing Return' ? (t.inventory.processingReturn || 'Processing Return') :
                                                    defect.Status === 'Discarded' ? (t.inventory.discarded || 'Discarded') :
                                                        (t.common.completed || 'Completed')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 flex items-start gap-2">
                                        <div className="size-6 rounded-full bg-gray-200 flex items-center justify-center font-bold text-[10px] text-gray-500">
                                            {defect.ReportedBy?.substring(0, 2).toUpperCase() || '??'}
                                        </div>
                                        <span>{defect.ReportedBy}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleAction(defect.Id, 'sell')}
                                                className="text-gray-400 hover:text-primary transition-colors"
                                                title="Sold to External"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">sell</span>
                                            </button>
                                            <button
                                                onClick={() => handleAction(defect.Id, 'restore')}
                                                className="text-gray-400 hover:text-primary transition-colors"
                                                title={t.common.restore || "Mark as Undefected"}
                                            >
                                                <span className="material-symbols-outlined text-[20px]">restore_from_trash</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Infinite Scroll Sentinel */}
                    <div ref={containerRef} className="flex flex-col items-center justify-center py-8">
                        {loading && (
                            <div className="flex items-center gap-2 text-primary">
                                <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
                                <span className="text-sm font-medium">{t.inventory.loadingDefects || 'Loading defects...'}</span>
                            </div>
                        )}
                        {!hasMore && defects.length > 0 && (
                            <p className="text-text-secondary text-sm">{t.inventory.noMoreDefects || 'No more defects to load.'}</p>
                        )}
                        {!loading && defects.length === 0 && (
                            <p className="text-text-secondary text-base">{t.inventory.noDefectsFound || 'No defected items found.'}</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between mt-4 px-2">
                    <p className="text-sm text-text-secondary dark:text-gray-400">
                        {t.inventory.showingDefects?.replace('{count}', defects.length.toString()).replace('{total}', totalCount.toString()) ||
                            `Showing ${defects.length} of ${totalCount} defected items`}
                    </p>
                </div>
            </div>

            {/* Barcode Scanner Modal */}
            {isScannerOpen && (
                <BarcodeScanner
                    enabled={true}
                    onScanned={handleBarcodeScanned}
                    onClose={() => setIsScannerOpen(false)}
                    onError={(err) => {
                        console.error('Scanner error:', err);
                        alert(err.message || t.inventory.failedToAccessCamera);
                        setIsScannerOpen(false);
                    }}
                />
            )}
        </div>
    );
}
