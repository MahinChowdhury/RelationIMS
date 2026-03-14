import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { BrowserMultiFormatReader } from '@zxing/library';
import api from '../../services/api';
import { type Order, OrderInternalStatus } from '../../types';
import ProductDetails from '../products/ProductDetails';
import { useLanguage } from '../../i18n/LanguageContext';

interface ScannedItemRecord {
    sku: string;
    matched: boolean;
    timestamp: Date;
    productName: string;
    productImage?: string;
}

export default function ArrangementDetails() {
    const { t } = useLanguage();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<Order | null>(null);
    const [scannedItems, setScannedItems] = useState<ScannedItemRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [isScanning, setIsScanning] = useState(false);
    const [manualSku, setManualSku] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedRequiredItemProductId, setSelectedRequiredItemProductId] = useState<number | null>(null);

    // Scanner refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const codeReaderRef = useRef<BrowserMultiFormatReader>(new BrowserMultiFormatReader());
    const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            loadOrderDetails(Number(id));
        }
    }, [id]);

    const loadOrderDetails = async (orderId: number, isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const res = await api.get<Order>(`/Order/${orderId}`);
            let orderData = res.data;
            // Fetch product details if needed, similar to OrderDetails
            if (orderData.OrderItems && orderData.OrderItems.length > 0) {
                const itemsWithProducts = await Promise.all(orderData.OrderItems.map(async (item) => {
                    try {
                        let newItem = { ...item };
                        // Fetch Product if missing
                        if (!newItem.Product) {
                            const prodRes = await api.get(`/Product/${item.ProductId}`);
                            newItem.Product = prodRes.data;
                        }
                        // Fetch ProductVariant if missing but ID exists
                        if (item.ProductVariantId && !item.ProductVariant) {
                            const variantRes = await api.get(`/ProductVariants/${item.ProductVariantId}`); // Verify endpoint
                            newItem.ProductVariant = variantRes.data;
                        }
                        return newItem;
                    } catch (err) {
                        return item;
                    }
                }));
                orderData = { ...orderData, OrderItems: itemsWithProducts };
            }
            setOrder(orderData);

            // Fetch Arranged Items History
            try {
                const arrangedRes = await api.get<any[]>(`/Arrangement/items/${orderId}`);
                if (arrangedRes.data) {
                    const history: ScannedItemRecord[] = arrangedRes.data.map(item => ({
                        sku: item.Code,
                        matched: true,
                        timestamp: new Date(), // We don't have timestamp in basic query unless added, using now/placeholder
                        productName: item.ProductName || "Verified Item",
                        productImage: undefined
                    }));
                    setScannedItems(history.reverse()); // Show newest first
                }
            } catch (histErr) {
                console.error("Failed to load history", histErr);
            }

        } catch (err) {
            console.error('Failed to load order:', err);
        } finally {
            setLoading(false);
        }
    };

    // Scanner Logic
    const startScanning = useCallback(async () => {
        if (!videoRef.current) return;
        try {
            await codeReaderRef.current.decodeFromVideoDevice(
                null,
                videoRef.current,
                (result) => {
                    if (result) {
                        const barcode = result.getText();
                        if (barcode !== lastScannedCode) {
                            handleScan(barcode);
                            setLastScannedCode(barcode);
                            setTimeout(() => setLastScannedCode(null), 1500);
                        }
                    }
                }
            );
        } catch (err) {
            console.error('Camera error:', err);
        }
    }, [lastScannedCode]);

    const stopScanning = useCallback(() => {
        codeReaderRef.current.reset();
    }, []);

    useEffect(() => {
        if (isScanning && !loading) {
            // Small delay to ensure video element is rendered
            const timer = setTimeout(() => {
                startScanning();
            }, 500);
            return () => {
                clearTimeout(timer);
                stopScanning();
            };
        } else {
            stopScanning();
        }
    }, [isScanning, loading, startScanning, stopScanning]);

    const handleScan = async (sku: string) => {
        if (!order) return;

        try {
            // Call API to Scan and Verify
            await api.post('/Arrangement/scan', {
                OrderId: order.Id,
                Barcode: sku
            });

            // Success - Verification Passed
            const newRecord: ScannedItemRecord = {
                sku,
                matched: true,
                timestamp: new Date(),
                productName: t.inventory.verified || "Item Verified",
                productImage: undefined
            };

            setScannedItems(prev => [newRecord, ...prev]);

            // Silent Re-load order to update counts without spinner
            loadOrderDetails(order.Id, true);

        } catch (err: any) {
            console.error("Scan Failed", err);
            const msg = err.response?.data || "Scan Failed";
            // Just alert, do NOT add to scanned list
            alert(msg);
        }
    };

    const handleConfirmClick = () => {
        if (!order) return;
        setShowConfirmModal(true);
    };

    const handleFinalConfirm = async () => {
        if (!order) return;

        try {
            // Call the dedicated endpoint to confirm arrangement
            // This expects the backend to transition status to "Arranged" (2)
            await api.post(`/Arrangement/confirm/${order.Id}`);
            setShowConfirmModal(false);

            // Redirect to Order Cycle to show completion
            navigate(`/orders/${order.Id}?view=cycle`);
        } catch (err: any) {
            console.error("Confirmation Failed", err);
            alert(err.response?.data || "Failed to confirm arrangement.");
            setShowConfirmModal(false);
        }
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualSku.trim()) {
            handleScan(manualSku.trim());
            setManualSku('');
        }
    };

    if (loading || !order) {
        return (
            <div className="flex flex-col items-center justify-center py-20 min-h-screen bg-background-light dark:bg-background-dark">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary"></div>
                <p className="mt-4 text-text-secondary font-medium">{t.orders.loadingArrangement || 'Loading Arrangement Details...'}</p>
            </div>
        );
    }

    return (
        <div className="bg-background-light dark:bg-background-dark text-text-main dark:text-gray-100 font-display min-h-screen flex flex-col relative">
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
                

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-text-main dark:text-white tracking-tight flex items-center gap-3">
                            <span className="material-symbols-outlined text-4xl text-primary">fact_check</span>
                            {t.orders.orderArrangementTitle || 'Order Arrangement'}
                        </h1>
                        <p className="text-text-secondary dark:text-gray-400 text-sm md:text-base mt-2">{t.orders.orderArrangementSubtitle || 'Scan items to verify against order requirements'}</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-primary/20 text-sm font-bold text-primary">
                            <span className="material-symbols-outlined text-lg">timelapse</span>
                            {order.InternalStatus >= OrderInternalStatus.Confirmed ? (t.orders.confirmed || 'Confirmed') : (order.InternalStatus === OrderInternalStatus.Arranged ? (t.orders.arranged || 'Arranged') : (t.common.inProgress || 'In Progress'))}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-8">
                    {/* Required Items Section */}
                    <section className="flex flex-col gap-4">
                        <div className="bg-white dark:bg-[#1a2e22] rounded-xl shadow-sm border border-[#e7f3eb] dark:border-[#2a4032] overflow-hidden">
                            <div className="px-6 py-4 border-b border-[#f0f7f2] dark:border-[#2a4032] flex justify-between items-center">
                                <h3 className="text-lg font-bold text-text-main dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">playlist_add_check</span>
                                    {t.orders.requiredItems || 'Required Items'}
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-[#f8fcf9] dark:bg-white/5 text-text-secondary font-medium">
                                        <tr>
                                            <th className="px-6 py-3">{t.orders.productDetails || 'Product Details'}</th>
                                            <th className="px-6 py-3 w-32 text-center">{t.common.quantity || 'Quantity'}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#f0f7f2] dark:divide-[#2a4032]">
                                        {order.OrderItems && order.OrderItems.length > 0 ? (
                                            Object.values(order.OrderItems.reduce((groups, item) => {
                                                const key = `${item.ProductId}-${item.ProductVariant?.ProductColorId || 'NoColor'}`;
                                                if (!groups[key]) groups[key] = { items: [], product: item.Product, color: item.ProductVariant?.Color };
                                                groups[key].items.push(item);
                                                return groups;
                                            }, {} as Record<string, { items: typeof order.OrderItems, product: any, color: any }>)).map((group, groupIdx) => (
                                                <>{/* Group Header */}
                                                    <tr
                                                        key={`group-${groupIdx}`}
                                                        className="bg-gray-50/50 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-100/60 dark:hover:bg-gray-800/50 transition-colors"
                                                        onClick={() => setSelectedRequiredItemProductId(group.items[0].ProductId)}
                                                        title="Click to view product details"
                                                    >
                                                        <td colSpan={2} className="px-6 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="size-10 rounded-lg bg-white dark:bg-gray-700 bg-cover bg-center shrink-0 border border-gray-200 dark:border-gray-600 flex items-center justify-center overflow-hidden relative group/image">
                                                                    {group.product?.ImageUrls?.[0] ? (
                                                                        <>
                                                                            <img src={group.product.ImageUrls[0]} alt={group.product.Name} className="w-full h-full object-cover transition-all duration-300 group-hover/image:blur-sm transform group-hover/image:scale-110" />
                                                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 bg-black/20">
                                                                                <span className="material-symbols-outlined text-white drop-shadow-md text-lg">visibility</span>
                                                                            </div>
                                                                        </>
                                                                    ) : (
                                                                        <span className="material-symbols-outlined text-gray-400">image</span>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-sm text-text-main dark:text-white flex items-center gap-2">
                                                                        {group.product?.Name || 'Unknown Product'}
                                                                        {group.color && (
                                                                            <span className="px-2 py-0.5 rounded-full bg-white dark:bg-gray-600 text-xs border border-gray-200 dark:border-gray-500 font-normal flex items-center gap-1">
                                                                                <span className="size-2 rounded-full border border-gray-300" style={{ backgroundColor: group.color.HexCode }}></span>
                                                                                {group.color.Name}
                                                                            </span>
                                                                        )}
                                                                    </p>
                                                                    {group.product?.Category && <p className="text-xs text-text-secondary">{group.product.Category.Name}</p>}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>

                                                    {/* Size Sub-rows */}
                                                    {group.items.map((item) => (
                                                        <tr
                                                            key={item.Id}
                                                            className="hover:bg-green-50/30 dark:hover:bg-white/5 transition-colors"
                                                        >
                                                            <td className="px-6 py-3 pl-12">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="material-symbols-outlined text-sm text-gray-300 rotate-90">subdirectory_arrow_right</span>
                                                                    <span className="font-bold text-sm text-text-main dark:text-gray-300">
                                                                        {item.ProductVariant?.Size?.Name || 'One Size'}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-3 text-center">
                                                                <div className="flex flex-col items-center">
                                                                    <span className="text-lg font-bold text-text-main dark:text-white">
                                                                        {item.ArrangedQuantity || 0} / {item.Quantity}
                                                                    </span>
                                                                    <div className="w-16 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                                                                        <div
                                                                            className="h-full bg-primary transition-all duration-500"
                                                                            style={{ width: `${Math.min(100, ((item.ArrangedQuantity || 0) / item.Quantity) * 100)}%` }}
                                                                        ></div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={2} className="px-6 py-8 text-center text-text-secondary">{t.orders.noItemsFoundInOrder || 'No items found in this order.'}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>

                    {/* Scanner Section */}
                    <section className="bg-white dark:bg-[#1a2e22] rounded-xl shadow-sm border border-[#e7f3eb] dark:border-[#2a4032] p-6">
                        <div className="flex items-center gap-2 mb-6 justify-center">
                            <span className="material-symbols-outlined text-primary text-2xl">qr_code_scanner</span>
                            <h3 className="text-xl font-bold text-text-main dark:text-white">{t.orders.scanToVerify || 'Scan to Verify'}</h3>
                        </div>
                        <div className="flex justify-center">
                            <div className="w-full max-w-xl flex flex-col gap-4">
                                {/* Camera Window */}
                                <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-inner group ring-1 ring-black/10 dark:ring-white/10">
                                    {isScanning ? (
                                        <>
                                            <video
                                                ref={videoRef}
                                                className="absolute inset-0 w-full h-full object-cover opacity-90"
                                                playsInline
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/20"></div>
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div className="w-full h-0.5 bg-red-500 shadow-[0_0_20px_rgba(239,68,68,1)] animate-[pulse_1.5s_ease-in-out_infinite] absolute top-1/2 -translate-y-1/2"></div>
                                                <div className="absolute inset-0 border-2 border-white/20 m-8 rounded-lg">
                                                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary"></div>
                                                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary"></div>
                                                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary"></div>
                                                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary"></div>
                                                </div>
                                            </div>
                                            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur rounded px-2 py-1 flex items-center gap-2 border border-white/10">
                                                <div className="size-2 bg-green-500 rounded-full animate-pulse"></div>
                                                <span className="text-[10px] font-bold text-white uppercase tracking-wider">{t.orders.cameraActive || 'Camera Active'}</span>
                                            </div>
                                            <button
                                                onClick={stopScanning}
                                                className="absolute bottom-4 right-4 bg-black/60 hover:bg-red-500/80 backdrop-blur text-white px-3 py-1 rounded text-xs font-bold transition-colors pointer-events-auto"
                                            >
                                                {t.orders.stopScanning || 'Stop Scanning'}
                                            </button>
                                        </>
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white">
                                            <span className="material-symbols-outlined text-4xl mb-2 text-gray-500">videocam_off</span>
                                            <p className="text-sm text-gray-400 mb-4">{t.orders.cameraPaused || 'Camera is paused'}</p>
                                            <button
                                                onClick={() => setIsScanning(true)}
                                                className="px-6 py-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg shadow-lg transition-transform active:scale-95 flex items-center gap-2"
                                            >
                                                <span className="material-symbols-outlined">qr_code_scanner</span>
                                                {t.orders.startCamera || 'Start Camera'}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Manual Input */}
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                                        <span className="material-symbols-outlined">keyboard_alt</span>
                                    </div>
                                    <form onSubmit={handleManualSubmit}>
                                        <input
                                            autoFocus
                                            value={manualSku}
                                            onChange={(e) => setManualSku(e.target.value)}
                                            className="block w-full rounded-xl border-[#e7f3eb] dark:border-[#2a4032] bg-[#f8fcf9] dark:bg-white/5 pl-10 pr-20 py-4 text-base text-text-main dark:text-white placeholder-gray-400 focus:border-primary focus:ring-primary shadow-sm transition-all"
                                            placeholder={t.orders.enterSkuManually || "Enter SKU manually..."}
                                            type="text"
                                        />
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                            <button type="submit" className="bg-primary text-white p-2 rounded-lg hover:bg-primary-dark transition-colors shadow-lg shadow-green-200 dark:shadow-none">
                                                <span className="material-symbols-outlined text-lg">arrow_forward</span>
                                            </button>
                                        </div>
                                    </form>
                                </div>
                                <p className="text-xs text-center text-text-secondary">
                                    {t.orders.scanInstructions || 'Ensure barcode is within the frame or type the SKU code directly.'}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Scanned Items History Section */}
                    <section className="flex flex-col gap-4">
                        <div className="bg-white dark:bg-[#1a2e22] rounded-xl shadow-sm border border-[#e7f3eb] dark:border-[#2a4032] overflow-hidden">
                            <div className="px-6 py-4 border-b border-[#f0f7f2] dark:border-[#2a4032] flex justify-between items-center">
                                <h3 className="text-lg font-bold text-text-main dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">history</span>
                                    {t.orders.scannedItems || 'Scanned Items'}
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-[#f8fcf9] dark:bg-white/5 text-text-secondary font-medium">
                                        <tr>
                                            <th className="px-6 py-3">{t.orders.productDetails || 'Product Details'}</th>
                                            <th className="px-6 py-3">SKU</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#f0f7f2] dark:divide-[#2a4032]">
                                        {scannedItems.length === 0 ? (
                                            <tr><td colSpan={2} className="p-4 text-center text-text-secondary">{t.orders.noItemsScanned || 'No items scanned yet.'}</td></tr>
                                        ) : (
                                            scannedItems.map((scan, idx) => (
                                                <tr key={idx} className={scan.matched ? "bg-green-50/40 dark:bg-green-900/10" : "bg-red-50/40 dark:bg-red-900/10"}>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${scan.matched ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" : "bg-red-100 dark:bg-red-900/20 text-red-500"}`}>
                                                                <span className="material-symbols-outlined text-sm">{scan.matched ? 'check' : 'close'}</span>
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-text-main dark:text-white">{scan.productName}</p>
                                                                <p className={`text-xs ${scan.matched ? "text-text-secondary" : "text-red-500"}`}>
                                                                    {scan.matched ? `${t.orders.matchedAt || 'Matched at'} ${scan.timestamp.toLocaleTimeString()}` : `${t.orders.errorAt || 'Error at'} ${scan.timestamp.toLocaleTimeString()}`}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className={`px-6 py-4 font-mono ${scan.matched ? "text-text-secondary" : "text-red-500"}`}>
                                                        {scan.sku}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>

                    <div className="mt-4">
                        <button
                            onClick={handleConfirmClick}
                            className={`w-full font-bold text-sm md:text-lg py-2 md:py-5 rounded-lg md:rounded-2xl shadow-md md:shadow-xl transition-all transform md:hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 md:gap-3
                                ${order.InternalStatus >= OrderInternalStatus.Confirmed
                                    ? 'bg-gray-400 cursor-not-allowed text-gray-200 shadow-none'
                                    : 'bg-primary md:hover:bg-primary-dark text-white shadow-green-400/20 dark:shadow-green-900/30'}`
                            }
                            disabled={order.InternalStatus >= OrderInternalStatus.Arranged}
                        >
                            <span className="material-symbols-outlined text-lg md:text-2xl">check_circle</span>
                            {order.InternalStatus >= OrderInternalStatus.Arranged ? (t.orders.arrangementCompleted || 'Arrangement Completed') : (t.orders.confirmArrangement || 'Confirm Arrangement')}
                        </button>
                    </div>
                </div>
            </main>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-[100] flex items-start md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1a2e22] rounded-2xl shadow-2xl max-w-md w-full p-6 border border-[#e7f3eb] dark:border-[#2a4032] transform scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-4xl text-primary">fact_check</span>
                            </div>
                            <h3 className="text-xl font-bold text-text-main dark:text-white mb-2">{t.orders.completeArrangementPrompt || 'Complete Arrangement?'}</h3>
                            <p className="text-text-secondary dark:text-gray-400 text-sm leading-relaxed">
                                {(t.orders.completeArrangementConfirm || 'Are you sure all items have been verified and arranged? This will mark the order as {status} and proceed to final confirmation.').replace('{status}', t.orders.arranged || 'Arranged')}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 text-text-main dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleFinalConfirm}
                                className="flex-1 px-4 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors shadow-lg shadow-green-200/50 dark:shadow-none"
                            >
                                Yes, Complete
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Product Details Modal (80% Screen) */}
            {selectedRequiredItemProductId && (
                <div className="fixed inset-0 z-[60] flex items-start md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1a2e22] w-[90%] h-[90%] md:w-[80%] md:h-[80%] rounded-2xl shadow-2xl overflow-hidden relative border border-[#e7f3eb] dark:border-[#2a4032] flex flex-col">
                        <div className="absolute top-4 right-4 z-10">
                            <button
                                onClick={() => setSelectedRequiredItemProductId(null)}
                                className="p-2 bg-white/80 dark:bg-black/50 backdrop-blur rounded-full text-gray-500 hover:text-white hover:bg-red-500 transition-all shadow-lg border border-gray-100 dark:border-gray-700"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="overflow-y-auto h-full custom-scrollbar">
                            <ProductDetails productId={selectedRequiredItemProductId.toString()} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
