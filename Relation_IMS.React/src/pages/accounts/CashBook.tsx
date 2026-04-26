import { useState, useEffect, useMemo } from 'react';
import CashBookHeader from '../../components/accounts/CashBookHeader';
import CashBookSummaryCards from '../../components/accounts/CashBookSummaryCards';
import CashBookTable from '../../components/accounts/CashBookTable';
import CashBookFooter from '../../components/accounts/CashBookFooter';
import NewCashBookEntryModal from '../../components/accounts/NewCashBookEntryModal';
import CashTransferModal from '../../components/accounts/CashTransferModal';
import {
    getCashBookEntries,
    getCashBookSummary,
    createManualEntry,
    transferToMotherShop,
    exportCashBookPdf,
    deleteCashBookEntry,
    editCashBookEntry
} from '../../services/cashBookService';
import type {
    CashBookEntryResponse,
    CashBookSummary,
    CreateManualEntryDTO,
    CreateCashTransferDTO
} from '../../services/cashBookService';
import { useAuth } from '../../context/AuthContext';
import { getAllInventories } from '../../services/InventoryService';
import type { Inventory } from '../../types';

// ──────────────────────────── Date helpers ────────────────────────────

const toYMD = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

/** Compute startDate/endDate ISO strings from Y/M/D filter state */
const computeDateRange = (
    year: number | undefined,
    month: number | undefined,  // 1-12 or undefined
    day: number | undefined
): { startDate: string | undefined; endDate: string | undefined } => {
    if (year === undefined) return { startDate: undefined, endDate: undefined };

    const mm = month ? String(month).padStart(2, '0') : undefined;
    const dd = day ? String(day).padStart(2, '0') : undefined;

    if (!mm) {
        // Whole year
        return { startDate: `${year}-01-01`, endDate: `${year}-12-31` };
    }
    if (!dd) {
        // Whole month
        const lastDay = new Date(year, month!, 0).getDate();
        return {
            startDate: `${year}-${mm}-01`,
            endDate: `${year}-${mm}-${String(lastDay).padStart(2, '0')}`
        };
    }
    // Specific day
    const d = `${year}-${mm}-${dd}`;
    return { startDate: d, endDate: d };
};

// ──────────────────────────── Component ────────────────────────────

const now = new Date();

const CashBook = () => {
    const { user } = useAuth();
    const isOwner = user?.Roles?.includes('Owner') ?? false;
    const userShopNo = user?.ShopNo;

    // Inventories (shops) list — only fetched for owner
    const [inventories, setInventories] = useState<Inventory[]>([]);

    // Shop filter: undefined = all shops (owner only), number = specific shop
    const [selectedShopNo, setSelectedShopNo] = useState<number | undefined>(
        isOwner ? undefined : userShopNo
    );

    // Date — default to today
    const [selectedDate, setSelectedDate] = useState<string>(toYMD(now));

    const [entries, setEntries] = useState<CashBookEntryResponse[]>([]);
    const [summary, setSummary] = useState<CashBookSummary>({
        OpeningBalance: 0,
        TotalCashIn: 0,
        TotalCashOut: 0,
        ClosingBalance: 0,
        EntryCount: 0,
        PeriodLabel: 'Today'
    });

    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modals
    const [isNewEntryModalOpen, setIsNewEntryModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<CashBookEntryResponse | null>(null);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

    // Fetch inventories for owner shop selector
    useEffect(() => {
        if (!isOwner) return;
        const controller = new AbortController();
        getAllInventories({ signal: controller.signal })
            .then(data => setInventories(data))
            .catch(() => {});
        return () => controller.abort();
    }, [isOwner]);

    const loadData = async (signal?: AbortSignal) => {
        setIsLoading(true);
        try {
            const summaryShopNo = selectedShopNo ?? (isOwner ? 0 : userShopNo ?? 0);
            
            // Format date for PostgreSQL timestamp with time zone (requires UTC kind)
            const dateQueryParam = selectedDate ? `${selectedDate}T00:00:00Z` : undefined;

            const [entriesData, summaryData] = await Promise.all([
                getCashBookEntries({
                    shopNo: selectedShopNo,
                    startDate: dateQueryParam,
                    endDate: dateQueryParam,
                    search: searchQuery,
                }, { signal }),
                getCashBookSummary({
                    shopNo: isOwner && selectedShopNo === undefined ? undefined : summaryShopNo,
                    startDate: dateQueryParam,
                    endDate: dateQueryParam,
                }, { signal })
            ]);

            setEntries(entriesData);
            setSummary(summaryData);
        } catch (error: any) {
            import('axios').then(axios => {
                if (axios.default.isCancel(error)) return;
                console.error('Failed to load cashbook data:', error);
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Debounce search; immediate reload on other filter changes
    useEffect(() => {
        const controller = new AbortController();
        const delay = searchQuery ? 300 : 0;
        const timer = setTimeout(() => loadData(controller.signal), delay);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedShopNo, selectedDate, searchQuery]);

    // ── Date preset handlers ──
    const applyPreset = (preset: 'today' | 'yesterday') => {
        const n = new Date();
        if (preset === 'today') {
            setSelectedDate(toYMD(n));
        } else if (preset === 'yesterday') {
            const y = new Date(n);
            y.setDate(y.getDate() - 1);
            setSelectedDate(toYMD(y));
        }
    };

    // ── Derived totals ──
    const viewTotals = useMemo(() => {
        const t = entries.reduce(
            (acc, e) => {
                acc.cashIn += e.CashIn || 0;
                acc.cashOut += e.CashOut || 0;
                return acc;
            },
            { cashIn: 0, cashOut: 0, closingBalance: 0 }
        );
        t.closingBalance = summary.ClosingBalance;
        return t;
    }, [entries, summary.ClosingBalance]);

    // Transfer is allowed if:
    // 1. Not an owner (standard staff with shopNo > 0)
    // 2. Owner, AND they have explicitly selected a specific shop (> 0) from the dropdown
    const canTransfer = (!isOwner && (userShopNo ?? 0) > 0) || (isOwner && selectedShopNo !== undefined && selectedShopNo > 0);
    const transferShopNo = isOwner ? selectedShopNo ?? 0 : userShopNo ?? 0;

    return (
        <div className="p-4 sm:p-6 lg:p-10 pb-8 sm:pb-10 lg:pb-12 bg-white dark:bg-transparent min-h-screen">
            <CashBookHeader
                onNewEntry={() => setIsNewEntryModalOpen(true)}
                onTransferToHQ={canTransfer ? () => setIsTransferModalOpen(true) : undefined}
                onExportPDF={handleExportPDF}
            />

            <CashBookSummaryCards summary={summary} />

            <CashBookTable
                entries={entries}
                totals={viewTotals}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                isLoading={isLoading}
                // Shop selector (owner only)
                isOwner={isOwner}
                inventories={inventories}
                selectedShopNo={selectedShopNo}
                onShopChange={isOwner ? (v) => setSelectedShopNo(v) : undefined}
                // Date filter
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                onApplyPreset={applyPreset}
                onDeleteEntry={async (id) => {
                    if (window.confirm('Are you sure you want to delete this cashbook entry? This will permanently delete it and recalculate all running balances.')) {
                        try {
                            await deleteCashBookEntry(id);
                            await loadData();
                        } catch (error) {
                            console.error('Failed to delete entry:', error);
                            alert('Failed to delete entry. You can only delete manual entries.');
                        }
                    }
                }}
                onEditEntry={(entry) => setEditingEntry(entry)}
            />

            <CashBookFooter />

            <NewCashBookEntryModal
                isOpen={isNewEntryModalOpen || !!editingEntry}
                onClose={() => {
                    setIsNewEntryModalOpen(false);
                    setEditingEntry(null);
                }}
                onSubmit={handleSaveEntry}
                initialData={editingEntry ? {
                    TransactionType: editingEntry.TransactionType,
                    Description: editingEntry.Description || '',
                    Amount: (editingEntry.CashIn || editingEntry.CashOut || 0).toString(),
                    Type: editingEntry.CashIn ? 'CashIn' : 'CashOut',
                    Note: editingEntry.Note || ''
                } : null}
            />

            {canTransfer && (
                <CashTransferModal
                    isOpen={isTransferModalOpen}
                    onClose={() => setIsTransferModalOpen(false)}
                    onSubmit={handleTransfer}
                    shopNo={transferShopNo}
                />
            )}
        </div>
    );

    async function handleSaveEntry(data: CreateManualEntryDTO) {
        // Use the selected filter date, but append current local time
        const nowLocal = new Date();
        const timePart = [
            String(nowLocal.getHours()).padStart(2, '0'),
            String(nowLocal.getMinutes()).padStart(2, '0'),
            String(nowLocal.getSeconds()).padStart(2, '0')
        ].join(':');
        
        data.TransactionDate = `${selectedDate}T${timePart}Z`;
        
        if (editingEntry) {
            await editCashBookEntry(editingEntry.Id, data);
        } else {
            await createManualEntry(data, selectedShopNo ?? userShopNo ?? 0);
        }
        await loadData();
    }

    async function handleTransfer(data: CreateCashTransferDTO) {
        // Use the selected filter date, but append current local time
        const nowLocal = new Date();
        const timePart = [
            String(nowLocal.getHours()).padStart(2, '0'),
            String(nowLocal.getMinutes()).padStart(2, '0'),
            String(nowLocal.getSeconds()).padStart(2, '0')
        ].join(':');
        
        data.TransactionDate = `${selectedDate}T${timePart}Z`;

        await transferToMotherShop(data, transferShopNo);
        await loadData();
    }

    async function handleExportPDF() {
        if (!selectedDate) return;
        try {
            const dateQueryParam = `${selectedDate}T00:00:00Z`;
            let shopName = 'All Shops';
            if (selectedShopNo === 0) shopName = 'HQ / Mother Shop';
            else if (selectedShopNo && selectedShopNo > 0) {
                shopName = inventories.find(i => i.Id === selectedShopNo)?.Name ?? `Shop #${selectedShopNo}`;
            } else if (!isOwner && userShopNo) {
                shopName = `Shop #${userShopNo}`; // Or get it from context if available
            }

            await exportCashBookPdf(dateQueryParam, selectedShopNo, shopName);
        } catch (error) {
            console.error('Failed to export PDF:', error);
            alert('Failed to export PDF. Please try again.');
        }
    }
};

export default CashBook;
