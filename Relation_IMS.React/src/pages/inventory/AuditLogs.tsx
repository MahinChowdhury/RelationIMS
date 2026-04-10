import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { getAuditLogs } from '../../services/AuditLogService';
import type { AuditLogResponse } from '../../types/auditLog';

const AuditLogs = () => {
    const { t } = useLanguage();
    const [data, setData] = useState<AuditLogResponse | null>(null);
    const [records, setRecords] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const observer = useRef<IntersectionObserver | null>(null);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    
    // Modal state
    const [selectedLog, setSelectedLog] = useState<{old: any, new: any, affected: any} | null>(null);

    const lastElementRef = (node: HTMLTableRowElement | null) => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    };

    useEffect(() => {
        setPage(1);
    }, [searchTerm, dateFilter, actionFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLogs(page === 1);
        }, 500);
        return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, searchTerm, dateFilter, actionFilter]);

    const fetchLogs = async (isReset = false) => {
        setLoading(true);
        try {
            const res = await getAuditLogs({
                pageNumber: page,
                pageSize: 20,
                search: searchTerm || undefined,
                date: dateFilter || undefined,
                actionType: actionFilter || undefined
            });
            setData(res);
            if (isReset || page === 1) {
                setRecords(res.Records || []);
            } else {
                setRecords(prev => {
                    const newRecords = res.Records || [];
                    const existingIds = new Set(prev.map(r => r.Id));
                    const uniqueNew = newRecords.filter(r => !existingIds.has(r.Id));
                    return [...prev, ...uniqueNew];
                });
            }
            setHasMore(page < res.TotalPages);
        } catch (error) {
            console.error('Failed to load audit logs', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (oldVal: string | null, newVal: string | null, affected: string | null) => {
        try {
            const parsedOld = oldVal ? JSON.parse(oldVal) : null;
            const parsedNew = newVal ? JSON.parse(newVal) : null;
            const parsedAffected = affected ? JSON.parse(affected) : null;

            setSelectedLog({ old: parsedOld, new: parsedNew, affected: parsedAffected });
        } catch {
            // fallback
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            <div className="fixed inset-0 bg-pattern -z-20 pointer-events-none"></div>
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-3xl"></div>
            </div>

            <header className="w-full px-6 py-5 md:px-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 z-10">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-primary text-sm font-medium">
                        <span className="material-symbols-outlined text-[20px]">plagiarism</span>
                        <Link to="/inventory">{t.inventory.title || 'Inventory'}</Link>
                        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                        <span>{t.auditLogs?.title || 'Audit Logs'}</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-[#0e1b12] dark:text-white tracking-tight">{t.auditLogs?.title || 'Audit Logs'}</h1>
                    <p className="text-secondary text-base font-medium max-w-2xl">{t.auditLogs?.subtitle || 'View a comprehensive history of structural changes across your system.'}</p>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto px-6 md:px-10 pb-10 z-10">
                <section className="glass-panel rounded-2xl p-5 mb-6 shadow-sm">
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <label className="flex flex-col w-full">
                                <div className="flex w-full items-center rounded-lg h-11 bg-white/50 dark:bg-black/20 border border-[var(--color-scrollbar)] dark:border-white/10 focus-within:ring-2 focus-within:ring-primary/50 transition-all overflow-hidden">
                                    <div className="text-secondary pl-3 flex items-center justify-center">
                                        <span className="material-symbols-outlined">search</span>
                                    </div>
                                    <input
                                        className="flex w-full flex-1 bg-transparent border-none h-full placeholder:text-secondary/70 px-3 text-sm focus:ring-0 text-[#0e1b12] dark:text-white"
                                        placeholder={t.common.search || "Search Module or ID..."}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </label>

                            <label className="flex flex-col w-full">
                                <input
                                    type="date"
                                    className="w-full h-11 rounded-lg bg-white/50 dark:bg-black/20 border border-[var(--color-scrollbar)] dark:border-white/10 text-sm px-3 text-[#0e1b12] dark:text-white focus:ring-1 focus:ring-primary focus:border-primary"
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value)}
                                />
                            </label>

                            <label className="flex flex-col w-full">
                                <select
                                    className="w-full h-11 rounded-lg bg-white/50 dark:bg-black/20 border border-[var(--color-scrollbar)] dark:border-white/10 text-sm px-3 text-[#0e1b12] dark:text-white focus:ring-1 focus:ring-primary focus:border-primary appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2317cf54%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-[right_1rem_center] bg-no-repeat pr-8"
                                    value={actionFilter}
                                    onChange={(e) => setActionFilter(e.target.value)}
                                >
                                    <option value="">{t.auditLogs?.allActions || 'All Actions'}</option>
                                    <option value="Create">Create</option>
                                    <option value="Update">Update</option>
                                    <option value="Delete">Delete</option>
                                </select>
                            </label>
                        </div>
                    </div>
                </section>

                <section className="glass-panel rounded-2xl shadow-sm overflow-hidden flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-primary/5 border-b border-[var(--color-scrollbar)] dark:border-white/5 text-xs uppercase text-secondary font-bold tracking-wider">
                                    <th className="px-6 py-4">{t.common.date || 'Date'}</th>
                                    <th className="px-6 py-4">{t.auditLogs?.module || 'Module'}</th>
                                    <th className="px-6 py-4">{t.common.action || 'Action'}</th>
                                    <th className="px-6 py-4">{t.common.user || 'User'}</th>
                                    <th className="px-6 py-4 text-center">{t.common.actions || 'Details'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#d0e7d7]/50 dark:divide-white/5">
                                {loading && records.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-gray-500">
                                            {t.common.loading || 'Loading...'}
                                        </td>
                                    </tr>
                                )}
                                {!loading && records.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-gray-500">
                                            {t.common.noData || 'No data found.'}
                                        </td>
                                    </tr>
                                )}
                                {records.map((log, index) => (
                                    <tr 
                                        key={log.Id} 
                                        ref={index === records.length - 1 ? lastElementRef : null}
                                        className="group hover:bg-white/40 dark:hover:bg-white/5 transition-colors text-sm"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-[#0e1b12] dark:text-white">
                                                    {new Date(log.DateTime).toLocaleDateString()}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(log.DateTime).toLocaleTimeString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-[#0e1b12] dark:text-white">{log.TableName}</span>
                                                <span className="text-xs text-secondary font-mono bg-primary/5 px-1 py-0.5 mt-1 rounded w-fit">{log.PrimaryKey}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${
                                                log.Type === 'Create' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                log.Type === 'Update' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                log.Type === 'Delete' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                            }`}>
                                                {log.Type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="size-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500 border border-white dark:border-white/10 shadow-sm">
                                                    {log.UserName?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <span className="font-medium text-gray-700 dark:text-gray-200">{log.UserName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {(log.OldValues || log.NewValues) ? (
                                                <button 
                                                    onClick={() => handleViewDetails(log.OldValues, log.NewValues, log.AffectedColumns)}
                                                    className="w-8 h-8 rounded-full bg-gray-50 text-gray-600 hover:bg-primary/20 hover:text-primary transition-colors flex items-center justify-center border border-gray-200 dark:bg-white/5 dark:border-white/10 dark:text-gray-300 mx-auto"
                                                    title="View Details"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                                                </button>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {loading && records.length > 0 && (
                        <div className="p-4 border-t border-[var(--color-scrollbar)] dark:border-white/5 flex items-center justify-center">
                            <span className="text-sm text-gray-500 flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                {t.common.loading || 'Loading more...'}
                            </span>
                        </div>
                    )}
                    {!hasMore && records.length > 0 && (
                        <div className="p-4 border-t border-[var(--color-scrollbar)] dark:border-white/5 flex items-center justify-center">
                            <span className="text-sm text-gray-500">
                                {t.common.noData || 'No more records.'}
                            </span>
                        </div>
                    )}
                </section>
            </div>

            {/* Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1a2e20] rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-4 duration-300 border border-gray-100 dark:border-white/10">
                        <div className="flex items-center justify-between p-6 border-b border-[var(--color-scrollbar)] dark:border-white/5">
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
                                {selectedLog.affected && (
                                    <div>
                                        <h4 className="font-bold text-secondary mb-2 uppercase text-xs tracking-wider">
                                            {t.auditLogs?.affectedColumns || 'Affected Columns'}:
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedLog.affected.map((col: string) => (
                                                <span key={col} className="px-3 py-1 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-full font-medium dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/50">
                                                    {col}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {selectedLog.old && (
                                        <div className="bg-red-50 p-4 rounded-xl border border-red-100 overflow-x-auto dark:bg-red-900/5 dark:border-red-900/30">
                                            <h4 className="font-bold text-red-700 mb-2 border-b border-red-200 dark:border-red-900/50 pb-2">
                                                {t.auditLogs?.oldValues || 'Old Values'}:
                                            </h4>
                                            <pre className="text-xs text-red-900 dark:text-red-200 mt-2 whitespace-pre-wrap font-mono">
                                                {JSON.stringify(selectedLog.old, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                    {selectedLog.new && (
                                        <div className="bg-green-50 p-4 rounded-xl border border-green-100 overflow-x-auto dark:bg-green-900/5 dark:border-green-900/30">
                                            <h4 className="font-bold text-green-700 mb-2 border-b border-green-200 dark:border-green-900/50 pb-2">
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
