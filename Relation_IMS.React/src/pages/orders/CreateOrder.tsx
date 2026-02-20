import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import VariantSelectionModal from './VariantSelectionModal';

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

// Updated ProductItem Interface to match Backend DTO
interface ProductItem {
    Id: number;
    Code: string;
    ProductVariantId: number;
    IsDefected: boolean;
    IsSold: boolean;
    // Price fields from DTO
    VariantPrice: number;
    ColorName?: string;
    SizeName?: string;
    ProductId: number;
    ProductName: string;
    BasePrice: number;
    ImageUrls?: string[];
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
    ProductVariantId?: number;
    ColorName?: string;
    SizeName?: string;
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

    const { id } = useParams<{ id: string }>(); // Edit Mode ID

    // UI State
    const [isScanning, setIsScanning] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [itemLoading, setItemLoading] = useState(false);
    const [loadingOrder, setLoadingOrder] = useState(false); // New state for loading edit data

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
    const [nextPaymentDate, setNextPaymentDate] = useState<string>('');

    // Payment Input State
    const [currentMethod, setCurrentMethod] = useState<PaymentMethodType>('Cash');
    const [currentAmount, setCurrentAmount] = useState<string>('');

    const [notes, setNotes] = useState('');

    // Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const codeReader = useRef<BrowserMultiFormatReader | null>(null);

    // --- Variant Modal State ---
    const [showVariantModal, setShowVariantModal] = useState(false);
    const [modalProduct, setModalProduct] = useState<any | null>(null);
    const [modalVariants, setModalVariants] = useState<any[]>([]);

    // --- Print Prompt State ---
    const [showPrintPrompt, setShowPrintPrompt] = useState(false);
    const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);

    // --- Computed Values ---
    const subtotal = cart.reduce((acc, item) => acc + item.Subtotal, 0);
    const netAmount = Math.max(0, subtotal - discount);
    const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const dueAmount = Math.max(0, netAmount - paidAmount);

    // --- Load Order for Edit ---
    useEffect(() => {
        if (id) {
            loadOrderForEdit(Number(id));
        }
    }, [id]);

    const loadOrderForEdit = async (orderId: number) => {
        setLoadingOrder(true);
        try {
            const res = await api.get<any>(`/Order/${orderId}`);
            const order = res.data;

            // Populate Customer
            if (order.Customer) {
                setSelectedCustomer(order.Customer);
                if (order.Customer.IsDueAllowed) {
                    setAllowDue(true);
                    setNidNumber(order.Customer.NidNumber || '');
                    setReferenceName(order.Customer.ReferenceName || '');
                    setReferencePhone(order.Customer.ReferencePhoneNumber || '');
                }
            }

            // Populate Cart (Types need adjustment based on what API returns in OrderItem)
            if (order.OrderItems) {
                const mappedCart: CartItem[] = order.OrderItems.map((item: any) => ({
                    Id: item.ProductVariantId || item.ProductId, // Fallback
                    ProductId: item.ProductId,
                    Code: item.ProductVariant ? 'GENERIC' : 'UNKNOWN', // We don't have the specific item code here usually unless arranged
                    Name: item.Product?.Name || "Unknown Product",
                    VariantDetails: `${item.ProductVariant?.Color?.Name || ''} ${item.ProductVariant?.Size?.Name || ''}`.trim(),
                    Price: item.UnitPrice,
                    Quantity: item.Quantity,
                    Subtotal: item.Subtotal,
                    ImageUrl: item.Product?.ImageUrls?.[0],
                    VariantKey: `v-${item.ProductVariantId}`,
                    ProductVariantId: item.ProductVariantId,
                    ColorName: item.ProductVariant?.Color?.Name,
                    SizeName: item.ProductVariant?.Size?.Name,
                }));
                setCart(mappedCart);
            }

            // Populate Payments
            if (order.Payments) {
                setPayments(order.Payments.map((p: any) => ({
                    method: p.PaymentMethod === 0 ? 'Cash' : p.PaymentMethod === 1 ? 'Bank' : 'Bkash',
                    amount: p.Amount,
                    note: p.Note || ''
                })));
            }

            // Other fields
            setDiscount(order.Discount);
            setNotes(order.Remarks || '');
            if (order.NextPaymentDate) {
                setNextPaymentDate(order.NextPaymentDate.split('T')[0]);
            }

        } catch (err) {
            console.error("Failed to load order for edit", err);
            alert("Failed to load order.");
            navigate('/orders');
        } finally {
            setLoadingOrder(false);
        }
    };

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
    const handleVariantConfirm = (items: any[]) => {
        // items is array of { variant, quantity, price, subtotal }
        setCart(prev => {
            let updatedCart = [...prev];

            items.forEach(stagedItem => {
                const { variant, quantity, price } = stagedItem;
                const groupKey = `v-${variant.Id}`;
                const existingIndex = updatedCart.findIndex(item => item.VariantKey === groupKey);

                if (existingIndex >= 0) {
                    const existing = updatedCart[existingIndex];
                    updatedCart[existingIndex] = {
                        ...existing,
                        Quantity: existing.Quantity + quantity,
                        Subtotal: (existing.Quantity + quantity) * price,
                        Price: price
                    };
                } else {
                    // New Item
                    const newItem: CartItem = {
                        Id: variant.Id, // Use Variant ID as unique ID
                        ProductId: variant.ProductId,
                        Code: "GENERIC", // Variant ID tracking
                        Name: modalProduct?.Name || "Unknown",
                        VariantDetails: `${variant.Color?.Name || ''} ${variant.Size?.Name || ''}`.trim(),
                        Price: price,
                        Quantity: quantity,
                        Subtotal: price * quantity,
                        ImageUrl: modalProduct?.ImageUrls?.[0],
                        VariantKey: groupKey,
                        ProductVariantId: variant.Id,
                        // Add Color/Size info for Grouping
                        ColorName: variant.Color?.Name,
                        SizeName: variant.Size?.Name
                    } as any; // Cast to any to add extra fields if CartItem interface is strict
                    updatedCart = [newItem, ...updatedCart];
                }
            });

            return updatedCart.sort((a, b) => (b.Id - a.Id)); // Simple sort, or invalid sort if Id string, but let's just keep FIFO or LIFO
        });
    };

    // --- Product Search Logic (Server Side) ---
    const handleProductSearch = async (term: string) => {
        if (!term) return;

        const code = term.trim();
        setItemLoading(true);

        try {
            // 1. Fetch Item to identify Product
            const res = await api.get<ProductItem>(`/ProductItem/code/${code}`);
            const foundItem = res.data;
            const productId = foundItem.ProductId;

            // 2. Fetch All Variants for this Product
            const variantsRes = await api.get<any[]>(`/ProductVariants/product/${productId}`);
            const variants = variantsRes.data;

            // 3. Construct Product Object for Modal
            const productObj = {
                Id: productId,
                Name: foundItem.ProductName,
                Description: "Select variant for this product",
                BasePrice: foundItem.BasePrice,
                ImageUrls: foundItem.ImageUrls || []
            };

            setModalProduct(productObj);
            setModalVariants(variants);
            setShowVariantModal(true);
            setProductSearch('');

        } catch (err) {
            console.error("Product lookup failed", err);
            if ((err as any)?.response?.status === 404) {
                alert(`Item with code '${code}' not found.`);
            } else {
                alert('Error searching for product.');
            }
        } finally {
            setItemLoading(false);
        }
    };

    // function removed




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
            // 1. Create Order UPDATE Header
            const orderPayload = {
                CustomerId: selectedCustomer.Id,
                TotalAmount: subtotal,
                Discount: discount,
                NetAmount: netAmount,
                PaidAmount: paidAmount,
                PaymentStatus: paidAmount >= netAmount ? 2 : (paidAmount > 0 ? 1 : 0),
                UserId: 1, // Hardcoded as per user request
                Remarks: notes,
                NextPaymentDate: nextPaymentDate ? new Date(nextPaymentDate).toISOString() : null,
                Payments: payments.map(p => ({
                    PaymentMethod: p.method === 'Cash' ? 0 : p.method === 'Bank' ? 1 : 2,
                    Amount: p.amount,
                    Note: p.note
                })),
                OrderItems: id ? cart.map(item => ({
                    // For Edit, we send items in the payload
                    OrderId: Number(id),
                    ProductId: item.ProductId,
                    Quantity: item.Quantity,
                    UnitPrice: item.Price,
                    Subtotal: item.Subtotal,
                    ProductVariantId: item.ProductVariantId
                })) : undefined
            };

            let orderId = createdOrderId;

            if (id) {
                // UPDATE Mode
                await api.put(`/Order/${id}`, orderPayload);
                orderId = Number(id);
                // For Edit, we included items in payload, so no need for separate calls
            } else {
                // CREATE Mode
                const orderRes = await api.post('/Order', orderPayload);
                orderId = orderRes.data.Id;

                // 2. Create Order Items (POST Separate)
                const itemPromises = cart.map(item => {
                    return api.post('/OrderItem', {
                        OrderId: orderId,
                        ProductId: item.ProductId,
                        Quantity: item.Quantity,
                        UnitPrice: item.Price,
                        Subtotal: item.Subtotal,
                        ProductVariantId: item.ProductVariantId
                    });
                });

                await Promise.all(itemPromises);
            }

            // alert('Order created/updated successfully!'); // Replaced by print prompt
            setCreatedOrderId(orderId);
            setShowPrintPrompt(true);
            // navigate(`/orders/${orderId}?view=cycle`);

        } catch (err) {
            console.error("Failed to create order", err);
            alert('Failed to create order. Please try again.');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handlePrintInvoice = () => {
        if (!createdOrderId) return;
        // Navigate current tab to cycle (default behavior)
        navigate(`/orders/${createdOrderId}/invoice`);
    };

    const handleNoPrint = () => {
        if (!createdOrderId) return;
        navigate(`/orders/${createdOrderId}?view=cycle`);
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

                </div>
                {(itemLoading || loadingOrder) && (
                    <div className="text-sm text-primary animate-pulse font-bold">
                        {loadingOrder ? 'Loading Order...' : 'Loading product database...'}
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
                                        // Grouping Logic Implementation
                                        Object.values(cart.reduce((groups, item) => {
                                            const key = `${item.ProductId}-${item.ColorName || 'NoColor'}`;
                                            if (!groups[key]) groups[key] = { items: [], product: item };
                                            groups[key].items.push(item);
                                            return groups;
                                        }, {} as Record<string, { items: CartItem[], product: CartItem }>)).map((group, groupIdx) => (
                                            <>
                                                {/* Group Header */}
                                                <tr key={`group-${groupIdx}`} className="bg-gray-100/50 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700">
                                                    <td colSpan={6} className="px-6 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="size-8 rounded bg-white dark:bg-gray-600 bg-cover bg-center shrink-0 border border-gray-200 dark:border-gray-500"
                                                                style={{ backgroundImage: `url('${group.product.ImageUrl || 'https://via.placeholder.com/100'}')` }}>
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-sm text-gray-800 dark:text-gray-200">
                                                                    {group.product.Name}
                                                                    {group.product.ColorName && (
                                                                        <span className="ml-2 px-2 py-0.5 rounded-full bg-white dark:bg-gray-600 text-xs border border-gray-200 dark:border-gray-500 font-normal">
                                                                            {group.product.ColorName}
                                                                        </span>
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* Group Items (Variants) */}
                                                {group.items.map((item) => (
                                                    <tr key={item.Id} className="hover:bg-green-50/50 dark:hover:bg-green-900/10 transition-colors group">
                                                        <td className="px-6 py-3 pl-12 text-gray-400 font-mono text-xs border-l-4 border-transparent hover:border-green-400/30">
                                                            <span className="material-symbols-outlined text-sm text-gray-300">subdirectory_arrow_right</span>
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-sm text-gray-700 dark:text-gray-300">
                                                                    {item.SizeName || 'Default Size'}
                                                                </span>
                                                                <span className="font-mono text-[10px] text-gray-400 border border-gray-100 dark:border-gray-700 px-1 rounded">{item.Code}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-3 text-right text-text-main dark:text-gray-200 font-medium">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <span className="text-gray-400 text-xs">$</span>
                                                                <input
                                                                    type="number"
                                                                    className="w-20 bg-transparent border-b border-gray-200 dark:border-gray-700 text-right focus:border-primary focus:outline-none text-sm"
                                                                    value={item.Price}
                                                                    onChange={(e) => updatePrice(item.Id, parseFloat(e.target.value) || 0)}
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <span className="font-bold w-6 text-center text-text-main dark:text-white text-sm">{item.Quantity}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-3 text-right font-bold text-text-main dark:text-white text-sm">${item.Subtotal.toFixed(2)}</td>
                                                        <td className="px-6 py-3 text-center">
                                                            <button
                                                                onClick={() => removeFromCart(item.Id)}
                                                                className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                            >
                                                                <span className="material-symbols-outlined text-base">delete</span>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </>
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
                                            {/* Next Payment Date Picker - Show if there is a due amount AND allowDue is checked */}
                                            {allowDue && (
                                                <div className="mb-4 animate-fadeIn">
                                                    <label className="block text-sm font-bold text-text-main dark:text-white mb-2">Next Payment Date</label>
                                                    <input
                                                        type="date"
                                                        className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:border-primary focus:ring-primary"
                                                        value={nextPaymentDate}
                                                        onChange={(e) => setNextPaymentDate(e.target.value)}
                                                        min={new Date().toISOString().split('T')[0]}
                                                    />
                                                </div>
                                            )}
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
            {/* Variant Selection Modal */}
            <VariantSelectionModal
                isOpen={showVariantModal}
                onClose={() => setShowVariantModal(false)}
                product={modalProduct}
                variants={modalVariants}
                onConfirm={handleVariantConfirm}
            />

            {/* Print Invoice Prompt Modal */}
            {showPrintPrompt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1a2e22] rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-[#e7f3eb] dark:border-[#2a4032] transform scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-4xl text-primary">receipt_long</span>
                            </div>
                            <h3 className="text-xl font-bold text-text-main dark:text-white mb-2">Order Created! 🎉</h3>
                            <p className="text-text-secondary dark:text-gray-400 text-sm">
                                Do you want to print the invoice now?
                            </p>
                        </div>
                        <div className="flex gap-3 flex-col">
                            <button
                                onClick={handlePrintInvoice}
                                className="w-full px-4 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors shadow-lg flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined">print</span>
                                Yes, Print Invoice
                            </button>
                            <button
                                onClick={handleNoPrint}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 text-text-secondary dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 font-medium transition-colors"
                            >
                                No, thanks
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
