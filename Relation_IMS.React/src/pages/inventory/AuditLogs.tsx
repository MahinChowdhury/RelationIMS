import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { getAuditLogs, getAuditSummary } from '../../services/AuditLogService';
import type { AuditLogResponse, AuditSummary } from '../../types/auditLog';

const CATEGORY_OPTIONS = ['All', 'Sales', 'Products', 'Inventory', 'Customers', 'Configuration', 'Security'];

const categoryStyles: Record<string, string> = {
    Sales: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    Products: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
    Inventory: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
    Customers: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    Configuration: 'bg-stone-100 text-stone-700 dark:bg-stone-900/30 dark:text-stone-400',
    Security: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
    General: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

const typeStyles: Record<string, string> = {
    Create: 'bg-primary/10 text-primary border-primary/20',
    Update: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
    Delete: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
};

const avatarColors: Record<string, string> = {
    Owner: 'bg-primary text-white',
    'Head Manager': 'bg-indigo-600 text-white',
    'Shop Manager': 'bg-teal-600 text-white',
    Salesman: 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100',
    System: 'bg-gray-900 text-white dark:bg-gray-700',
    User: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

const AuditLogs = () => {
    const { t } = useLanguage();
    const [data, setData] = useState<AuditLogResponse | null>(null);
    const [summary, setSummary] = useState<AuditSummary | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [loading, setLoading] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    // Modal state
    const [selectedLog, setSelectedLog] = useState<{ old: any; new: any; affected: any; description: string } | null>(null);

    // Reset page on filter change
    useEffect(() => {
        setPage(1);
    }, [searchTerm, dateFrom, dateTo, actionFilter, categoryFilter]);

    // Fetch logs
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLogs();
        }, 400);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, searchTerm, dateFrom, dateTo, actionFilter, categoryFilter]);

    // Fetch summary on mount
    useEffect(() => {
        getAuditSummary()
            .then(setSummary)
            .catch((err) => console.error('Failed to load audit summary', err));
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await getAuditLogs({
                pageNumber: page,
                pageSize,
                search: searchTerm || undefined,
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
                actionType: actionFilter || undefined,
                category: categoryFilter || undefined,
            });
            setData(res);
        } catch (error) {
            console.error('Failed to load audit logs', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (oldVal: string | null, newVal: string | null, affected: string | null, description: string) => {
        try {
            const parsedOld = oldVal ? JSON.parse(oldVal) : null;
            const parsedNew = newVal ? JSON.parse(newVal) : null;
            const parsedAffected = affected ? JSON.parse(affected) : null;
            setSelectedLog({ old: parsedOld, new: parsedNew, affected: parsedAffected, description });
        } catch {
            /* fallback */
        }
    };

    const getInitials = (name: string | null) => {
        if (!name || name === 'System') return 'SY';
        const parts = name.trim().split(' ');
        return parts
            .map((p) => p.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const formatTimeAgo = (dateStr: string | null) => {
        if (!dateStr) return '—';
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
        const days = Math.floor(hrs / 24);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    };

    const records = data?.Records || [];
    const totalPages = data?.TotalPages || 0;
    const totalCount = data?.TotalCount || 0;

    const renderPageButtons = () => {
        const buttons: (number | '...')[] = [];
        const maxButtons = 5;
        if (totalPages <= maxButtons) {
            for (let i = 1; i <= totalPages; i++) buttons.push(i);
        } else {
            buttons.push(1);
            if (page > 3) buttons.push('...');
            const start = Math.max(2, page - 1);
            const end = Math.min(totalPages - 1, page + 1);
            for (let i = start; i <= end; i++) buttons.push(i);
            if (page < totalPages - 2) buttons.push('...');
            buttons.push(totalPages);
        }
        return buttons;
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            {/* Background */}
            <div className="fixed inset-0 bg-pattern -z-20 pointer-events-none"></div>
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-3xl"></div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <main className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-10 py-6 md:py-10">
                    {/* Header */}
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8 md:mb-10">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-primary text-sm font-medium">
                                <span className="material-symbols-outlined text-[20px]">plagiarism</span>
                                <Link to="/inventory">{t.inventory.title || 'Inventory'}</Link>
                                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                                <span>{t.auditLogs?.title || 'Audit Logs'}</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-[#0e1b12] dark:text-white tracking-tight">
                                {t.auditLogs?.title || 'System Audit Logs'}
                            </h1>
                            <p className="text-secondary text-sm md:text-base font-medium max-w-2xl">
                                {t.auditLogs?.subtitle || 'Detailed record of all administrative and inventory activities.'}
                            </p>
                        </div>
                    </header>

                    {/* Summary Cards */}
                    <section className="grid grid-cols-12 gap-4 md:gap-6 mb-8 md:mb-12">
                        {/* Total Events */}
                        <div className="col-span-12 md:col-span-5 bg-white dark:bg-[var(--color-surface-dark-card)] rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 flex flex-col justify-between shadow-sm border border-[#e7f3eb]/60 dark:border-[var(--color-surface-dark-border)]">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-3 md:mb-4 block">
                                    {t.auditLogs?.totalEventsLabel || 'Activity Log'}
                                </span>
                                <h3 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-[#0e1b12] dark:text-white">
                                    {summary ? summary.TotalCount.toLocaleString() : '—'}
                                </h3>
                                <p className="text-secondary mt-1 md:mt-2 font-medium text-sm">
                                    {t.auditLogs?.totalEventsRecorded || 'Total Events Recorded'}
                                </p>
                            </div>
                            {summary && (
                                <div className="mt-6 md:mt-8 flex items-center gap-2 text-primary font-bold text-sm">
                                    <span className="material-symbols-outlined text-[1.2rem]">
                                        {summary.TrendPercentage >= 0 ? 'trending_up' : 'trending_down'}
                                    </span>
                                    <span>
                                        {Math.abs(summary.TrendPercentage)}% {summary.TrendPercentage >= 0 ? (t.auditLogs?.increaseFromYesterday || 'increase from yesterday') : (t.auditLogs?.decreaseFromYesterday || 'decrease from yesterday')}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Today Count */}
                        <div className="col-span-6 md:col-span-3 bg-[#f0f7f2] dark:bg-[var(--color-surface-dark-card)] rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 flex flex-col justify-between border border-[#e7f3eb]/40 dark:border-[var(--color-surface-dark-border)]">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary mb-3 md:mb-4 block">
                                    {t.auditLogs?.todayActivity || 'Today'}
                                </span>
                                <h3 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-[#0e1b12] dark:text-white">
                                    {summary ? summary.TodayCount.toLocaleString() : '—'}
                                </h3>
                            </div>
                            <div className="mt-6 md:mt-8">
                                <div className="flex items-center gap-2 text-primary font-bold text-sm mb-1">
                                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                                    <span>{t.auditLogs?.allNodesActive || 'All systems active'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Last Entry */}
                        <div className="col-span-6 md:col-span-4 bg-primary text-white rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 shadow-xl shadow-primary/20 relative overflow-hidden">
                            <div className="relative z-10">
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 mb-3 md:mb-4 block">
                                    {t.auditLogs?.liveMonitoring || 'Live Monitoring'}
                                </span>
                                <h3 className="text-xl md:text-2xl font-bold tracking-tight">
                                    {summary ? formatTimeAgo(summary.LastEntryTime) : '—'}
                                </h3>
                                <p className="opacity-90 mt-1 font-medium italic text-sm">
                                    {t.auditLogs?.lastLogEntry || 'Last log entry processed'}
                                </p>
                            </div>
                            <div className="absolute -right-8 -bottom-8 opacity-20 pointer-events-none">
                                <span className="material-symbols-outlined text-[8rem] md:text-[10rem]">pulse_alert</span>
                            </div>
                        </div>
                    </section>

                    {/* Search & Filter Bar */}
                    <section className="bg-white/70 dark:bg-[var(--color-surface-dark-card)] backdrop-blur-sm rounded-2xl p-3 md:p-4 mb-6 md:mb-8 flex flex-wrap items-center gap-3 md:gap-4 border border-[#e7f3eb]/60 dark:border-[var(--color-surface-dark-border)] shadow-sm">
                        <div className="flex-1 relative min-w-[200px] md:min-w-[300px]">
                            <span className="material-symbols-outlined absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-secondary">search</span>
                            <input
                                className="w-full bg-[#f8fcf9] dark:bg-white/5 border-none rounded-xl pl-10 md:pl-12 pr-4 py-2.5 md:py-3 focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium text-[#0e1b12] dark:text-white placeholder-gray-400"
                                placeholder={t.auditLogs?.searchPlaceholder || 'Search by user, action or keyword...'}
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="hidden md:block h-10 w-px bg-gray-200 dark:bg-white/10"></div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <select
                                className="bg-[#f8fcf9] dark:bg-white/5 border-none rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-sm font-medium text-[#0e1b12] dark:text-white focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                            >
                                {CATEGORY_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt === 'All' ? '' : opt}>
                                        {opt === 'All' ? (t.auditLogs?.allCategories || 'All Categories') : opt}
                                    </option>
                                ))}
                            </select>
                            <select
                                className="bg-[#f8fcf9] dark:bg-white/5 border-none rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-sm font-medium text-[#0e1b12] dark:text-white focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                                value={actionFilter}
                                onChange={(e) => setActionFilter(e.target.value)}
                            >
                                <option value="">{t.auditLogs?.allActions || 'All Actions'}</option>
                                <option value="Create">Create</option>
                                <option value="Update">Update</option>
                                <option value="Delete">Delete</option>
                            </select>
                            <div className="flex items-center gap-1 bg-[#f8fcf9] dark:bg-white/5 rounded-xl px-3 md:px-4 py-1.5 md:py-2">
                                <span className="material-symbols-outlined text-[1.2rem] text-secondary">calendar_today</span>
                                <input
                                    type="date"
                                    className="bg-transparent border-none text-sm font-medium text-[#0e1b12] dark:text-white focus:ring-0 p-0 w-[110px]"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    title="From"
                                />
                                <span className="text-secondary text-xs mx-1">—</span>
                                <input
                                    type="date"
                                    className="bg-transparent border-none text-sm font-medium text-[#0e1b12] dark:text-white focus:ring-0 p-0 w-[110px]"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    title="To"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Audit Table */}
                    <div className="bg-white dark:bg-[var(--color-surface-dark-card)] rounded-[1.5rem] md:rounded-[2rem] border border-[#e7f3eb]/60 dark:border-[var(--color-surface-dark-border)] overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#f8fcf9]/70 dark:bg-white/5 text-secondary text-[10px] font-bold uppercase tracking-[0.15em] border-b border-[#e7f3eb]/60 dark:border-[var(--color-surface-dark-border)]">
                                        <th className="px-4 md:px-6 py-4 md:py-5 w-28">{t.auditLogs?.timestamp || 'Timestamp'}</th>
                                        <th className="px-4 md:px-6 py-4 md:py-5">{t.auditLogs?.userEntity || 'User / Entity'}</th>
                                        <th className="px-4 md:px-6 py-4 md:py-5">{t.auditLogs?.categoryLabel || 'Category'}</th>
                                        <th className="px-4 md:px-6 py-4 md:py-5">{t.auditLogs?.actionPerformed || 'Action Performed'}</th>
                                        <th className="px-4 md:px-6 py-4 md:py-5">{t.auditLogs?.operationType || 'Operation'}</th>
                                        <th className="px-4 md:px-6 py-4 md:py-5">{t.auditLogs?.activityDetails || 'Activity Details'}</th>
                                        <th className="px-4 md:px-6 py-4 md:py-5 text-center w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e7f3eb]/40 dark:divide-[var(--color-surface-dark-border)]">
                                    {loading && records.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="py-16 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
                                                    <span className="text-sm text-secondary">{t.common.loading || 'Loading...'}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    {!loading && records.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="py-16 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600">plagiarism</span>
                                                    <span className="text-sm text-secondary">{t.common.noData || 'No data found.'}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    {records.map((log) => (
                                        <tr
                                            key={log.Id}
                                            className="group hover:bg-primary/[0.03] dark:hover:bg-white/[0.03] transition-all"
                                        >
                                            {/* Timestamp */}
                                            <td className="px-4 md:px-6 py-4 md:py-5 text-sm whitespace-nowrap tabular-nums font-medium">
                                                <div className="text-[#0e1b12] text-white font-bold">
                                                    {new Date(log.DateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                </div>
                                                <div className="text-[11px] text-white mt-0.5">
                                                    {new Date(log.DateTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                            </td>

                                            {/* User / Entity */}
                                            <td className="px-4 md:px-6 py-4 md:py-5">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${avatarColors[log.UserRole || 'User'] || avatarColors.User}`}
                                                    >
                                                        {getInitials(log.UserName)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-[#0e1b12] dark:text-white leading-none">
                                                            {log.UserName || 'System'}
                                                        </p>
                                                        <p className="text-[11px] text-secondary mt-1">
                                                            Role: {log.UserRole || 'System'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Category */}
                                            <td className="px-4 md:px-6 py-4 md:py-5">
                                                <span
                                                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${categoryStyles[log.Category] || categoryStyles.General}`}
                                                >
                                                    {log.Category}
                                                </span>
                                            </td>

                                            {/* Action Performed */}
                                            <td className="px-4 md:px-6 py-4 md:py-5">
                                                <p className="text-sm font-bold text-[#0e1b12] dark:text-white">{log.ActionLabel}</p>
                                            </td>

                                            {/* Operation Type */}
                                            <td className="px-4 md:px-6 py-4 md:py-5">
                                                <span
                                                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${typeStyles[log.Type] || 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'}`}
                                                >
                                                    {log.Type}
                                                </span>
                                            </td>

                                            {/* Activity Details */}
                                            <td className="px-4 md:px-6 py-4 md:py-5 min-w-[200px] max-w-[350px]">
                                                <p className="text-sm text-secondary leading-relaxed break-words whitespace-normal">
                                                    {log.Description}
                                                </p>
                                            </td>

                                            {/* View Details */}
                                            <td className="px-4 md:px-6 py-4 md:py-5 text-center">
                                                {(log.OldValues || log.NewValues) ? (
                                                    <button
                                                        onClick={() => handleViewDetails(log.OldValues, log.NewValues, log.AffectedColumns, log.Description)}
                                                        className="w-8 h-8 rounded-full bg-[#f8fcf9] dark:bg-white/5 text-secondary hover:bg-primary/10 hover:text-primary transition-colors flex items-center justify-center border border-[#e7f3eb] dark:border-white/10 mx-auto"
                                                        title="View Details"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-300 dark:text-gray-600">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 0 && (
                            <div className="px-4 md:px-8 py-4 md:py-5 flex items-center justify-between bg-[#f8fcf9]/50 dark:bg-white/[0.02] border-t border-[#e7f3eb]/40 dark:border-[var(--color-surface-dark-border)]">
                                <p className="text-xs font-medium text-secondary">
                                    {t.auditLogs?.showingResults
                                        ? t.auditLogs.showingResults
                                            .replace('{from}', String((page - 1) * pageSize + 1))
                                            .replace('{to}', String(Math.min(page * pageSize, totalCount)))
                                            .replace('{total}', totalCount.toLocaleString())
                                        : `Showing ${(page - 1) * pageSize + 1} to ${Math.min(page * pageSize, totalCount)} of ${totalCount.toLocaleString()} results`}
                                </p>
                                <div className="flex gap-1.5">
                                    <button
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page <= 1}
                                        className="w-8 h-8 rounded-lg border border-[#e7f3eb] dark:border-white/10 flex items-center justify-center text-secondary hover:bg-white dark:hover:bg-white/5 transition-colors disabled:opacity-30"
                                    >
                                        <span className="material-symbols-outlined text-[1rem]">chevron_left</span>
                                    </button>
                                    {renderPageButtons().map((btn, i) =>
                                        btn === '...' ? (
                                            <span key={`dot-${i}`} className="text-secondary pt-1.5 px-1 text-xs">
                                                ...
                                            </span>
                                        ) : (
                                            <button
                                                key={btn}
                                                onClick={() => setPage(btn as number)}
                                                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-colors ${page === btn
                                                        ? 'bg-primary text-white shadow-sm'
                                                        : 'border border-[#e7f3eb] dark:border-white/10 text-[#0e1b12] dark:text-gray-300 hover:bg-white dark:hover:bg-white/5'
                                                    }`}
                                            >
                                                {btn}
                                            </button>
                                        )
                                    )}
                                    <button
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={page >= totalPages}
                                        className="w-8 h-8 rounded-lg border border-[#e7f3eb] dark:border-white/10 flex items-center justify-center text-secondary hover:bg-white dark:hover:bg-white/5 transition-colors disabled:opacity-30"
                                    >
                                        <span className="material-symbols-outlined text-[1rem]">chevron_right</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Detail Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[var(--color-surface-dark-card)] rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-[#e7f3eb] dark:border-[var(--color-surface-dark-border)]">
                        <div className="flex items-center justify-between p-6 border-b border-[#e7f3eb] dark:border-[var(--color-surface-dark-border)]">
                            <h2 className="text-xl font-bold text-[#0e1b12] dark:text-white">
                                {t.auditLogs?.details || 'Audit Details'}
                            </h2>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center text-gray-500 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="flex flex-col gap-6 text-sm text-left">
                                {selectedLog.description && (
                                    <div className="bg-[#f8fcf9] dark:bg-white/5 p-4 rounded-xl border border-[#e7f3eb] dark:border-[var(--color-surface-dark-border)]">
                                        <h4 className="font-bold text-primary mb-1 text-sm">{t.auditLogs?.activityDetails || 'Activity Details'}</h4>
                                        <p className="text-[#0e1b12] dark:text-gray-300 text-sm leading-relaxed">{selectedLog.description}</p>
                                    </div>
                                )}
                                {selectedLog.affected && (
                                    <div>
                                        <h4 className="font-bold text-secondary mb-2 uppercase text-xs tracking-wider">
                                            {t.auditLogs?.affectedColumns || 'Affected Columns'}:
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedLog.affected.map((col: string) => (
                                                <span
                                                    key={col}
                                                    className="px-3 py-1 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-full font-medium dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/50"
                                                >
                                                    {col}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {selectedLog.old && (
                                        <div className="bg-red-50 p-4 rounded-xl border border-red-100 overflow-x-auto dark:bg-red-900/5 dark:border-red-900/30">
                                            <h4 className="font-bold text-red-700 dark:text-red-400 mb-2 border-b border-red-200 dark:border-red-900/50 pb-2">
                                                {t.auditLogs?.oldValues || 'Old Values'}:
                                            </h4>
                                            <pre className="text-xs text-red-900 dark:text-red-200 mt-2 whitespace-pre-wrap font-mono">
                                                {JSON.stringify(selectedLog.old, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                    {selectedLog.new && (
                                        <div className="bg-green-50 p-4 rounded-xl border border-green-100 overflow-x-auto dark:bg-green-900/5 dark:border-green-900/30">
                                            <h4 className="font-bold text-green-700 dark:text-green-400 mb-2 border-b border-green-200 dark:border-green-900/50 pb-2">
                                                {t.auditLogs?.newValues || 'New Values'}:
                                            </h4>
                                            <pre className="text-xs text-green-900 dark:text-green-200 mt-2 whitespace-pre-wrap font-mono">
                                                {JSON.stringify(selectedLog.new, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditLogs;
