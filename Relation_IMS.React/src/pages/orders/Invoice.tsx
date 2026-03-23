import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { getTenantConfig } from '../../services/tenantTheme';
import { getTenant } from '../../services/authService';

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€ types (local, mirrors the backend anonymous DTO) â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
interface InvoiceItem {
    Id: number;
    ProductName: string;
    CategoryName?: string;
    BrandName?: string;
    ColorName?: string;
    SizeName?: string;
    Quantity: number;
    UnitPrice: number;
    CostPrice: number;
    Discount: number;
    Subtotal: number;
}

interface InvoicePayment {
    Id: number;
    Method: string;
    Amount: number;
    Note?: string;
}

interface InvoiceData {
    Id: number;
    OrderDate: string;
    TotalAmount: number;
    Discount: number;
    NetAmount: number;
    PaidAmount: number;
    DueAmount: number;
    PaymentStatus: string;
    Remarks?: string;
    Customer?: {
        Id: number;
        Name: string;
        Phone: string;
        Address: string;
        ShopName: string;
        ShopAddress: string;
    };
    SoldBy?: {
        Id: number;
        Name: string;
    };
    Items?: InvoiceItem[];
    Payments?: InvoicePayment[];
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€ helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const SHOP_TAGLINE = 'Shirts â€¢ Pants â€¢ Fashion';
const SHOP_ADDRESS = 'Dhaka, Bangladesh';
const SHOP_PHONE = '+880 1XXX-XXXXXX';
const RECEIPT_WIDTH = 302; // ~80mm thermal paper

const divider = 'â”€'.repeat(38);
const doubleDivider = 'â•'.repeat(38);
const dotDivider = 'â”ˆ'.repeat(38);

function formatDate(dateString: string) {
    if (!dateString || dateString.startsWith('0001-01-01')) return 'N/A';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        + '  ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function money(n: number) {
    return 'à§³' + n.toFixed(2);
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€ component â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export default function InvoicePage() {
    const { id } = useParams<{ id: string }>();
    const [invoice, setInvoice] = useState<InvoiceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const receiptRef = useRef<HTMLDivElement>(null);
    const tenantConfig = getTenantConfig(getTenant());
    const SHOP_NAME = tenantConfig.displayName.toUpperCase();

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        api.get(`/Invoice/${id}`)
            .then(res => setInvoice(res.data))
            .catch(err => {
                console.error(err);
                setError(err.response?.status === 404 ? 'Order not found.' : 'Failed to load invoice.');
            })
            .finally(() => setLoading(false));
    }, [id]);

    const handlePrint = () => window.print();

    /* â”€â”€â”€â”€â”€ loading / error states â”€â”€â”€â”€â”€ */
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 min-h-screen bg-background-light dark:bg-background-dark">
                <div className="relative">
                    <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-primary"></div>
                    <span className="material-symbols-outlined absolute inset-0 flex items-center justify-center text-primary text-xl">receipt_long</span>
                </div>
                <p className="mt-4 text-text-secondary font-medium">Generating invoiceâ€¦</p>
            </div>
        );
    }

    if (error || !invoice) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background-light dark:bg-background-dark px-4">
                <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-8 text-center max-w-md w-full mb-6">
                    <span className="material-symbols-outlined text-4xl text-red-500 mb-2">error</span>
                    <h2 className="text-xl font-bold text-red-800 dark:text-red-300 mb-2">Oops!</h2>
                    <p className="text-red-600 dark:text-red-400">{error || 'Invoice not found'}</p>
                </div>
                <Link to="/orders" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-green-600 transition-colors shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined">arrow_back</span>
                    Back to Orders
                </Link>
            </div>
        );
    }

    const totalQty = invoice.Items?.reduce((s, i) => s + i.Quantity, 0) ?? 0;

    /* â”€â”€â”€â”€â”€ receipt render â”€â”€â”€â”€â”€ */
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-background-dark py-8 px-4 print:bg-white print:p-0 print:m-0">

            {/* â”€â”€ action bar (hidden on print) â”€â”€ */}
            <div className="print:hidden max-w-md mx-auto mb-6 flex items-center justify-between gap-3">
                <Link to={`/orders/${invoice.Id}`} className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors font-semibold text-sm">
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                    Back to Order #{invoice.Id}
                </Link>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-green-600 transition-all shadow-lg shadow-green-500/30 active:scale-95"
                >
                    <span className="material-symbols-outlined text-lg">print</span>
                    Print Receipt
                </button>
            </div>

            {/* â”€â”€ receipt paper â”€â”€ */}
            <div
                ref={receiptRef}
                className="mx-auto bg-white text-gray-900 shadow-2xl print:shadow-none print:mx-0 print:w-full"
                style={{
                    width: RECEIPT_WIDTH,
                    fontFamily: "'Courier New', 'Consolas', 'Liberation Mono', monospace",
                    fontSize: '11px',
                    lineHeight: '1.45',
                    padding: '20px 14px 30px',
                }}
            >
                {/* â”€â”€ shop header â”€â”€ */}
                <div className="text-center mb-1">
                    <div style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '4px', marginBottom: '2px' }}>
                        {SHOP_NAME}
                    </div>
                    <div style={{ fontSize: '9px', letterSpacing: '1px', color: '#666', marginBottom: '4px' }}>
                        {SHOP_TAGLINE}
                    </div>
                    <div style={{ fontSize: '9px', color: '#888' }}>
                        {SHOP_ADDRESS}
                    </div>
                    <div style={{ fontSize: '9px', color: '#888' }}>
                        Tel: {SHOP_PHONE}
                    </div>
                </div>

                <div className="text-center my-2" style={{ fontSize: '9px', color: '#aaa' }}>{doubleDivider}</div>

                {/* â”€â”€ invoice title â”€â”€ */}
                <div className="text-center mb-1" style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '2px' }}>
                    SALES INVOICE
                </div>
                <div className="text-center mb-1" style={{ fontSize: '9px', color: '#888' }}>
                    Invoice # INV-{String(invoice.Id).padStart(5, '0')}
                </div>

                <div className="text-center" style={{ fontSize: '9px', color: '#aaa' }}>{divider}</div>

                {/* â”€â”€ order meta â”€â”€ */}
                <div className="my-2" style={{ fontSize: '10px' }}>
                    <div className="flex justify-between">
                        <span style={{ color: '#888' }}>Date:</span>
                        <span style={{ fontWeight: 600 }}>{formatDate(invoice.OrderDate)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span style={{ color: '#888' }}>Order #:</span>
                        <span style={{ fontWeight: 600 }}>{invoice.Id}</span>
                    </div>
                    {invoice.SoldBy && (
                        <div className="flex justify-between">
                            <span style={{ color: '#888' }}>Cashier:</span>
                            <span style={{ fontWeight: 600 }}>{invoice.SoldBy.Name}</span>
                        </div>
                    )}
                </div>

                <div style={{ fontSize: '9px', color: '#aaa' }}>{divider}</div>

                {/* â”€â”€ customer info â”€â”€ */}
                {invoice.Customer && (
                    <div className="my-2" style={{ fontSize: '10px' }}>
                        <div style={{ fontWeight: 700, marginBottom: '2px', fontSize: '10px', letterSpacing: '1px' }}>
                            BILL TO
                        </div>
                        <div style={{ fontWeight: 600 }}>{invoice.Customer.Name}</div>
                        <div style={{ color: '#666' }}>{invoice.Customer.Phone}</div>
                        {invoice.Customer.ShopName && (
                            <div style={{ color: '#666' }}>{invoice.Customer.ShopName}</div>
                        )}
                        {invoice.Customer.ShopAddress && (
                            <div style={{ color: '#666', fontSize: '9px' }}>{invoice.Customer.ShopAddress}</div>
                        )}
                        {invoice.Customer.Address && (
                            <div style={{ color: '#888', fontSize: '9px' }}>{invoice.Customer.Address}</div>
                        )}
                    </div>
                )}

                <div style={{ fontSize: '9px', color: '#aaa' }}>{doubleDivider}</div>

                {/* â”€â”€ items header â”€â”€ */}
                <div className="flex justify-between my-1" style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.5px' }}>
                    <span style={{ flex: 1 }}>ITEM</span>
                    <span style={{ width: '32px', textAlign: 'right' }}>QTY</span>
                    <span style={{ width: '50px', textAlign: 'right' }}>PRICE</span>
                    <span style={{ width: '55px', textAlign: 'right' }}>TOTAL</span>
                </div>

                <div style={{ fontSize: '9px', color: '#ccc' }}>{divider}</div>

                {/* â”€â”€ line items â”€â”€ */}
                {invoice.Items && invoice.Items.length > 0 ? (
                    invoice.Items.map((item, idx) => (
                        <div key={item.Id} className="mb-2">
                            {/* product name row */}
                            <div style={{ fontWeight: 600, fontSize: '10px', marginBottom: '1px' }}>
                                {idx + 1}. {item.ProductName}
                            </div>
                            {/* variant details */}
                            {(item.ColorName || item.SizeName || item.BrandName) && (
                                <div style={{ fontSize: '9px', color: '#888', paddingLeft: '12px', marginBottom: '1px' }}>
                                    {[item.ColorName, item.SizeName, item.BrandName].filter(Boolean).join(' / ')}
                                </div>
                            )}
                            {/* qty Ã— price = total row */}
                            <div className="flex justify-between" style={{ fontSize: '10px', paddingLeft: '12px' }}>
                                <span style={{ flex: 1, color: '#666' }}>
                                    {item.Quantity} Ã— {money(item.UnitPrice)}
                                </span>
                                <span style={{ fontWeight: 600, width: '55px', textAlign: 'right' }}>
                                    {money(item.Subtotal)}
                                </span>
                            </div>
                            {/* item-level discount */}
                            {item.Discount > 0 && (
                                <div style={{ fontSize: '9px', color: '#c00', paddingLeft: '12px' }}>
                                    Disc: -{money(item.Discount)}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-2" style={{ color: '#999', fontSize: '10px' }}>No items</div>
                )}

                <div style={{ fontSize: '9px', color: '#aaa' }}>{divider}</div>

                {/* â”€â”€ totals â”€â”€ */}
                <div className="my-2" style={{ fontSize: '10px' }}>
                    <div className="flex justify-between mb-0.5">
                        <span style={{ color: '#666' }}>Items: {totalQty}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span style={{ fontWeight: 600 }}>{money(invoice.TotalAmount)}</span>
                    </div>
                    {invoice.Discount > 0 && (
                        <div className="flex justify-between" style={{ color: '#c00' }}>
                            <span>Discount</span>
                            <span style={{ fontWeight: 600 }}>-{money(invoice.Discount)}</span>
                        </div>
                    )}
                </div>

                <div style={{ fontSize: '9px', color: '#000', fontWeight: 700 }}>{doubleDivider}</div>

                {/* â”€â”€ grand total â”€â”€ */}
                <div className="flex justify-between my-1" style={{ fontSize: '14px', fontWeight: 900 }}>
                    <span>TOTAL</span>
                    <span>{money(invoice.NetAmount)}</span>
                </div>

                <div style={{ fontSize: '9px', color: '#000', fontWeight: 700 }}>{doubleDivider}</div>

                {/* â”€â”€ payment breakdown â”€â”€ */}
                <div className="my-2" style={{ fontSize: '10px' }}>
                    <div style={{ fontWeight: 700, marginBottom: '3px', letterSpacing: '0.5px', fontSize: '9px' }}>
                        PAYMENT DETAILS
                    </div>
                    {invoice.Payments && invoice.Payments.length > 0 ? (
                        invoice.Payments.map(p => (
                            <div key={p.Id} className="flex justify-between">
                                <span style={{ color: '#666' }}>
                                    {p.Method === 'Cash' ? 'ðŸ’µ' : p.Method === 'Bank' ? 'ðŸ¦' : 'ðŸ“±'} {p.Method}
                                </span>
                                <span style={{ fontWeight: 600 }}>{money(p.Amount)}</span>
                            </div>
                        ))
                    ) : (
                        <div style={{ color: '#999' }}>No payment recorded</div>
                    )}
                    <div style={{ fontSize: '9px', color: '#ccc', margin: '3px 0' }}>{dotDivider}</div>
                    <div className="flex justify-between" style={{ fontWeight: 700 }}>
                        <span>Paid</span>
                        <span>{money(invoice.PaidAmount)}</span>
                    </div>
                    {invoice.DueAmount > 0 && (
                        <div className="flex justify-between" style={{ fontWeight: 700, color: '#c00' }}>
                            <span>Due</span>
                            <span>{money(invoice.DueAmount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between mt-0.5" style={{ fontSize: '9px' }}>
                        <span style={{ color: '#888' }}>Status</span>
                        <span style={{
                            fontWeight: 700,
                            color: invoice.PaymentStatus === 'Paid' ? '#059669' :
                                invoice.PaymentStatus === 'Partial' ? '#d97706' : '#dc2626'
                        }}>
                            {invoice.PaymentStatus.toUpperCase()}
                        </span>
                    </div>
                </div>

                {/* â”€â”€ remarks â”€â”€ */}
                {invoice.Remarks && (
                    <>
                        <div style={{ fontSize: '9px', color: '#ccc' }}>{dotDivider}</div>
                        <div className="my-2" style={{ fontSize: '9px', color: '#666' }}>
                            <span style={{ fontWeight: 700 }}>Note: </span>
                            {invoice.Remarks}
                        </div>
                    </>
                )}

                <div style={{ fontSize: '9px', color: '#aaa', margin: '8px 0' }}>{doubleDivider}</div>

                {/* â”€â”€ footer â”€â”€ */}
                <div className="text-center" style={{ fontSize: '9px', color: '#999' }}>
                    <div style={{ marginBottom: '3px' }}>Thank you for shopping with us!</div>
                    <div style={{ marginBottom: '3px' }}>Goods once sold are not returnable</div>
                    <div style={{ marginBottom: '3px' }}>without a valid receipt.</div>
                    <div style={{ fontSize: '8px', color: '#bbb', marginTop: '6px' }}>
                        â˜… â˜… â˜… {SHOP_NAME} â˜… â˜… â˜…
                    </div>
                    <div style={{ fontSize: '8px', color: '#ccc', marginTop: '2px' }}>
                        Generated: {new Date().toLocaleString('en-GB')}
                    </div>
                </div>

                {/* â”€â”€ tear line â”€â”€ */}
                <div className="text-center mt-4" style={{ fontSize: '9px', color: '#ddd', letterSpacing: '2px' }}>
                    âœ‚ â”„â”„â”„â”„â”„â”„â”„â”„â”„â”„â”„â”„â”„â”„â”„â”„â”„â”„â”„â”„â”„â”„â”„â”„â”„â”„â”„â”„â”„â”„ âœ‚
                </div>
            </div>
        </div>
    );
}
