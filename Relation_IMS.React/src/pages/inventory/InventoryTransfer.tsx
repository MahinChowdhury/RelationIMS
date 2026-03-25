
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import type { InventoryBasicDTO, TransferProductItemsDTO, ScannedItem } from '../../types';
import InventoryTransferScanner from '../../components/inventory/InventoryTransferScanner';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuth } from '../../context/AuthContext';



const InventoryTransfer = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    // const navigate = useNavigate();
    const [inventories, setInventories] = useState<InventoryBasicDTO[]>([]);
    const [sourceId, setSourceId] = useState<number | ''>('');
    const [destinationId, setDestinationId] = useState<number | ''>('');
    const [sourceItems, setSourceItems] = useState<any[]>([]); // Store items for validation
    const [isSourceLoading, setIsSourceLoading] = useState(false);
    const [scanInput, setScanInput] = useState('');
    const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [transferring, setTransferring] = useState(false);
    const [notes, setNotes] = useState('');
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const scanInputRef = useRef<HTMLInputElement>(null);

    // Mock recent transfers for UI completeness as API doesn't exist yet for history
    const recentTransfers = [
        { date: 'Oct 24, 11:20 AM', reference: '#TR-8821', route: 'Main Warehouse to Downtown Store', items: '45 units', status: 'Completed', user: 'Mike R.' },
        { date: 'Oct 23, 03:45 PM', reference: '#TR-8820', route: 'North Dist. Ctr to Westside Outlet', items: '120 units', status: 'In Transit', user: 'Sarah L.' },
    ];

    useEffect(() => {
        const fetchInventories = async () => {
            setLoading(true);
            try {
                console.log('Fetching inventories from API...');
                const response = await api.get('/Inventory');
                console.log('Inventories fetched successfully:', response.data);
                setInventories(response.data);
            } catch (error) {
                console.error("Failed to fetch inventories:", error);
                // @ts-ignore
                if (error.code === "ERR_NETWORK") {
                    console.error("Network Error: Backend likely down or CORS issue.");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchInventories();
    }, []);

    // Validation: Fetch source items when sourceId changes
    useEffect(() => {
        if (!sourceId) {
            setSourceItems([]);
            return;
        }
        const fetchSourceItems = async () => {
            setIsSourceLoading(true);
            try {
                const res = await api.get(`/Inventory/${sourceId}/items`);
                setSourceItems(res.data || []);
            } catch (err) {
                console.error("Failed to load source items for validation", err);
                // Fallback: we might allow scanning but warn? For now let's strict validate against what we can fetch.
            } finally {
                setIsSourceLoading(false);
            }
        };
        fetchSourceItems();
    }, [sourceId]);

    const validateBarcode = (code: string): boolean => {
        if (!sourceId) {
            alert(t.inventory.selectSourceFirst);
            setIsScannerOpen(false);
            return false;
        }
        // Strict validation: Code must exist in source inventory items
        // The API returns list of objects. We need to check if ANY item has this code.
        // Based on `GetInventoryItems`, it returns list of objects. Assuming these have `Code` or `ProductItemCode`
        // Let's assume the shape matches ProductItem logic
        const exists = sourceItems.some((item: any) => item.Code === code || item.ProductItemCode === code);

        if (!exists) {
            alert(t.inventory.itemNotFoundInSource.replace('{code}', code));
            return false;
        }
        return true;
    };

    const handleScan = (e: React.FormEvent) => {
        e.preventDefault();
        if (!scanInput.trim()) return;

        const code = scanInput.trim();

        if (!validateBarcode(code)) {
            setScanInput(''); // Clear input if invalid
            return;
        }

        // Check if item already scanned
        const existingItemIndex = scannedItems.findIndex(item => item.code === code);

        if (existingItemIndex >= 0) {
            const updatedItems = [...scannedItems];
            updatedItems[existingItemIndex].count += 1;
            updatedItems[existingItemIndex].scannedAt = new Date();
            setScannedItems(updatedItems);
        } else {
            setScannedItems(prev => [{
                id: Date.now().toString(),
                code: code,
                description: 'Product ' + code, // detailed info would need another fetch or store lookup
                count: 1,
                scannedAt: new Date()
            }, ...prev]);
        }

        setScanInput('');
        // Keep focus for continuous scanning
        scanInputRef.current?.focus();
    };

    const handleBarcodeScanned = (code: string) => {
        if (!code) return;

        // Validation handled by scanner callback prop 'onValidate' before calling this, 
        // OR we can double check here.
        // We will assume onScanned is only called for valid items if onValidate is passed.

        // Find product details from sourceItems if possible
        const sourceItem = sourceItems.find((i: any) => i.Code === code || i.ProductItemCode === code);
        const description = sourceItem
            ? `${sourceItem.ProductName || 'Unknown Product'} - ${sourceItem.ColorName || sourceItem.Color} / ${sourceItem.SizeName || sourceItem.Size}`
            : 'Product ' + code;


        // Check if item already scanned
        const existingItemIndex = scannedItems.findIndex(item => item.code === code);

        if (existingItemIndex >= 0) {
            const updatedItems = [...scannedItems];
            updatedItems[existingItemIndex].count += 1;
            updatedItems[existingItemIndex].scannedAt = new Date();
            setScannedItems(updatedItems);
        } else {
            setScannedItems(prev => [{
                id: Date.now().toString(),
                code: code,
                description: description,
                imageUrl: sourceItem?.ProductImageUrl,
                count: 1,
                scannedAt: new Date(),
                isValid: true
            }, ...prev]);
        }
    };

    const handleRemoveItem = (code: string) => {
        setScannedItems(prev => prev.filter(item => item.code !== code));
    };

    const handleConfirmTransfer = async () => {
        if (!sourceId || !destinationId || scannedItems.length === 0) return;

        setTransferring(true);
        try {
            // Flatten all scanned items into a single list of codes
            // If item A has count 3, we add "A" to the list 3 times.
            const codesToTransfer: string[] = [];
            scannedItems.forEach(item => {
                for (let i = 0; i < item.count; i++) {
                    codesToTransfer.push(item.code);
                }
            });

            const payload: TransferProductItemsDTO = {
                ProductItemCode: codesToTransfer, // Send as List<string> to match backend DTO
                SourceInventoryId: Number(sourceId),
                DestinationInventoryId: Number(destinationId),
                UserId: user?.Id || 0
            };

            const response = await api.post('/Inventory/transfer', payload);

            if (response.status === 200) {
                alert(t.inventory.transferCompleted + ' ' + (response.data.message || ''));
                setScannedItems([]);
                setNotes('');
            }
        } catch (error: any) {
            console.error(error);
            alert(t.inventory.transferFailed + ' ' + (error.response?.data?.message || error.message));
        } finally {
            setTransferring(false);
        }
    };

    const totalUnits = scannedItems.reduce((acc, item) => acc + item.count, 0);

    return (
        <div className="container mx-auto max-w-7xl px-4 py-4 md:px-8 md:py-8 flex flex-col gap-6">
            
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl md:text-3xl font-extrabold text-text-main dark:text-white tracking-tight">{t.inventory.transfer || 'Transfer Stock'}</h1>
                <p className="text-text-secondary dark:text-gray-400 text-sm max-w-2xl">
                    {t.inventory.transferSubtitle || 'Move stock between warehouses or store locations efficiently.'}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Controls */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    {/* Transfer Route */}
                    <div className="bg-white dark:bg-[var(--color-surface-dark-card)] rounded-xl shadow-sm border border-gray-100 dark:border-[var(--color-surface-dark-border)] p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-primary">alt_route</span>
                            <h3 className="font-bold text-text-main dark:text-white">{t.inventory.transferRoute || 'Transfer Route'}</h3>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-1.5">{t.inventory.sourceInventory || 'Source Inventory'}</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[20px]">warehouse</span>
                                    <select
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[var(--color-surface-dark-solid)] border border-gray-200 dark:border-[var(--color-surface-dark-border)] rounded-lg text-sm text-text-main dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none disabled:opacity-50"
                                        value={sourceId}
                                        onChange={(e) => setSourceId(Number(e.target.value))}
                                        disabled={loading || isSourceLoading}
                                    >
                                        <option value="">{loading ? (t.common.loading || 'Loading...') : (t.inventory.selectSource || 'Select Source...')}</option>
                                        {inventories.map(inv => (
                                            <option key={inv.Id} value={inv.Id}>{inv.Name}</option>
                                        ))}
                                    </select>
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[20px] pointer-events-none">expand_more</span>
                                </div>
                            </div>

                            <div className="flex justify-center -my-2 z-10">
                                <div className="bg-gray-100 dark:bg-[#2a4032] p-1.5 rounded-full text-gray-500 dark:text-gray-400">
                                    <span className="material-symbols-outlined text-[20px] block">arrow_downward</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-1.5">{t.inventory.destinationInventory || 'Destination Inventory'}</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[20px]">store</span>
                                    <select
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[var(--color-surface-dark-solid)] border border-gray-200 dark:border-[var(--color-surface-dark-border)] rounded-lg text-sm text-text-main dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
                                        value={destinationId}
                                        onChange={(e) => setDestinationId(Number(e.target.value))}
                                    >
                                        <option value="">{t.inventory.selectDestination || 'Select Destination...'}</option>
                                        {inventories.filter(i => i.Id !== sourceId).map(inv => (
                                            <option key={inv.Id} value={inv.Id}>{inv.Name}</option>
                                        ))}
                                    </select>
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[20px] pointer-events-none">expand_more</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scan Items */}
                    <div className="bg-white dark:bg-[var(--color-surface-dark-card)] rounded-xl shadow-sm border border-gray-100 dark:border-[var(--color-surface-dark-border)] p-5">
                        <div className="mb-4">
                            <h3 className="font-bold text-text-main dark:text-white mb-1">{t.inventory.scanItems || 'Scan Items'}</h3>
                        </div>

                        <form onSubmit={handleScan} className="relative">
                            <button
                                type="button"
                                onClick={() => setIsScannerOpen(true)}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                            >
                                <span className="material-symbols-outlined text-[24px]">qr_code_scanner</span>
                            </button>
                            <input
                                ref={scanInputRef}
                                type="text"
                                placeholder={t.inventory.scanToIncrement || "Scan barcode to increment..."}
                                className="w-full pl-11 pr-12 py-3 bg-gray-50 dark:bg-[var(--color-surface-dark-solid)] border border-gray-200 dark:border-[var(--color-surface-dark-border)] rounded-lg text-text-main dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                value={scanInput}
                                onChange={(e) => setScanInput(e.target.value)}
                                autoFocus
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors shadow-sm"
                            >
                                <span className="material-symbols-outlined text-[20px] block">arrow_forward</span>
                            </button>
                        </form>
                        <p className="mt-2 text-xs text-text-secondary dark:text-gray-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">info</span>
                            {t.inventory.scanRepeatedly || 'Scan product barcode repeatedly to increase quantity.'}
                        </p>

                        {/* Last Scanned Feedback */}
                        {scannedItems.length > 0 && (
                            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                <div className="bg-white dark:bg-[var(--color-surface-dark-solid)] rounded-full p-1 shadow-sm text-green-600">
                                    <span className="material-symbols-outlined text-[20px] block">check</span>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider mb-0.5">{t.inventory.lastScanned || 'Last Scanned'}</p>
                                    <p className="text-sm font-medium text-text-main dark:text-white">{scannedItems[0].description}</p>
                                    <p className="text-xs text-text-secondary dark:text-gray-400 mt-0.5">{t.common.code || 'Code'}: {scannedItems[0].code} â€¢ {t.common.quantity || 'Count'}: {scannedItems[0].count}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column - Manifest */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="bg-white dark:bg-[var(--color-surface-dark-card)] rounded-xl shadow-sm border border-gray-100 dark:border-[var(--color-surface-dark-border)] p-5 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">shopping_cart_checkout</span>
                                <h3 className="font-bold text-text-main dark:text-white">{t.inventory.transferManifest || 'Transfer Manifest'}</h3>
                            </div>
                            <span className="px-2.5 py-1 bg-gray-100 dark:bg-[var(--color-surface-dark-solid)] text-text-secondary dark:text-gray-400 text-xs font-bold rounded-full">
                                {scannedItems.length} {t.common.items || 'Items'}
                            </span>
                        </div>

                        {/* Scanned List */}
                        <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[500px] space-y-3 pr-2 custom-scrollbar">
                            {scannedItems.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-text-secondary dark:text-gray-500 opacity-60">
                                    <span className="material-symbols-outlined text-6xl mb-2">qr_code_2</span>
                                    <p>{t.inventory.noItemsScanned || 'No items scanned yet.'}</p>
                                </div>
                            ) : (
                                scannedItems.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[var(--color-surface-dark-solid)] rounded-xl border border-gray-100 dark:border-[var(--color-surface-dark-border)] group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gray-200 dark:bg-[#2a4032] rounded-lg flex items-center justify-center text-gray-400 overflow-hidden">
                                                {/* Placeholder Image */}
                                                {item.imageUrl ? (
                                                    <img src={item.imageUrl} alt={item.description} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="material-symbols-outlined">image</span>
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-text-main dark:text-white text-sm">{item.description}</h4>
                                                <p className="text-xs text-text-secondary dark:text-gray-400 mt-0.5">{t.common.code || 'Code'}: {item.code}</p>
                                                <p className="text-xs text-text-secondary dark:text-gray-400 mt-0.5">{t.inventory.availableAtSource || 'Available at Source'}: -</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-text-secondary dark:text-gray-500 uppercase tracking-wider mb-0.5">{t.inventory.scanned || 'Scanned'}</p>
                                                <p className="text-2xl font-bold text-text-main dark:text-white leading-none">{item.count}</p>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveItem(item.code)}
                                                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer Notes & Action */}
                        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-[var(--color-surface-dark-border)]">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-1.5">{t.inventory.notesOptional || 'Notes (Optional)'}</label>
                                <textarea
                                    className="w-full p-3 bg-gray-50 dark:bg-[var(--color-surface-dark-solid)] border border-gray-200 dark:border-[var(--color-surface-dark-border)] rounded-lg text-sm text-text-main dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none h-20"
                                    placeholder={t.inventory.transferNotesPlaceholder || "Driver name, tracking number, or special instructions..."}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                ></textarea>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-sm text-text-secondary dark:text-gray-400">{t.common.total || 'Total'} {t.common.units || 'Units'}:</span>
                                    <span className="text-2xl font-bold text-text-main dark:text-white">{totalUnits}</span>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        className="px-6 py-2.5 text-sm font-bold text-text-secondary dark:text-gray-300 hover:text-text-main dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2a4032] rounded-lg transition-colors"
                                        onClick={() => {
                                            setScannedItems([]);
                                            setNotes('');
                                        }}
                                        disabled={transferring}
                                    >
                                        {t.common.cancel || 'Cancel'}
                                    </button>
                                    <button
                                        className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary-dark rounded-lg shadow-lg shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={handleConfirmTransfer}
                                        disabled={transferring || totalUnits === 0 || !sourceId || !destinationId}
                                    >
                                        {transferring ? (
                                            <>
                                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                                {t.inventory.processing || 'Processing...'}
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-[20px]">send</span>
                                                {t.inventory.confirmTransfer || 'Confirm Transfer'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Transfers Table */}
            <div className="mt-4">
                <h3 className="text-lg font-bold text-text-main dark:text-white mb-4">{t.inventory.recentTransfers || 'Recent Transfers'}</h3>
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[var(--color-surface-dark-border)] shadow-sm bg-white dark:bg-[var(--color-surface-dark-card)]">
                    <table className="w-full text-sm text-left text-text-main dark:text-gray-300">
                        <thead className="text-xs text-text-secondary uppercase bg-gray-50 dark:bg-[var(--color-surface-dark-solid)] dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-4 font-bold">{t.common.date || 'Date'}</th>
                                <th scope="col" className="px-6 py-4 font-bold">{t.common.reference || 'Reference'}</th>
                                <th scope="col" className="px-6 py-4 font-bold">{t.inventory.route || 'Route'}</th>
                                <th scope="col" className="px-6 py-4 font-bold">{t.common.items || 'Items'}</th>
                                <th scope="col" className="px-6 py-4 font-bold">{t.common.status || 'Status'}</th>
                                <th scope="col" className="px-6 py-4 font-bold">{t.common.user || 'User'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-[#2a4032]">
                            {recentTransfers.map((transfer, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">{transfer.date}</td>
                                    <td className="px-6 py-4 font-medium">{transfer.reference}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col text-xs">
                                            <span className="font-bold">{transfer.route.split(' to ')[0]}</span>
                                            <span className="text-text-secondary dark:text-gray-500">to {transfer.route.split(' to ')[1]}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{transfer.items}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${transfer.status === 'Completed'
                                            ? 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400'
                                            : 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-400'
                                            }`}>
                                            {transfer.status === 'Completed' ? (t.common.completed || 'Completed') : (t.inventory.inTransit || 'In Transit')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 flex items-center gap-2">
                                        <div className="size-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                            {transfer.user.charAt(0)}
                                        </div>
                                        <span>{transfer.user}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Barcode Scanner Modal */}
            {isScannerOpen && (
                <InventoryTransferScanner
                    enabled={true}
                    scannedItems={scannedItems}
                    onScanned={handleBarcodeScanned}
                    onClose={() => setIsScannerOpen(false)}
                    onValidate={validateBarcode}
                    onError={(error) => console.error("Scanner error:", error)}
                />
            )}
        </div>
    );
};

export default InventoryTransfer;
