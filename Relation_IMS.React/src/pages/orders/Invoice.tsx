import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import Barcode from 'react-barcode';
import api from '../../services/api';
import { getTenantConfig } from '../../services/tenantTheme';
import { getTenant } from '../../services/authService';

/* ─────────── types ─────────── */
interface InvoiceItem {
    Id: number;
    ProductName: string;
    ProductCode?: string;
    CategoryName?: string;
    BrandName?: string;
    ColorName?: string;
    SizeName?: string;
    Quantity: number;
    UnitPrice: number;
    CostBD: number;
    CostRMB: number;
    Discount: number;
    Subtotal: number;
}

interface AggregatedItem {
    ProductName: string;
    ProductCode?: string;
    ColorName?: string;
    Quantity: number;
    UnitPrice: number;
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
    ShopNo?: number;
    ShopName?: string;
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

function aggregateItems(items: InvoiceItem[]): AggregatedItem[] {
    const grouped = new Map<string, AggregatedItem>();
    
    for (const item of items) {
        const key = `${item.ProductName}|${item.ColorName || ''}|${item.ProductCode || ''}`;
        
        if (grouped.has(key)) {
            const existing = grouped.get(key)!;
            existing.Quantity += item.Quantity;
            existing.Subtotal += item.Subtotal;
        } else {
            grouped.set(key, {
                ProductName: item.ProductName,
                ProductCode: item.ProductCode,
                ColorName: item.ColorName || undefined,
                Quantity: item.Quantity,
                UnitPrice: item.UnitPrice,
                Subtotal: item.Subtotal,
            });
        }
    }
    
    return Array.from(grouped.values());
}

/* ─────────── helpers ─────────── */
function formatDate(dateString: string) {
    if (!dateString || dateString.startsWith('0001-01-01')) return 'N/A';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(dateString: string) {
    if (!dateString || dateString.startsWith('0001-01-01')) return 'N/A';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        + '  ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function money(n: number) {
    return '৳' + n.toFixed(2);
}

/* ─────────── component ─────────── */
export default function InvoicePage() {
    const { id } = useParams<{ id: string }>();
    const [invoice, setInvoice] = useState<InvoiceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const tenantConfig = getTenantConfig(getTenant());
    const SHOP_NAME = tenantConfig.displayName;

    useEffect(() => {
        if (!id) return;
        const controller = new AbortController();
        setLoading(true);
        api.get(`/Invoice/${id}`, { signal: controller.signal })
            .then(res => setInvoice(res.data))
            .catch(err => {
                if (axios.isCancel(err)) return;
                console.error(err);
                setError(err.response?.status === 404 ? 'Order not found.' : 'Failed to load invoice.');
            })
            .finally(() => setLoading(false));
        return () => controller.abort();
    }, [id]);

    const handlePrint = () => window.print();

    /* ── loading ── */
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
                <div className="relative">
                    <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-primary"></div>
                    <span className="material-symbols-outlined absolute inset-0 flex items-center justify-center text-primary text-xl">receipt_long</span>
                </div>
                <p className="mt-4 text-gray-500 font-medium">Generating invoice…</p>
            </div>
        );
    }

    /* ── error ── */
    if (error || !invoice) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center max-w-md w-full mb-6">
                    <span className="material-symbols-outlined text-4xl text-red-500 mb-2">error</span>
                    <h2 className="text-xl font-bold text-red-800 mb-2">Oops!</h2>
                    <p className="text-red-600">{error || 'Invoice not found'}</p>
                </div>
                <Link to="/orders" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold hover:opacity-90 transition shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined">arrow_back</span>
                    Back to Orders
                </Link>
            </div>
        );
    }

    const orderId = `ORD-${String(invoice.Id).padStart(6, '0')}`;
    const shopLabel = invoice.ShopName
        ? `${SHOP_NAME} — ${invoice.ShopName}`
        : invoice.ShopNo === 0 || !invoice.ShopNo
            ? `${SHOP_NAME} — HQ`
            : SHOP_NAME;

    const aggregatedItems = invoice.Items ? aggregateItems(invoice.Items) : [];

    return (
        <>
            {/* ── Global print styles ── */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
                @media print {
                    body { margin: 0; padding: 0; background: #fff; }
                    .no-print { display: none !important; }
                    .a4-page {
                        margin: 0 !important;
                        box-shadow: none !important;
                        border-radius: 0 !important;
                        padding: 15mm !important;
                        min-height: 100vh !important;
                    }
                    .invoice-shell { background: #fff !important; padding: 0 !important; }
                }
            `}</style>

            {/* ── Screen: outer shell ── */}
            <div
                className="invoice-shell min-h-screen py-8 px-4"
                style={{ background: '#dee5de', fontFamily: "'Manrope', sans-serif" }}
            >
                {/* ── Action bar (screen only) ── */}
                <div className="no-print max-w-[210mm] mx-auto mb-5 flex items-center justify-between gap-3">
                    <Link
                        to={`/orders/${invoice.Id}`}
                        className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors font-semibold text-sm"
                    >
                        <span className="material-symbols-outlined text-lg">arrow_back</span>
                        Back to Order #{invoice.Id}
                    </Link>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:opacity-90 transition shadow-lg shadow-primary/30 active:scale-95"
                    >
                        <span className="material-symbols-outlined text-lg">print</span>
                        Print Invoice
                    </button>
                </div>

                {/* ── A4 Page ── */}
                <div
                    className="a4-page mx-auto bg-white rounded-xl"
                    style={{
                        width: '210mm',
                        minHeight: '297mm',
                        padding: '20mm',
                        boxSizing: 'border-box',
                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                        color: '#0e1b12',
                    }}
                >
                    {/* ════════════ HEADER ════════════ */}
                    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                        {/* Left: Brand */}
                        <div>
                            <h1 style={{ fontWeight: 800, fontSize: '32px', letterSpacing: '-0.5px', margin: 0, lineHeight: 1.1, color: '#0e1b12' }}>
                                {SHOP_NAME}
                            </h1>
                            <p style={{ color: '#3c4a3b', fontWeight: 600, fontSize: '15px', margin: '4px 0 4px' }}>{shopLabel}</p>
                            <p style={{ color: '#727971', fontSize: '12px', margin: 0 }}>
                                {formatDate(invoice.OrderDate)}
                                {invoice.SoldBy && <span> &nbsp;·&nbsp; Sold by: {invoice.SoldBy.Name}</span>}
                            </p>
                        </div>

                        {/* Right: Order barcode box */}
                        <div style={{
                            border: '1px solid #c2c9bf',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            textAlign: 'center',
                            background: '#f0f3f0',
                            minWidth: '130px',
                        }}>
                            <div style={{ color: '#0e1b12' }}>
                                <Barcode value={orderId} height={36} width={1.5} fontSize={10} />
                            </div>
                        </div>
                    </header>

                    {/* ── Divider ── */}
                    <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, #c2c9bf, transparent)', margin: '0 0 28px' }} />

                    {/* ════════════ CUSTOMER INFO ════════════ */}
                    {invoice.Customer && (
                        <section style={{
                            border: '1px solid #c2c9bf',
                            borderRadius: '12px',
                            padding: '20px 24px',
                            marginBottom: '28px',
                            background: '#f6f8f6',
                            position: 'relative',
                            overflow: 'hidden',
                        }}>
                            <h2 style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#17cf54', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '14px' }} className="material-symbols-outlined">person</span>
                                Customer Details
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 28px' }}>
                                <Field label="Customer Name" value={invoice.Customer.Name} bold />
                                {invoice.Customer.ShopName && <Field label="Shop Name" value={invoice.Customer.ShopName} bold />}
                                {invoice.Customer.Address && <Field label="Customer Address" value={invoice.Customer.Address} />}
                                {invoice.Customer.ShopAddress && <Field label="Shop Address" value={invoice.Customer.ShopAddress} />}
                                {invoice.Customer.Phone && <Field label="Mobile Number" value={invoice.Customer.Phone} />}
                            </div>
                        </section>
                    )}

                    {/* ════════════ ITEMS TABLE ════════════ */}
                    <section style={{ marginBottom: '28px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #dee5de', background: '#eaf0ea' }}>
                                    {['#', 'Product', 'Barcode', 'Unit Price', 'Qty', 'Total'].map((h, i) => (
                                        <th
                                            key={h}
                                            style={{
                                                padding: '10px 12px',
                                                fontWeight: 700,
                                                fontSize: '10px',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.8px',
                                                color: '#3c4a3b',
                                                textAlign: i >= 3 ? 'right' : i === 0 ? 'center' : 'left',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {aggregatedItems.length > 0 ? (
                                    aggregatedItems.map((item, idx) => (
                                        <tr
                                            key={`${item.ProductName}-${item.ColorName || 'no-color'}-${idx}`}
                                            style={{
                                                borderBottom: '1px solid #eaf0ea',
                                                background: idx % 2 === 1 ? '#f6f8f6' : '#fff',
                                            }}
                                        >
                                            <td style={{ padding: '12px', textAlign: 'center', color: '#727971', fontWeight: 600, fontSize: '11px', whiteSpace: 'nowrap' }}>
                                                {idx + 1}
                                            </td>
                                            <td style={{ padding: '12px', fontWeight: 700, color: '#0e1b12', maxWidth: '160px' }}>
                                                {item.ProductName}
                                                {item.ColorName && <span style={{ fontWeight: 500, color: '#727971' }}> ({item.ColorName})</span>}
                                            </td>
                                            <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '11px', color: '#727971', whiteSpace: 'nowrap' }}>
                                                {item.ProductCode || '—'}
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'right', color: '#3c4a3b', whiteSpace: 'nowrap' }}>
                                                {money(item.UnitPrice)}
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                {item.Quantity}
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: '#0e1b12', whiteSpace: 'nowrap' }}>
                                                {money(item.Subtotal)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#727971', fontSize: '12px' }}>
                                            No items found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </section>

                    {/* ════════════ PAYMENT SUMMARY ════════════ */}
                    <section style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '48px' }}>
                        <div style={{
                            minWidth: '280px',
                            border: '1px solid #c2c9bf',
                            borderRadius: '12px',
                            padding: '20px 24px',
                            background: '#f0f3f0',
                        }}>
                            <PayRow label="Subtotal" value={money(invoice.TotalAmount)} />
                            {invoice.Discount > 0 && (
                                <PayRow
                                    label="Discount"
                                    value={`-${money(invoice.Discount)}`}
                                    valueColor="#236c31"
                                    icon="sell"
                                />
                            )}

                            {/* Net amount separator */}
                            <div style={{ borderTop: '2px solid #c2c9bf', margin: '8px 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0 12px' }}>
                                <span style={{ fontWeight: 800, fontSize: '15px', color: '#0e1b12' }}>Net Amount</span>
                                <span style={{ fontWeight: 800, fontSize: '17px', color: '#17cf54' }}>{money(invoice.NetAmount)}</span>
                            </div>

                            {/* Payment methods */}
                            {invoice.Payments && invoice.Payments.length > 0 && (
                                <div style={{ borderTop: '1px solid #c2c9bf', paddingTop: '10px', marginTop: '4px' }}>
                                    {invoice.Payments.map(p => (
                                        <PayRow
                                            key={p.Id}
                                            label={`${p.Method === 'Cash' ? '💵' : p.Method === 'Bank' ? '🏦' : '📱'} ${p.Method}`}
                                            value={money(p.Amount)}
                                            small
                                        />
                                    ))}
                                </div>
                            )}

                            <PayRow label="Paid Amount" value={money(invoice.PaidAmount)} />

                            {invoice.DueAmount > 0 && (
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginTop: '8px',
                                    padding: '10px 12px',
                                    background: '#ffdad6',
                                    borderRadius: '8px',
                                }}>
                                    <span style={{ fontWeight: 800, color: '#ba1a1a', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span style={{ fontSize: '14px' }} className="material-symbols-outlined">warning</span>
                                        Due Amount
                                    </span>
                                    <span style={{ fontWeight: 800, color: '#ba1a1a', fontSize: '14px' }}>{money(invoice.DueAmount)}</span>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* ── Remarks ── */}
                    {invoice.Remarks && (
                        <div style={{ marginBottom: '24px', padding: '12px 16px', background: '#eaf0ea', borderRadius: '8px', fontSize: '12px', color: '#3c4a3b', borderLeft: '3px solid #17cf54' }}>
                            <strong>Note:</strong> {invoice.Remarks}
                        </div>
                    )}

                    {/* ════════════ FOOTER ════════════ */}
                    <footer style={{ borderTop: '1px solid #c2c9bf', paddingTop: '20px', textAlign: 'center' }}>
                        <p style={{ fontWeight: 800, color: '#17cf54', fontSize: '13px', margin: '0 0 4px' }}>
                            Thank you for shopping with {SHOP_NAME}!
                        </p>
                        <p style={{ fontSize: '11px', color: '#727971', margin: 0 }}>
                            Items can be returned within 14 days with original receipt and tags attached.
                        </p>
                    </footer>
                </div>
            </div>
        </>
    );
}

/* ─────────── small layout helpers ─────────── */
function Field({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
    return (
        <div>
            <p style={{ fontSize: '10px', color: '#727971', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>{label}</p>
            <p style={{ fontSize: '13px', fontWeight: bold ? 700 : 500, color: '#0e1b12', margin: 0 }}>{value}</p>
        </div>
    );
}

function PayRow({ label, value, valueColor, icon, small }: {
    label: string; value: string; valueColor?: string; icon?: string; small?: boolean
}) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: small ? '3px 0' : '6px 0', borderBottom: '1px solid #eaf0ea' }}>
            <span style={{ color: '#3c4a3b', fontSize: small ? '11px' : '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {icon && <span style={{ fontSize: '13px' }} className="material-symbols-outlined">{icon}</span>}
                {label}
            </span>
            <span style={{ fontWeight: 700, fontSize: small ? '11px' : '12px', color: valueColor ?? '#0e1b12' }}>{value}</span>
        </div>
    );
}
