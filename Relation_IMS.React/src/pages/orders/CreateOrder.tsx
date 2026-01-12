import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

// Types matching the API DTOs and Logic
interface Customer {
    Id: number;
    Name: string;
    Phone: string;
    Email: string;
    Address: string;
    ShopName: string;
    ShopAddress: string;
    IsDueAllowed: boolean;
    NidNumber?: string;
    ReferenceName?: string;
    ReferencePhoneNumber?: string;
}

// Updated ProductItem Interface to match Backend Models
interface ProductItem {
    Id: number;
    Code: string;
    ProductVariantId: number;
    ProductVariant?: {
        Id: number;
        VariantPrice: number;
        Product?: {
            Id: number;
            Name: string;
            BasePrice: number;
            ImageUrls?: string[];
        };
        Color?: { Name: string };
        Size?: { Name: string };
    };
    IsDefected: boolean;
    IsSold: boolean;
}

interface CartItem {
    Id: number; // ProductItem Id of the FIRST scanned item in this group
    ProductId: number; // Product Id for order creation
    Code: string;
    Name: string;
    VariantDetails: string;
    Price: number;
    Quantity: number;
    Subtotal: number;
    ImageUrl?: string;
    // New fields for grouping
    VariantKey?: string;
    OriginalItemIds: number[]; // Track all ItemIDs in this group
}

// Payment Types
type PaymentMethodType = 'Cash' | 'Bank' | 'Bkash';

interface PaymentEntry {
    method: PaymentMethodType;
    amount: number;
    note?: string;
}

export default function CreateOrder() {
    const navigate = useNavigate();

    // UI State
    const [isScanning, setIsScanning] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [itemLoading, setItemLoading] = useState(false);

    // Data State
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customerSearch, setCustomerSearch] = useState('');
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

    // Allow Due Logic
    const [allowDue, setAllowDue] = useState(false);
    const [nidNumber, setNidNumber] = useState('');
    const [referenceName, setReferenceName] = useState('');
    const [referencePhone, setReferencePhone] = useState('');

    // Product Item Cache (Since no search API) - REMOVED
    const [productSearch, setProductSearch] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);

    // Order Summaries
    const [discount, setDiscount] = useState<number>(0);
    // const [paidAmount, setPaidAmount] = useState<number>(0); // Replaced by computed from payments
    // const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card'>('Cash'); // Replaced by list
    const [payments, setPayments] = useState<PaymentEntry[]>([]);

    // Payment Input State
    const [currentMethod, setCurrentMethod] = useState<PaymentMethodType>('Cash');
    const [currentAmount, setCurrentAmount] = useState<string>('');

    const [notes, setNotes] = useState('');

    // Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const codeReader = useRef<BrowserMultiFormatReader | null>(null);

    // --- Computed Values ---
    const subtotal = cart.reduce((acc, item) => acc + item.Subtotal, 0);
    const netAmount = Math.max(0, subtotal - discount);
    const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const dueAmount = Math.max(0, netAmount - paidAmount);

    // --- Customer Search ---
    useEffect(() => {
        const fetchCustomers = async () => {
            if (customerSearch.length < 2) {
                setCustomers([]);
                return;
            }
            try {
                const res = await api.get<any>(`/Customer?search=${customerSearch}&pageSize=5`);
                const data = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
                setCustomers(data);
                setShowCustomerDropdown(true);
            } catch (err) {
                console.error("Failed to search customers", err);
            }
        };

        const timeoutId = setTimeout(fetchCustomers, 300);
        return () => clearTimeout(timeoutId);
    }, [customerSearch]);

    // --- QR Scanner ---
    const startScanner = () => {
        setIsScanning(true);
        codeReader.current = new BrowserMultiFormatReader();
        codeReader.current.decodeFromVideoDevice(null, videoRef.current!, (result, err) => {
            if (result) {
                console.log("Scanned:", result.getText());
                handleProductSearch(result.getText());
                // Don't stop immediately to allow rapid scanning
                // But typically UI might want to show feedback
            }
            if (err && !(err instanceof NotFoundException)) {
                console.error(err);
            }
        });
    };

    const stopScanner = () => {
        setIsScanning(false);
        if (codeReader.current) {
            codeReader.current.reset();
            codeReader.current = null;
        }
    };

    useEffect(() => {
        return () => {
            if (codeReader.current) {
                codeReader.current.reset();
            }
        };
    }, []);


    // --- Product Search Logic (Server Side) ---
    const handleProductSearch = async (term: string) => {
        if (!term) return;

        const code = term.trim();
        setItemLoading(true);

        try {
            // 1. Check if specific item already scanned? 
            // The requirement says "if multiple productItems of a same product scanned.. it should be grouped together and increase quantity"
            // So we need to fetch the item details first to know its Product/Variant.

            const res = await api.get<ProductItem>(`/ProductItem/code/${code}`);
            const found = res.data;

            if (found.IsSold || found.IsDefected) {
                alert(`Item with code '${code}' is already Sold or Defected.`);
                setItemLoading(false);
                setProductSearch('');
                return;
            }

            // Map to Cart Item
            const product = found.ProductVariant?.Product;
            const variant = found.ProductVariant;

            const price = variant?.VariantPrice ?? product?.BasePrice ?? 0;
            const name = product?.Name || "Unknown Product";
            const imageUrl = (product?.ImageUrls && product.ImageUrls.length > 0) ? product.ImageUrls[0] : undefined;

            const color = variant?.Color?.Name || "";
            const size = variant?.Size?.Name || "";
            const details = [color, size].filter(Boolean).join(" / ");

            // Grouping Logic: 
            // We group by ProductVariantId (or ProductId if no variants used).
            // But wait, the CartItem needs to track WHICH specific items were added if we want to mark them sold?
            // "if multiple productItems of a same product scanned.. it should be grouped together"
            // This implies the Order Items view is AGGREGATED.
            // But we must remember the individual Item Ids to handle the transaction if needed?
            // The User Request says "add that product item in the orderitems api".
            // If the Order API only takes `ProductId`, we lose the specific Item Serial.
            // However, for the display in "Order Items section.. it must show detail of the product.. grouped together".

            // So I will Aggregate in the Cart State using a unique Key (e.g. VariantId).
            // I'll keep a list of `OriginalItemIds` in the cart item to track which specific items make up this quantity.

            const groupKey = variant?.Id ? `v-${variant.Id}` : `p-${product?.Id}`;

            setCart(prev => {
                const existingIndex = prev.findIndex(item => item.VariantKey === groupKey);

                if (existingIndex >= 0) {
                    // Update existing
                    const existing = prev[existingIndex];

                    // Check if this specific serial is already in the aggregated list (prevent double scan of same item)
                    if (existing.OriginalItemIds.includes(found.Id)) {
                        alert(`Item ${code} is already in the cart.`);
                        return prev;
                    }

                    const updatedItems = [...prev];
                    updatedItems[existingIndex] = {
                        ...existing,
                        Quantity: existing.Quantity + 1,
                        Subtotal: (existing.Quantity + 1) * existing.Price,
                        OriginalItemIds: [...existing.OriginalItemIds, found.Id]
                    };
                    return updatedItems;
                } else {
                    // Add new
                    const newItem: CartItem = {
                        Id: found.Id, // Primary ID (arbitrary one of them)
                        ProductId: product?.Id || 0,
                        Code: found.Code, // Display code of the first one
                        Name: name,
                        VariantDetails: details,
                        Price: price,
                        Quantity: 1,
                        Subtotal: price,
                        ImageUrl: imageUrl,
                        VariantKey: groupKey,
                        OriginalItemIds: [found.Id]
                    };
                    return [newItem, ...prev];
                }
            });

            setProductSearch('');

        } catch (err) {
            console.error("Product lookup failed", err);
            // Check for 404
            if ((err as any)?.response?.status === 404) {
                alert(`Item with code '${code}' not found.`);
            } else {
                alert('Error searching for product.');
            }
        } finally {
            setItemLoading(false);
        }
    };


    const removeFromCart = (id: number) => {
        setCart(prev => prev.filter(item => item.Id !== id));
    };

    const updatePrice = (id: number, newPrice: number) => {
        setCart(prev => prev.map(item => {
            if (item.Id === id) {
                return {
                    ...item,
                    Price: newPrice,
                    Subtotal: newPrice * item.Quantity
                };
            }
            return item;
        }));
    };


    // --- Order Submission ---
    const updateCustomerForDue = async () => {
        if (!selectedCustomer) return true; // Should not happen

        try {
            await api.put(`/Customer/${selectedCustomer.Id}`, {
                ...selectedCustomer,
                IsDueAllowed: true,
                NidNumber: nidNumber,
                ReferenceName: referenceName,
                ReferencePhoneNumber: referencePhone
            });
            return true;
        } catch (error) {
            console.error("Failed to update customer due info", error);
            alert("Failed to update customer information for Due. Order creation aborted.");
            return false;
        }
    };

    const handleSubmit = async () => {
        if (!selectedCustomer) {
            alert('Please select a customer.');
            return;
        }
        if (cart.length === 0) {
            alert('Cart is empty.');
            return;
        }

        // Check if Due is allowed versus Due Amount
        const computedDue = Math.max(0, netAmount - paidAmount);

        if (computedDue > 0) {
            if (!allowDue) {
                alert("This order has a due amount but 'Allow Due' is not checked. Please clear the due or enable 'Allow Due'.");
                return;
            }
            // If allowDue is true, we must have the required fields (Checked next)
        }

        if (allowDue) {
            if (!nidNumber || !referenceName || !referencePhone) {
                alert('Please provide NID, Reference Name and Reference Number for allowing due.');
                return;
            }
        }

        setSubmitLoading(true);
        try {
            // Update Customer if Allow Due is checked
            if (allowDue) {
                const success = await updateCustomerForDue();
                if (!success) {
                    setSubmitLoading(false);
                    return;
                }
            }

            // 1. Create Order Header
            const orderPayload = {
                CustomerId: selectedCustomer.Id,
                TotalAmount: subtotal,
                Discount: discount,
                NetAmount: netAmount,
                PaidAmount: paidAmount,
                PaymentStatus: paidAmount >= netAmount ? 2 : (paidAmount > 0 ? 1 : 0),
                UserId: 1, // Hardcoded as per user request
                Remarks: notes,
                Payments: payments.map(p => ({
                    PaymentMethod: p.method === 'Cash' ? 0 : p.method === 'Bank' ? 1 : 2,
                    Amount: p.amount,
                    Note: p.note
                }))
            };

            const orderRes = await api.post('/Order', orderPayload);
            const orderId = orderRes.data.Id;

            // 2. Create Order Items
            // For Product Items, we need to know what API endpoint handles mapping them
            // The existing `POST /OrderItem` uses `ProductId`, `Quantity`, `UnitPrice`.
            // Does it support `ProductItemId`?
            // The user wanted to add "ProductItems". 
            // If the OrderItem logic assumes Generic Product + Qty, then we have a mismatch if we want to track specific Serial Numbers in the Order.
            // However, the `CreateOrderItemDTO` has `ProductId`. It does NOT have `ProductItemId`.
            // This suggests the Order system relies on generic products.
            // BUT, the `InventoryTransfer` moves specific items.
            // If we sell a specific item `PV-1-abc`, we should mark that item as Sold.
            // DOES `POST /OrderItem` handle marking ProductItem as sold? 
            // Likely NOT if it only takes `ProductId`.

            // CRITICAL: We might need to just link the generic Product ID for the Order Record 
            // AND separately mark the ProductItem as Sold/Defected? 
            // OR the Backend logic creates generic OrderItems.

            // Given I cannot see a "SellProductItem" endpoint, I will use the standard `POST /OrderItem` 
            // using the `ProductVariant.ProductId`. 
            // NOTE: This might mean the specific serial code isn't stored in the order, 
            // which might be a gap in the current API vs User Requirement.
            // I will implement using the existing API but pass the ProductID.

            const itemPromises = cart.map(item => {
                return api.post('/OrderItem', {
                    OrderId: orderId,
                    ProductId: item.ProductId,
                    Quantity: item.Quantity,
                    UnitPrice: item.Price,
                    Subtotal: item.Subtotal
                });
            });

            await Promise.all(itemPromises);

            alert('Order created successfully!');
            navigate('/orders');

        } catch (err) {
            console.error("Failed to create order", err);
            alert('Failed to create order. Please try again.');
        } finally {
            setSubmitLoading(false);
        }
    };


    return (
        <div className="flex-1 w-full max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 font-display text-text-main dark:text-gray-100">
            {/* Breadcrumb */}
            <div className="flex flex-wrap items-center gap-2 mb-6 text-sm">
                <Link to="/" className="text-text-secondary font-medium hover:text-primary transition-colors">Home</Link>
                <span className="text-text-secondary material-symbols-outlined text-base">chevron_right</span>
                <Link to="/orders" className="text-text-secondary font-medium hover:text-primary transition-colors">Orders</Link>
                <span className="text-text-secondary material-symbols-outlined text-base">chevron_right</span>
                <span className="text-text-main dark:text-gray-200 font-medium">Create New Order</span>
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-text-main dark:text-white tracking-tight flex items-center gap-3">
                        <span className="material-symbols-outlined text-4xl text-primary">qr_code_scanner</span>
                        Create New Order
                    </h1>
                    <p className="text-text-secondary dark:text-gray-400 text-sm md:text-base mt-2">Streamlined scan & add process</p>
                </div>
                {itemLoading && (
                    <div className="text-sm text-primary animate-pulse font-bold">
                        Loading product database...
                    </div>
                )}
            </div>

            <div className="flex flex-col xl:flex-row gap-6">
                <div className="flex-1 flex flex-col gap-5">

                    {/* Customer Selection */}
                    <div className="bg-white dark:bg-[#1e2e23] rounded-xl shadow-sm border border-[#e7f3eb] dark:border-gray-800 p-5 z-20 relative">
                        <label className="block text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wider mb-2">Customer Selection</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <span className="material-symbols-outlined">smartphone</span>
                            </div>
                            <input
                                className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-[#f8fcf9] dark:bg-gray-800/50 pl-10 pr-10 py-3 text-sm text-text-main dark:text-white placeholder-gray-500 focus:border-primary focus:ring-primary shadow-sm transition-shadow group-hover:border-primary/50"
                                placeholder="Search by name or enter mobile number..."
                                type="text"
                                value={selectedCustomer ? `${selectedCustomer.Name} (${selectedCustomer.Phone})` : customerSearch}
                                onChange={(e) => {
                                    setCustomerSearch(e.target.value);
                                    setSelectedCustomer(null); // Clear selection on edit
                                    setAllowDue(false);
                                    setNidNumber('');
                                    setReferenceName('');
                                    setReferencePhone('');
                                }}
                                onFocus={() => setShowCustomerDropdown(true)}
                                onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)} // Delay to allow click
                            />
                            {selectedCustomer && (
                                <button
                                    onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); }}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-red-500"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            )}

                            {/* Dropdown */}
                            {showCustomerDropdown && customers.length > 0 && !selectedCustomer && (
                                <div className="absolute top-full left-0 right-0 bg-white dark:bg-[#1a2e22] border border-gray-200 dark:border-gray-700 mt-1 rounded-lg shadow-xl max-h-60 overflow-y-auto z-30">
                                    {customers.map(c => (
                                        <div
                                            key={c.Id}
                                            className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer flex justify-between items-center"
                                            onClick={() => {
                                                setSelectedCustomer(c);
                                                setShowCustomerDropdown(false);
                                                // Pre-fill Logic
                                                if (c.IsDueAllowed || c.NidNumber || c.ReferenceName || c.ReferencePhoneNumber) {
                                                    setAllowDue(c.IsDueAllowed || false);
                                                    setNidNumber(c.NidNumber || '');
                                                    setReferenceName(c.ReferenceName || '');
                                                    setReferencePhone(c.ReferencePhoneNumber || '');
                                                } else {
                                                    // Reset if new customer doesn't have data
                                                    setAllowDue(false);
                                                    setNidNumber('');
                                                    setReferenceName('');
                                                    setReferencePhone('');
                                                }
                                            }}
                                        >
                                            <div>
                                                <p className="font-bold text-sm text-text-main dark:text-white">{c.Name}</p>
                                                <p className="text-xs text-secondary">{c.Phone}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Allow Due Section */}


                    {/* Scan Section */}
                    <div className="bg-white dark:bg-[#1e2e23] rounded-xl shadow-lg border border-[#e7f3eb] dark:border-gray-800 p-3 flex flex-col sm:flex-row items-center gap-4 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 dark:bg-primary/40"></div>

                        {/* Camera/Live Scan Preview */}
                        <div
                            className="relative w-full sm:w-48 h-24 sm:h-20 bg-black rounded-lg overflow-hidden shrink-0 shadow-inner group cursor-pointer ring-1 ring-black/10 dark:ring-white/10"
                            onClick={isScanning ? stopScanner : startScanner}
                        >
                            <video ref={videoRef} className={`absolute inset-0 w-full h-full object-cover ${!isScanning && 'hidden'}`} />
                            {!isScanning && (
                                <>
                                    <div className="absolute inset-0 bg-cover bg-center opacity-80" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=400')" }}></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-white text-3xl drop-shadow-md">videocam</span>
                                    </div>
                                </>
                            )}

                            {isScanning && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-full h-0.5 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,1)] animate-pulse"></div>
                                </div>
                            )}

                            <div className="absolute bottom-1 right-1 bg-black/70 backdrop-blur rounded px-1.5 py-0.5 flex items-center gap-1.5 border border-white/10">
                                <div className={`size-1.5 rounded-full ${isScanning ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></div>
                                <span className="text-[9px] font-bold text-white uppercase tracking-wider">{isScanning ? 'Scanning...' : 'Click to Scan'}</span>
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="flex-1 w-full flex flex-col justify-center gap-1.5 relative z-10">
                            <label className="text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                Add Item (Scan Product Item Code)
                            </label>
                            <div className="relative flex items-center w-full">
                                <span className="absolute left-3 text-gray-400 pointer-events-none">
                                    <span className="material-symbols-outlined">barcode_reader</span>
                                </span>
                                <input
                                    autoFocus
                                    className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-[#f8fcf9] dark:bg-gray-800/50 pl-10 pr-20 py-3 text-base text-text-main dark:text-white placeholder-gray-400 focus:border-primary focus:ring-primary shadow-sm"
                                    placeholder="e.g. PV-1-8a65f7ab"
                                    type="text"
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleProductSearch(productSearch);
                                        }
                                    }}
                                />
                                <button
                                    onClick={() => handleProductSearch(productSearch)}
                                    className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 rounded text-xs font-bold text-gray-500 transition-colors"
                                >
                                    ADD ITEM
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Order Items Table */}
                    <div className="bg-white dark:bg-[#1e2e23] rounded-xl shadow-sm border border-[#e7f3eb] dark:border-gray-800 flex flex-col overflow-hidden flex-1 min-h-[400px]">
                        <div className="px-6 py-4 border-b border-[#f0f7f2] dark:border-gray-700 flex justify-between items-center bg-[#f8fcf9] dark:bg-gray-800/30">
                            <h3 className="text-lg font-bold text-text-main dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">shopping_cart</span>
                                Order Items <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full ml-1">{cart.length}</span>
                            </h3>
                            {cart.length > 0 && (
                                <button onClick={() => setCart([])} className="text-red-500 hover:text-red-700 text-sm font-bold flex items-center gap-1 transition-colors">
                                    <span className="material-symbols-outlined text-base">delete_sweep</span> Clear All
                                </button>
                            )}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-100 dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 w-16">#</th>
                                        <th className="px-6 py-3">Product Details</th>
                                        <th className="px-6 py-3 text-right">Unit Price</th>
                                        <th className="px-6 py-3 text-center">Quantity</th>
                                        <th className="px-6 py-3 text-right">Total</th>
                                        <th className="px-6 py-3 text-center w-16">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#f0f7f2] dark:divide-gray-700">
                                    {cart.length === 0 ? (
                                        <tr className="bg-gray-50/30 dark:bg-gray-800/20">
                                            <td colSpan={6} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500 border-dashed border-2 border-gray-200 dark:border-gray-700 rounded-lg m-4">
                                                <div className="flex flex-col items-center justify-center gap-1">
                                                    <span className="material-symbols-outlined text-4xl opacity-50 mb-2">qr_code_2</span>
                                                    <span className="text-base font-medium">No items yet</span>
                                                    <span className="text-xs">Scan item code (PV-...) to add to cart</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        cart.map((item, index) => (
                                            <tr key={index} className="hover:bg-green-50/50 dark:hover:bg-green-900/10 transition-colors group">
                                                <td className="px-6 py-4 text-gray-400 font-mono">{index + 1}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="size-10 rounded-lg bg-gray-100 dark:bg-gray-700 bg-cover bg-center shrink-0 border border-[#e7f3eb] dark:border-gray-600" style={{ backgroundImage: `url('${item.ImageUrl || 'https://via.placeholder.com/100'}')` }}></div>
                                                        <div>
                                                            <p className="font-bold text-text-main dark:text-white">{item.Name}</p>
                                                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                                {item.VariantDetails && <span className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{item.VariantDetails}</span>}
                                                                <span className="font-mono text-gray-400">{item.Code}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right text-text-main dark:text-gray-200 font-medium">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <span className="text-gray-400 text-xs">$</span>
                                                        <input
                                                            type="number"
                                                            className="w-20 bg-transparent border-b border-gray-200 dark:border-gray-700 text-right focus:border-primary focus:outline-none"
                                                            value={item.Price}
                                                            onChange={(e) => updatePrice(item.Id, parseFloat(e.target.value) || 0)}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {/* Lock Quantity to 1 for unique items per row, or assume we can't change it for unique scans without removing */}
                                                        <span className="font-bold w-6 text-center text-text-main dark:text-white">{item.Quantity}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-text-main dark:text-white">${item.Subtotal.toFixed(2)}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => removeFromCart(item.Id)}
                                                        className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">delete</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Sidebar Summary */}
                <div className="w-full xl:w-96 flex flex-col gap-6 shrink-0">
                    <div className="bg-white dark:bg-[#1e2e23] rounded-xl shadow-lg border border-[#e7f3eb] dark:border-gray-800 p-6 sticky top-24">
                        <h3 className="text-lg font-bold text-text-main dark:text-white mb-6 border-b border-[#f0f7f2] dark:border-gray-700 pb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">receipt</span>
                            Order Summary
                        </h3>

                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600 dark:text-gray-400 font-medium">Subtotal ({cart.length} items)</span>
                                <span className="text-text-main dark:text-white font-bold text-base">${subtotal.toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1 font-medium">
                                    Discount <span className="material-symbols-outlined text-sm text-gray-400 cursor-help" title="Enter discount">help</span>
                                </span>
                                <div className="flex items-center w-32">
                                    <div className="relative w-full">
                                        <span className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-gray-500 text-xs">$</span>
                                        <input
                                            className="block w-full rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-right text-sm py-1.5 px-2 pl-5 focus:border-primary focus:ring-primary text-red-500 font-medium placeholder-gray-300"
                                            placeholder="0.00"
                                            type="number"
                                            value={discount}
                                            onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-sm border-t border-dashed border-gray-300 dark:border-gray-600 pt-3">
                                <span className="font-bold text-text-main dark:text-white">Net Amount</span>
                                <span className="font-bold text-text-main dark:text-white text-lg">${netAmount.toFixed(2)}</span>
                            </div>

                            <div className="bg-[#f8fcf9] dark:bg-gray-800/50 p-4 rounded-lg border border-[#e7f3eb] dark:border-gray-700 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600 dark:text-gray-400 font-medium">Paid Amount</span>
                                    <div className="flex items-center w-28 relative">
                                        <span className="absolute left-2 text-sm text-green-600 font-bold">$</span>
                                        <input
                                            className="block w-full rounded border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-right text-sm py-1 px-2 pl-4 font-bold text-green-600 cursor-not-allowed"
                                            type="number"
                                            value={paidAmount}
                                            readOnly
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-base pt-2 border-t border-gray-200 dark:border-gray-700">
                                    <span className="font-bold text-red-600 dark:text-red-400">Due Amount</span>
                                    <span className="font-black text-red-600 dark:text-red-400 text-xl">${dueAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mb-6">
                            {/* Allow Due Section Moved Here */}
                            {selectedCustomer && (
                                <div className={`rounded-xl shadow-sm border p-4 mb-4 transition-colors ${allowDue ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800' : 'bg-[#f8fcf9] dark:bg-gray-800/30 border-[#e7f3eb] dark:border-gray-700'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="allowDueSummary"
                                                checked={allowDue}
                                                onChange={(e) => setAllowDue(e.target.checked)}
                                                className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500 border-gray-300 dark:border-gray-600"
                                            />
                                            <label htmlFor="allowDueSummary" className="font-bold text-sm text-text-main dark:text-white cursor-pointer select-none">
                                                Allow Due
                                            </label>
                                        </div>
                                        {allowDue && <span className="text-[10px] bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Required</span>}
                                    </div>

                                    {allowDue && (
                                        <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-1 duration-200 mt-3 pt-3 border-t border-orange-100 dark:border-white/10">
                                            <div>
                                                <input
                                                    type="text"
                                                    className="block w-full rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-1.5 px-2 text-xs focus:border-orange-500 focus:ring-orange-500"
                                                    placeholder="National ID Number"
                                                    value={nidNumber}
                                                    onChange={(e) => setNidNumber(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <input
                                                    type="text"
                                                    className="block w-full rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-1.5 px-2 text-xs focus:border-orange-500 focus:ring-orange-500"
                                                    placeholder="Ref. Person Name"
                                                    value={referenceName}
                                                    onChange={(e) => setReferenceName(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <input
                                                    type="text"
                                                    className="block w-full rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-1.5 px-2 text-xs focus:border-orange-500 focus:ring-orange-500"
                                                    placeholder="Ref. Phone Number"
                                                    value={referencePhone}
                                                    onChange={(e) => setReferencePhone(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <label className="block text-sm font-bold text-text-main dark:text-white mb-2">Payment Details (Split Payment)</label>

                            <div className="bg-[#f8fcf9] dark:bg-gray-800/50 p-3 rounded-lg border border-[#e7f3eb] dark:border-gray-700 mb-3">
                                <div className="flex gap-2 mb-2">
                                    <select
                                        className="block w-28 rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium focus:border-primary focus:ring-primary"
                                        value={currentMethod}
                                        onChange={(e) => setCurrentMethod(e.target.value as PaymentMethodType)}
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Bank">Bank</option>
                                        <option value="Bkash">Bkash</option>
                                    </select>
                                    <input
                                        type="number"
                                        className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-3 focus:border-primary focus:ring-primary"
                                        placeholder="Amount"
                                        value={currentAmount}
                                        onChange={(e) => setCurrentAmount(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && currentAmount) {
                                                const amt = parseFloat(currentAmount);
                                                if (amt > 0) {
                                                    setPayments([...payments, { method: currentMethod, amount: amt }]);
                                                    setCurrentAmount('');
                                                }
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={() => {
                                            const amt = parseFloat(currentAmount);
                                            if (amt > 0) {
                                                setPayments([...payments, { method: currentMethod, amount: amt }]);
                                                setCurrentAmount('');
                                            }
                                        }}
                                        disabled={!currentAmount || parseFloat(currentAmount) <= 0}
                                        className="bg-primary text-white rounded-lg px-3 py-1 font-bold text-sm hover:bg-primary-dark disabled:opacity-50"
                                    >
                                        Add
                                    </button>
                                </div>
                                {dueAmount > 0 && <p className="text-xs text-red-500 font-medium text-right">Remaining Due: ${dueAmount.toFixed(2)}</p>}
                            </div>

                            {/* Payment List */}
                            {payments.length > 0 && (
                                <div className="space-y-2 mb-2">
                                    {payments.map((p, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-sm p-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded shadow-sm">
                                            <div className="flex items-center gap-2">
                                                <span className={`material-symbols-outlined text-lg ${p.method === 'Cash' ? 'text-green-500' : p.method === 'Bank' ? 'text-blue-500' : 'text-pink-500'}`}>
                                                    {p.method === 'Cash' ? 'payments' : p.method === 'Bank' ? 'account_balance' : 'smartphone'}
                                                </span>
                                                <span className="font-bold text-gray-700 dark:text-gray-300">{p.method}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-text-main dark:text-white">${p.amount.toFixed(2)}</span>
                                                <button
                                                    onClick={() => setPayments(payments.filter((_, i) => i !== idx))}
                                                    className="text-gray-400 hover:text-red-500"
                                                >
                                                    <span className="material-symbols-outlined text-lg">close</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-text-main dark:text-white mb-2 flex items-center justify-between">
                                Order Notes
                                <span className="text-xs font-normal text-gray-400">Optional</span>
                            </label>
                            <textarea
                                className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-[#f8fcf9] dark:bg-gray-800 text-sm text-text-main dark:text-white focus:border-primary focus:ring-primary placeholder-gray-400 resize-none min-h-[80px]"
                                placeholder="Add internal notes..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            ></textarea>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={submitLoading}
                            className={`w-full bg-primary text-white font-bold h-12 rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-green-200 dark:shadow-none flex items-center justify-center gap-2 text-base transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed`}
                        >
                            {submitLoading ? (
                                <>
                                    <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">check_circle</span>
                                    Complete Order
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => navigate('/orders')}
                            className="w-full mt-3 text-gray-500 dark:text-gray-400 font-medium text-sm hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        >
                            Cancel Order
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
