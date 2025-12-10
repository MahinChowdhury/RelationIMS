import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import useIntersectionObserver from '../../hooks/useIntersectionObserver';
import useDebounce from '../../hooks/useDebounce';
import type { Customer } from '../../types';
import { CustomerFormModal, DeleteCustomerModal } from '../../components/customers/CustomerModals';

export default function CustomersPage() {
    const navigate = useNavigate();

    // State
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 300);
    const [sortBy, setSortBy] = useState<'orderFrequency' | 'lastOrderDate' | ''>('');

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Editing / Creating State
    const [customerToDelete, setCustomerToDelete] = useState<number | null>(null);

    const initialCustomerState: Customer = {
        Id: 0,
        Name: '',
        Phone: '',
        Email: '',
        Address: ''
    };
    const [editingCustomer, setEditingCustomer] = useState<Customer>(initialCustomerState);

    // Infinite Scroll Hook
    const { containerRef, isVisible } = useIntersectionObserver({ threshold: 1.0 });

    // Initial Load & Filter Trigger
    useEffect(() => {
        loadCustomers(true);
    }, [sortBy, debouncedSearch]);

    // Infinite Scroll Trigger
    useEffect(() => {
        if (isVisible && !loading && hasMore) {
            setPage(prev => prev + 1);
        }
    }, [isVisible]);

    useEffect(() => {
        if (page > 1) {
            loadCustomers(false);
        }
    }, [page]);

    // --- Logic ---
    const loadCustomers = async (reset: boolean) => {
        if (reset) {
            setCustomers([]);
            setPage(1);
            setHasMore(true);
        }

        setLoading(true);
        try {
            const params = new URLSearchParams({
                search: debouncedSearch || '',
                sortBy: sortBy || '',
                pageNumber: reset ? '1' : page.toString(),
                pageSize: '20'
            });

            const res = await api.get(`/Customer?${params.toString()}`);
            const newCustomers = res.data;

            if (reset) {
                setCustomers(newCustomers);
            } else {
                setCustomers(prev => [...prev, ...newCustomers]);
            }

            if (newCustomers.length < 20) setHasMore(false);

        } catch (error) {
            console.error('Failed to load customers:', error);
        } finally {
            setLoading(false);
        }
    };

    // Client-side Sort/Filter application if API doesn't handle everything or for immediate feedback
    // The API seems to handle basic search/sort params, but Angular had 'applyFilters' locally too.
    // For now we trust the API + local state updates.
    // However, the Angular code sorted locally for orderFrequency/lastOrderDate if API didn't.
    // Let's assume API does it or we do it here. The Angular code fetched *then* applied filters? No, it fetched then applied filters to `this.filtered`.
    // Let's replicate strict behavior: define `filteredCustomers` derived state.

    // BUT looking at Angular: loadCustomers calls API then `applyFilters`. `applyFilters` does local filtering/sorting.
    // This suggests the API might not strictly handle the complex sorts or fuzzy search perfect?
    // Actually, `params` are sent to API. So API likely does server-side filtering.
    // The Angular `applyFilters` seems redundant or modifying the View Model.
    // Let's stick to API-driven for scalability, but we can conform if needed.
    // Wait, Angular `applyFilters` sorts `list` based on `sortBy`. If API returns paged data, local sort is weird.
    // We will assume usage of API params is primary.

    // --- Handlers ---
    const getOrderCount = (c: Customer) => c.Orders?.length || 0;

    const navigateToDetail = (id: number) => {
        navigate(`/customers/${id}`);
    };

    // CRUD
    const handleCreate = async () => {
        try {
            await api.post('/Customer', editingCustomer);
            setShowCreateModal(false);
            loadCustomers(true);
        } catch (e: any) {
            console.error(e);
            alert('Failed to create customer');
        }
    };

    const handleUpdate = async () => {
        if (!editingCustomer.Id) return;
        try {
            await api.put(`/Customer/${editingCustomer.Id}`, editingCustomer);
            setShowEditModal(false);
            loadCustomers(true);
        } catch (e: any) {
            console.error(e);
            alert('Failed to update customer');
        }
    };

    const handleDelete = async () => {
        if (!customerToDelete) return;
        try {
            await api.delete(`/Customer/${customerToDelete}`);
            setCustomers(prev => prev.filter(c => c.Id !== customerToDelete));
            setShowDeleteModal(false);
        } catch (e: any) {
            console.error(e);
            alert('Failed to delete customer');
        }
    };

    const openCreate = () => {
        setEditingCustomer(initialCustomerState);
        setShowCreateModal(true);
    };

    const openEdit = (c: Customer) => {
        setEditingCustomer({ ...c });
        setShowEditModal(true);
    };

    return (
        <div className="px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-40 flex flex-1 justify-center py-5 bg-gradient-to-br from-[#f8fcf9] to-white min-h-screen">
            <div className="layout-content-container flex flex-col w-full max-w-none flex-1">

                {/* Header */}
                <div className="flex flex-wrap justify-between items-center gap-3 p-4 mb-2">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#4e9767] to-[#3d7a52] rounded-2xl flex items-center justify-center shadow-lg">
                            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-[#0e1b12] text-3xl md:text-4xl font-black leading-tight tracking-tight">Customer Management</p>
                            <p className="text-[#4e9767] text-sm font-medium mt-1">Manage your customer base and track order history</p>
                        </div>
                    </div>
                    <button
                        onClick={openCreate}
                        className="flex min-w-[120px] cursor-pointer items-center justify-center overflow-hidden rounded-2xl h-12 px-6 bg-gradient-to-r from-[#4e9767] to-[#3d7a52] hover:from-[#3d7a52] hover:to-[#2d5f3e] text-white text-sm font-bold leading-normal shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        <span className="truncate">Add Customer</span>
                    </button>
                </div>

                {/* Search */}
                <div className="px-4 py-3">
                    <label className="flex flex-col min-w-40 h-14 w-full">
                        <div className="flex w-full flex-1 items-stretch rounded-2xl h-full shadow-md hover:shadow-lg transition-shadow">
                            <div className="text-[#4e9767] flex border-none bg-white items-center justify-center pl-5 rounded-l-2xl border-r-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256"><path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path></svg>
                            </div>
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by name, email, or phone..."
                                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-2xl text-[#0e1b12] focus:outline-0 focus:ring-2 focus:ring-[#4e9767] border-none bg-white focus:border-none h-full placeholder:text-[#4e9767]/60 px-5 rounded-l-none border-l-0 pl-3 text-base font-medium leading-normal"
                            />
                        </div>
                    </label>
                </div>

                {/* Filters */}
                <div className="flex gap-3 p-3 flex-wrap pr-4">
                    <button
                        onClick={() => setSortBy(prev => prev === 'orderFrequency' ? '' : 'orderFrequency')}
                        className={`flex h-10 items-center justify-center gap-x-2 rounded-xl bg-white hover:bg-gray-50 border-2 ${sortBy === 'orderFrequency' ? 'border-[#4e9767] shadow-inner bg-green-50' : 'border-[#e7f3eb]'} hover:border-[#4e9767] pl-4 pr-3 text-[#0e1b12] text-sm font-semibold shadow-sm hover:shadow-md transition-all`}
                    >
                        <svg className="w-4 h-4 text-[#4e9767]" fill="currentColor" viewBox="0 0 20 20"><path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h7a1 1 0 100-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3z" /></svg>
                        Order Frequency
                    </button>

                    <button
                        onClick={() => setSortBy(prev => prev === 'lastOrderDate' ? '' : 'lastOrderDate')}
                        className={`flex h-10 items-center justify-center gap-x-2 rounded-xl bg-white hover:bg-gray-50 border-2 ${sortBy === 'lastOrderDate' ? 'border-[#4e9767] shadow-inner bg-green-50' : 'border-[#e7f3eb]'} hover:border-[#4e9767] pl-4 pr-3 text-[#0e1b12] text-sm font-semibold shadow-sm hover:shadow-md transition-all`}
                    >
                        <svg className="w-4 h-4 text-[#4e9767]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        Last Order Date
                    </button>
                </div>

                {/* Table */}
                <div className="px-4 py-3">
                    <div className="hidden md:block bg-white rounded-2xl shadow-xl border-2 border-[#d0e7d7] overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gradient-to-r from-[#4e9767] to-[#3d7a52] text-white">
                                    <th className="px-4 py-4 text-left text-sm font-bold leading-normal uppercase tracking-wide">Name</th>
                                    <th className="px-4 py-4 text-left text-sm font-bold leading-normal uppercase tracking-wide">Phone</th>
                                    <th className="px-4 py-4 text-left text-sm font-bold leading-normal uppercase tracking-wide">Email</th>
                                    <th className="px-4 py-4 text-left text-sm font-bold leading-normal uppercase tracking-wide">Address</th>
                                    <th className="px-4 py-4 text-left text-sm font-bold leading-normal uppercase tracking-wide">Orders</th>
                                    <th className="px-4 py-4 text-right text-sm font-bold leading-normal uppercase tracking-wide">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {customers.map((c) => (
                                    <tr key={c.Id} className="border-b border-[#d0e7d7] hover:bg-[#e7ede7] transition-colors">
                                        <td className="h-[72px] px-4 py-2 text-[#0e1b12] text-sm font-semibold">{c.Name}</td>
                                        <td className="h-[72px] px-4 py-2 text-[#4e9767] text-sm">{c.Phone}</td>
                                        <td className="h-[72px] px-4 py-2 text-[#4e9767] text-sm">{c.Email || '-'}</td>
                                        <td className="h-[72px] px-4 py-2 text-[#4e9767] text-sm truncate max-w-[200px]">{c.Address}</td>
                                        <td className="h-[72px] px-4 py-2 text-[#4e9767] text-sm cursor-pointer hover:underline" onClick={() => navigateToDetail(c.Id)}>
                                            {getOrderCount(c)} order{getOrderCount(c) === 1 ? '' : 's'}
                                        </td>
                                        <td className="h-[72px] px-4 py-2 text-right">
                                            <div className="flex justify-end gap-1">
                                                <button onClick={() => navigateToDetail(c.Id)} className="p-2 rounded-lg bg-[#e7f3eb] text-[#4e9767] hover:bg-[#d0e7d7] transition-all">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                </button>
                                                <button onClick={() => openEdit(c)} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                </button>
                                                <button onClick={() => { setCustomerToDelete(c.Id); setShowDeleteModal(true); }} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden flex flex-col gap-4">
                        {customers.map((c) => (
                            <div key={c.Id} className="bg-white rounded-2xl shadow-lg border-2 border-[#d0e7d7] p-4 flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-[#0e1b12] text-lg font-bold">{c.Name}</h3>
                                    <div className="flex gap-1">
                                        <button onClick={() => navigateToDetail(c.Id)} className="p-2 rounded-lg bg-[#e7f3eb] text-[#4e9767] hover:bg-[#d0e7d7] transition-all">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        </button>
                                        <button onClick={() => openEdit(c)} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        </button>
                                        <button onClick={() => { setCustomerToDelete(c.Id); setShowDeleteModal(true); }} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-2 text-sm">
                                    <div className="flex justify-between"><span className="font-medium text-[#4e9767]">Phone</span><span>{c.Phone}</span></div>
                                    <div className="flex justify-between"><span className="font-medium text-[#4e9767]">Email</span><span>{c.Email || '-'}</span></div>
                                    <div className="flex justify-between"><span className="font-medium text-[#4e9767]">Address</span><span>{c.Address}</span></div>
                                    <div className="flex justify-between"><span className="font-medium text-[#4e9767]">Orders</span><span>{getOrderCount(c)}</span></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Infinite Scroll Anchor */}
                    <div ref={containerRef} className="flex flex-col items-center justify-center py-8 mt-8">
                        {loading && (
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-12 h-12 border-4 border-[#e7f3eb] border-t-[#4e9767] rounded-full animate-spin"></div>
                                <p className="text-[#4e9767] text-base font-semibold">Loading more customers...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <CustomerFormModal
                show={showCreateModal}
                mode="create"
                customer={editingCustomer}
                onChange={(f, v) => setEditingCustomer(p => ({ ...p, [f]: v }))}
                onClose={() => setShowCreateModal(false)}
                onSave={handleCreate}
            />

            <CustomerFormModal
                show={showEditModal}
                mode="edit"
                customer={editingCustomer}
                onChange={(f, v) => setEditingCustomer(p => ({ ...p, [f]: v }))}
                onClose={() => setShowEditModal(false)}
                onSave={handleUpdate}
            />

            <DeleteCustomerModal
                show={showDeleteModal}
                onCancel={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
            />
        </div>
    );
}
