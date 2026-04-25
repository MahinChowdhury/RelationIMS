
import { useState, useEffect } from 'react';

import api from '../../services/api';
import BarcodeScanner from '../../components/BarcodeScanner';
import { useLanguage } from '../../i18n/LanguageContext';

interface Inventory {
    Id: number;
    Name: string;
}

interface Customer {
    Id: number;
    Name: string;
    Phone: string;
}

interface ScannedItem {
    id: string; // unique scan id
    code: string;
    productName: string;
    variantInfo: string;
    price: number;
    isValidOrderReturn: boolean;
}

interface ReturnRecord {
    Id: number;
    ReturnDate: string;
    CustomerName: string;
    ItemsCount: number;
    RefundAmount: number;
    ProcessedBy: string;
}

export default function CustomerReturn() {
    const { t } = useLanguage();
    const taka = '\u09F3';
    // State
    const [inventories, setInventories] = useState<Inventory[]>([]);
    const [selectedInventoryId, setSelectedInventoryId] = useState<number | ''>('');
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customerSearch, setCustomerSearch] = useState('');
    const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
    const [productCodeInput, setProductCodeInput] = useState('');
    const [refundAmount, setRefundAmount] = useState<string>('0');
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    // History State
    const [history, setHistory] = useState<ReturnRecord[]>([]);

    // UI State
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Order Tracking State
    const [orderId, setOrderId] = useState('');
    const [orderData, setOrderData] = useState<any | null>(null);
    const [loadingOrder, setLoadingOrder] = useState(false);

    // Fetch Inventories & Customers (Initial)
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const res = await api.get('/Inventory');
                setInventories(res.data);
                if (res.data.length > 0) setSelectedInventoryId(res.data[0].Id);
            } catch (err) { console.error(err); }

            fetchHistory();
        };
        fetchInitialData();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await api.get('/Inventory/customer-return/history');
            setHistory(res.data);
        } catch (err) {
            console.error('Failed to load history:', err);
        }
    };

    // Load Order Handler
    const handleLoadOrder = async () => {
        if (!orderId) return;
        setLoadingOrder(true);
        setOrderData(null);
        setErrorMsg('');

        try {
            const res = await api.get(`/Order/${orderId}`);
            setOrderData(res.data);

            // Auto-select customer if not selected
            if (res.data.Customer && !selectedCustomer) {
                setSelectedCustomer(res.data.Customer);
            } else if (selectedCustomer && res.data.CustomerId !== selectedCustomer.Id) {
                // Warn mismatched customer?
                setErrorMsg(`Warning: Order belongs to ${res.data.Customer?.Name}, but you selected ${selectedCustomer.Name}.`);
            }

        } catch (err) {
            console.error(err);
            setErrorMsg(t.orders.orderNotFound || 'Order not found.');
        } finally {
            setLoadingOrder(false);
        }
    };

    // Auto-load order when Order ID changes
    useEffect(() => {
        if (orderId && orderId.trim() !== '') {
            handleLoadOrder();
        } else {
            setOrderData(null);
        }
    }, [orderId]);

    // Search Customers
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (customerSearch.trim().length > 1 && !selectedCustomer) {
                try {
                    const res = await api.get(`/Customer?search=${customerSearch}`); // Assuming API supports search
                    setCustomers(res.data.items || res.data); // Handle potential paginated response
                    setShowCustomerDropdown(true);
                } catch (err) {
                    console.error(err);
                }
            } else {
                setCustomers([]);
                setShowCustomerDropdown(false);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [customerSearch, selectedCustomer]);


    // Calculate Refund Amount automatically
    useEffect(() => {
        const total = scannedItems.reduce((sum, item) => sum + item.price, 0);
        setRefundAmount(total.toFixed(2));
    }, [scannedItems]);

    const handleAddProduct = async (codeOverride?: string) => {
        const rawCode = codeOverride || productCodeInput;
        if (!rawCode || !rawCode.trim()) return;
        const code = rawCode.trim();

        if (scannedItems.some(i => i.code === code)) {
            alert(t.inventory.codeAlreadyInList);
            return;
        }

        setProcessing(true); // Reuse processing state for spinner or add local loading state
        try {
            // 1. Fetch Item Details
            const itemRes = await api.get(`/ProductItem/code/${code}`);
            const item = itemRes.data;

            if (!item || !item.Code) throw new Error("Invalid item data received");

            let itemPrice = 0;
            let isValidOrderReturn = true;

            // 2. Validate against Order (if loaded)
            if (orderData) {
                // Try to find exact match on Variant
                const orderItem = orderData.OrderItems.find((oi: any) => oi.ProductVariantId === item.ProductVariantId);

                if (orderItem) {
                    // Use UnitPrice directly (it already reflects the sold price)
                    itemPrice = orderItem.UnitPrice;
                } else {
                    // Try Generic Product Match
                    const genericMatch = orderData.OrderItems.find((oi: any) => oi.ProductId === item.ProductId);
                    if (genericMatch) {
                        itemPrice = genericMatch.UnitPrice;
                    } else {
                        // NOT IN ORDER
                        isValidOrderReturn = false;
                        const confirmAdd = window.confirm(
                            (t.inventory.itemNotPartOfOrder || "WARNING: Item {code} ({name}) is NOT part of Order #{orderId}. \n\nDo you want to add it anyway? (Price will be 0)")
                                .replace('{code}', code)
                                .replace('{name}', item.ProductVariant?.Product?.Name || '')
                                .replace('{orderId}', orderId)
                        );
                        if (!confirmAdd) {
                            setProcessing(false);
                            return;
                        }
                        // User insisted to add, but it didn't come from this order so price relies on fallback or just 0?
                        itemPrice = item.VariantPrice || item.BasePrice || 0;
                    }
                }
            } else {
                // No Order Mode: Use Validation or Standard Price
                itemPrice = item.VariantPrice || item.BasePrice || 0;
            }

            const newItem: ScannedItem = {
                id: crypto.randomUUID(),
                code: item.Code, // Use confirmed code from API
                productName: item.ProductName || 'Unknown Product',
                variantInfo: `${item.ColorName || ''} ${item.SizeName || ''}`.trim(),
                price: itemPrice,
                isValidOrderReturn
            };

            setScannedItems(prev => [...prev, newItem]);
            setProductCodeInput('');

        } catch (err: any) {
            console.error("Failed to fetch item", err);
            // Verify failure logic
            if (err.response && err.response.status === 404) {
                alert(t.inventory.productNotFoundInSystem.replace('{code}', code));
            } else {
                const confirmAdd = window.confirm((t.inventory.failedToVerifyItem || "Failed to verify item {code}. Add manual entry?").replace('{code}', code));
                if (confirmAdd) {
                    setScannedItems(prev => [...prev, {
                        id: crypto.randomUUID(),
                        code: code,
                        productName: 'Manual Entry',
                        variantInfo: '-',
                        price: 0,
                        isValidOrderReturn: false
                    }]);
                    setProductCodeInput('');
                }
            }
        } finally {
            setProcessing(false);
        }
    };

    const removeScannedItem = (id: string) => {
        setScannedItems(prev => prev.filter(i => i.id !== id));
        // Note: Removing item does not auto-subtract price because we don't track which item added how much. 
        // User has to adjust manually if they remove. (Simplification for now)
    };

    const handleProcessReturn = async () => {
        if (!selectedCustomer || !selectedInventoryId || scannedItems.length === 0) return;

        setProcessing(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            await api.post('/Inventory/customer-return', {
                ProductCodes: scannedItems.map(i => i.code),
                TargetInventoryId: selectedInventoryId,
                CustomerId: selectedCustomer.Id,
                RefundAmount: parseFloat(refundAmount) || 0,
                OrderId: orderData ? orderData.Id : undefined
            });

            setSuccessMsg(t.inventory.returnProcessedSuccess || 'Return processed successfully! Customer balance updated.');
            setScannedItems([]);
            setRefundAmount('0');
            // Keep customer selected or clear? Maybe clear for next customer
            // setSelectedCustomer(null);
            // setCustomerSearch('');
            setOrderId('');
            setOrderData(null);

            fetchHistory(); // Reload history

        } catch (error: any) {
            console.error(error);
            setErrorMsg(error.response?.data?.message || t.inventory.failedToProcessReturn || 'Failed to process return.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="container mx-auto max-w-5xl px-4 py-4 md:px-8 md:py-8 flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-extrabold text-text-main dark:text-white">{t.inventory.customerReturn || 'Customer Return'}</h1>
                <p className="text-text-secondary dark:text-gray-400">{t.inventory.customerReturnSubtitle || 'Batch return items to inventory and refund to customer balance.'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: Settings & Input */}
                <div className="md:col-span-1 flex flex-col gap-6">

                    {/* Order Selection (Optional) */}
                    <div className="bg-white dark:bg-[var(--color-surface-dark-card)] p-4 rounded-xl border border-gray-100 dark:border-[var(--color-surface-dark-border)] shadow-sm">
                        <label className="block text-sm font-bold text-text-main dark:text-white mb-2">
                            {t.orders.orderId || 'Order ID'} <span className="text-secondary font-normal">({t.orders.optional || 'Optional'})</span>
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={orderId}
                                onChange={(e) => setOrderId(e.target.value)}
                                placeholder={t.orders.orderPlaceholder || "Order #"}
                                className="flex-1 bg-gray-50 dark:bg-[var(--color-surface-dark-solid)] border border-gray-300 dark:border-[var(--color-surface-dark-border)] rounded-lg p-2.5 text-sm dark:text-white font-mono"
                                onKeyDown={(e) => e.key === 'Enter' && handleLoadOrder()}
                            />
                            <button
                                onClick={handleLoadOrder}
                                disabled={loadingOrder || !orderId}
                                className="p-2.5 bg-secondary/10 text-secondary hover:bg-secondary/20 rounded-lg transition disabled:opacity-50"
                            >
                                {loadingOrder ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : <span className="material-symbols-outlined">check</span>}
                            </button>
                        </div>
                        {orderData && (
                            <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded text-xs flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">verified</span>
                                <b>{t.inventory.orderLoaded.replace('{id}', orderData.Id) || `Order #${orderData.Id} Loaded`}</b>
                            </div>
                        )}
                    </div>
                    {/* Inventory Selection */}
                    <div className="bg-white dark:bg-[var(--color-surface-dark-card)] p-4 rounded-xl border border-gray-100 dark:border-[var(--color-surface-dark-border)] shadow-sm">
                        <label className="block text-sm font-bold text-text-main dark:text-white mb-2">{t.inventory.targetInventory || 'Target Inventory'}</label>
                        <select
                            value={selectedInventoryId}
                            onChange={(e) => setSelectedInventoryId(Number(e.target.value))}
                            className="w-full bg-gray-50 dark:bg-[var(--color-surface-dark-solid)] border border-gray-300 dark:border-[var(--color-surface-dark-border)] rounded-lg p-2.5 text-sm dark:text-white"
                        >
                            {inventories.map(i => <option key={i.Id} value={i.Id}>{i.Name}</option>)}
                        </select>
                    </div>

                    {/* Customer Selection */}
                    <div className="bg-white dark:bg-[var(--color-surface-dark-card)] p-4 rounded-xl border border-gray-100 dark:border-[var(--color-surface-dark-border)] shadow-sm relative">
                        <label className="block text-sm font-bold text-text-main dark:text-white mb-2">{t.common.customer || 'Customer'}</label>
                        {selectedCustomer ? (
                            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                                <div>
                                    <p className="font-bold text-blue-900 dark:text-blue-300">{selectedCustomer.Name}</p>
                                    <p className="text-xs text-blue-700 dark:text-blue-400">{selectedCustomer.Phone}</p>
                                </div>
                                <button onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); }} className="text-blue-500 hover:text-blue-700">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                        ) : (
                            <div className="relative">
                                <input
                                    type="text"
                                    value={customerSearch}
                                    onChange={(e) => setCustomerSearch(e.target.value)}
                                    placeholder={t.inventory.searchCustomer || "Search customer..."}
                                    className="w-full bg-gray-50 dark:bg-[var(--color-surface-dark-solid)] border border-gray-300 dark:border-[var(--color-surface-dark-border)] rounded-lg p-2.5 text-sm dark:text-white"
                                />
                                {showCustomerDropdown && customers.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[var(--color-surface-dark-card)] border border-gray-200 dark:border-[var(--color-surface-dark-border)] rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                                        {customers.map(c => (
                                            <button
                                                key={c.Id}
                                                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-white/5 text-sm text-text-main dark:text-gray-300"
                                                onClick={() => {
                                                    setSelectedCustomer(c);
                                                    setCustomerSearch(c.Name);
                                                    setShowCustomerDropdown(false);
                                                }}
                                            >
                                                <div className="font-bold">{c.Name}</div>
                                                <div className="text-xs text-secondary">{c.Phone}</div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Scan Item Input */}
                    <div className="bg-white dark:bg-[var(--color-surface-dark-card)] p-4 rounded-xl border border-gray-100 dark:border-[var(--color-surface-dark-border)] shadow-sm">
                        <label className="block text-sm font-bold text-text-main dark:text-white mb-2">{t.inventory.scanItem || 'Scan Item'}</label>
                        <div className="flex gap-2">
                            <input
                                autoFocus
                                type="text"
                                value={productCodeInput}
                                onChange={(e) => setProductCodeInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddProduct()}
                                placeholder={t.inventory.enterProductCode || "Enter Product Code"}
                                className="flex-1 bg-gray-50 dark:bg-[var(--color-surface-dark-solid)] border border-gray-300 dark:border-[var(--color-surface-dark-border)] rounded-lg p-2.5 text-sm dark:text-white"
                            />
                            <button
                                onClick={() => setIsScannerOpen(true)}
                                className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                            >
                                <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">qr_code_scanner</span>
                            </button>
                        </div>
                        <button
                            onClick={() => handleAddProduct()}
                            disabled={!productCodeInput.trim()}
                            className="mt-2 w-full py-2 bg-secondary/10 text-secondary font-bold text-sm rounded-lg hover:bg-secondary/20 transition disabled:opacity-50"
                        >
                            {t.inventory.addToList || 'Add to List'}
                        </button>
                    </div>
                </div>

                {/* Right Column: List & Action */}
                <div className="md:col-span-2 flex flex-col h-full bg-white dark:bg-[var(--color-surface-dark-card)] rounded-xl border border-gray-100 dark:border-[var(--color-surface-dark-border)] shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-[var(--color-surface-dark-border)] flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                        <h3 className="font-bold text-lg text-text-main dark:text-white">{t.inventory.itemsToReturn || 'Items to Return'} ({scannedItems.length})</h3>
                        {scannedItems.length > 0 && (
                            <button onClick={() => setScannedItems([])} className="text-xs text-red-500 hover:text-red-700 font-medium">{t.common.clearAll || 'Clear All'}</button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 min-h-[300px]">
                        {scannedItems.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                                <span className="material-symbols-outlined text-4xl">shopping_bag</span>
                                <p>{t.orders.noItemsAdded || 'No items added yet.'}</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {scannedItems.map((item, idx) => (
                                    <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg border animate-in slide-in-from-left-2 fade-in duration-300 ${item.isValidOrderReturn ? 'bg-gray-50 dark:bg-[var(--color-surface-dark-solid)] border-gray-100 dark:border-[var(--color-surface-dark-border)]' : 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-700/30'}`}>
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center justify-center size-6 bg-gray-200 dark:bg-gray-700 rounded-full text-xs font-bold text-gray-600 dark:text-gray-300">{idx + 1}</span>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-sm font-bold text-text-main dark:text-white">{item.code}</span>
                                                    {!item.isValidOrderReturn && orderData && <span className="text-[10px] font-bold text-yellow-600 bg-yellow-100 px-1.5 rounded">Ex-Order</span>}
                                                </div>
                                                <p className="text-xs text-text-secondary dark:text-gray-400">{item.productName} <span className="opacity-50 mx-1">|</span> {item.variantInfo}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
<span className="font-mono font-bold text-green-600 dark:text-green-400">{taka}{item.price.toFixed(2)}</span>
                                            <button onClick={() => removeScannedItem(item.id)} className="text-gray-400 hover:text-red-500 transition">
                                                <span className="material-symbols-outlined">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-gray-100 dark:border-[var(--color-surface-dark-border)] bg-gray-50/50 dark:bg-white/5 space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-text-main dark:text-white mb-1">{t.inventory.refundAmount || 'Refund Amount'} ({t.inventory.balanceIncrease || 'Balance Increase'})</label>
                            <div className="relative">
<span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">{taka}</span>
                                <input
                                    type="text"
                                    min="0"
                                    step="0.01"
                                    onFocus={(e) => e.target.select()}
                                    value={refundAmount}
                                    onChange={(e) => setRefundAmount(e.target.value)}
                                    readOnly={scannedItems.length > 0}
                                    onKeyDown={(e) => {
                                        if (scannedItems.length > 0) return;
                                        if (e.key === 'ArrowUp') {
                                            e.preventDefault();
                                            const current = parseFloat(refundAmount) || 0;
                                            setRefundAmount((current + 1).toString());
                                        } else if (e.key === 'ArrowDown') {
                                            e.preventDefault();
                                            const current = parseFloat(refundAmount) || 0;
                                            setRefundAmount(Math.max(0, current - 1).toString());
                                        }
                                    }}
                                    className={`w-full pl-8 p-3 bg-white dark:bg-[var(--color-surface-dark-card)] border border-gray-300 dark:border-[var(--color-surface-dark-border)] rounded-lg font-bold text-lg text-green-600 focus:ring-primary focus:border-primary ${scannedItems.length > 0 ? 'bg-gray-50 cursor-not-allowed opacity-80' : ''}`}
                                />
                            </div>
                        </div>

                        {errorMsg && (
                            <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm flex items-center gap-2">
                                <span className="material-symbols-outlined">error</span>
                                {errorMsg}
                            </div>
                        )}

                        {successMsg && (
                            <div className="p-3 bg-green-100 text-green-700 rounded-lg text-sm flex items-center gap-2">
                                <span className="material-symbols-outlined">check_circle</span>
                                {successMsg}
                            </div>
                        )}

                        <button
                            onClick={handleProcessReturn}
                            disabled={processing || scannedItems.length === 0 || !selectedCustomer || !selectedInventoryId}
                            className="w-full py-3 bg-green-600 hover:bg-primary-dark text-white font-bold rounded-lg shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : <span className="material-symbols-outlined">keyboard_return</span>}
                            <span>{t.inventory.confirmReturn || 'Confirm Return & Refund'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* History Table */}
            <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-text-main dark:text-white">{t.inventory.pastReturns || 'Past Returns'}</h3>
                </div>
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[var(--color-surface-dark-border)] shadow-sm bg-white dark:bg-[var(--color-surface-dark-card)]">
                    <div className="max-h-[500px] overflow-y-auto">
                        <table className="w-full text-sm text-left text-text-main dark:text-gray-300">
                            <thead className="text-xs text-text-secondary uppercase bg-gray-50 dark:bg-[var(--color-surface-dark-solid)] dark:text-gray-400 sticky top-0 z-10 transition-colors">
                                <tr>
                                    <th className="px-6 py-4 font-bold" scope="col">{t.common.date || 'Date'}</th>
                                    <th className="px-6 py-4 font-bold" scope="col">{t.common.customer || 'Customer'}</th>
                                    <th className="px-6 py-4 font-bold" scope="col">{t.inventory.itemsReturned || 'Items Returned'}</th>
                                    <th className="px-6 py-4 font-bold" scope="col">{t.inventory.refunded || 'Refunded'}</th>
                                    <th className="px-6 py-4 font-bold" scope="col">{t.inventory.processedBy || 'Processed By'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-[#2a4032]">
                                {history.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-text-secondary dark:text-gray-400">
                                            {t.inventory.noReturnHistory || 'No return history found.'}
                                        </td>
                                    </tr>
                                ) : (
                                    history.map((record) => (
                                        <tr key={record.Id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-text-secondary dark:text-gray-400">
                                                {new Date(record.ReturnDate).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-text-main dark:text-white">
                                                {record.CustomerName}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                                    {record.ItemsCount} {t.common.items || 'items'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-mono font-bold text-green-600 dark:text-green-400">
+{taka}{record.RefundAmount.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 flex items-center gap-2">
                                                <div className="size-6 rounded-full bg-gray-200 flex items-center justify-center font-bold text-[10px] text-gray-500">
                                                    SYS
                                                </div>
                                                <span>{record.ProcessedBy}</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Barcode Scanner Modal */}
            {isScannerOpen && (
                <BarcodeScanner
                    enabled={true}
                    onScanned={(code) => {
                        setProductCodeInput(code);
                        handleAddProduct(code);
                    }}
                    onClose={() => setIsScannerOpen(false)}
                    onError={() => setIsScannerOpen(false)}
                />
            )}
        </div>
    );
}
