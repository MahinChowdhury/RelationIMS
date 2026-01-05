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
    const [statusFilter, setStatusFilter] = useState<string>('All');

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Editing / Creating State
    const [customerToDelete, setCustomerToDelete] = useState<number | null>(null);
    const [editingCustomer, setEditingCustomer] = useState<Customer>({
        Id: 0,
        Name: '',
        Phone: '',
        Email: '',
        Address: ''
    });

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

    // --- Helpers for Derived Stats ---
    const getStats = (c: Customer) => {
        const orders = c.Orders || [];
        const totalSpent = orders.reduce((sum, o) => sum + (o.NetAmount || 0), 0);
        const dueAmount = orders.reduce((sum, o) =>
            sum + (o.NetAmount - (o.PaidAmount ?? (o.PaymentStatus === 2 ? o.NetAmount : 0))), 0);

        return { totalSpent, dueAmount, orderCount: orders.length };
    };

    const getStatus = (c: Customer) => {
        const { totalSpent, orderCount } = getStats(c);
        const createdDate = c.CreatedDate ? new Date(c.CreatedDate) : new Date();
        const daysSinceCreation = (new Date().getTime() - createdDate.getTime()) / (1000 * 3600 * 24);

        if (totalSpent > 2000) return 'VIP';
        if (daysSinceCreation < 30 && orderCount < 5) return 'New';
        if (orderCount === 0 && daysSinceCreation > 60) return 'Inactive';
        return 'Active';
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'VIP': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            case 'New': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'Inactive': return 'bg-gray-100 text-gray-500 dark:bg-gray-700/30 dark:text-gray-400';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    // Client-side filtering for derived status
    const filteredCustomers = customers.filter(c => {
        if (statusFilter === 'All') return true;
        return getStatus(c) === statusFilter;
    });

    // --- Handlers ---
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
        setEditingCustomer({ Id: 0, Name: '', Phone: '', Email: '', Address: '' });
        setShowCreateModal(true);
    };

    const openEdit = (c: Customer) => {
        setEditingCustomer({ ...c });
        setShowEditModal(true);
    };

    return (
        <div className="container mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8 flex flex-col gap-6">

            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="flex">
                <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                    <li className="inline-flex items-center">
                        <a href="#" className="inline-flex items-center text-sm font-medium text-text-secondary hover:text-primary dark:text-gray-400 dark:hover:text-white">
                            <span className="material-symbols-outlined text-[18px] mr-1">dashboard</span>
                            Dashboard
                        </a>
                    </li>
                    <li>
                        <div className="flex items-center">
                            <span className="material-symbols-outlined text-text-secondary text-[18px]">chevron_right</span>
                            <a href="#" className="ms-1 text-sm font-medium text-text-secondary hover:text-primary md:ms-2 dark:text-gray-400 dark:hover:text-white">Customers</a>
                        </div>
                    </li>
                    <li aria-current="page">
                        <div className="flex items-center">
                            <span className="material-symbols-outlined text-text-secondary text-[18px]">chevron_right</span>
                            <span className="ms-1 text-sm font-bold text-text-main md:ms-2 dark:text-white">All Customers</span>
                        </div>
                    </li>
                </ol>
            </nav>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-text-main dark:text-white tracking-tight">Customer List</h1>
                    <p className="text-text-secondary dark:text-gray-400 text-base max-w-2xl">
                        Detailed contact information, shopping activity, and order history.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={openCreate}
                        className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-green-500 shadow-lg shadow-green-500/20 transition-all"
                    >
                        <span className="material-symbols-outlined text-[20px]">person_add</span>
                        Add Customer
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 justify-between bg-white dark:bg-[#1a2e22] p-4 rounded-xl border border-gray-100 dark:border-[#2a4032] shadow-sm">
                <div className="relative group w-full md:w-96">
                    <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                        <span className="material-symbols-outlined text-text-secondary">search</span>
                    </div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full p-2.5 ps-10 text-sm text-text-main border border-gray-200 rounded-lg bg-gray-50 focus:ring-primary focus:border-primary dark:bg-[#112116] dark:border-gray-700 dark:placeholder-gray-400 dark:text-white transition-all"
                        placeholder="Search by name, email, or phone..."
                    />
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="appearance-none bg-gray-50 border border-gray-200 text-text-main text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 pr-8 dark:bg-[#112116] dark:border-gray-700 dark:text-white"
                        >
                            <option value="All">Status: All</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="VIP">VIP</option>
                            <option value="New">New</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-secondary">
                            <span className="material-symbols-outlined text-[18px]">expand_more</span>
                        </div>
                    </div>
                    <div className="relative">
                        <select
                            className="appearance-none bg-gray-50 border border-gray-200 text-text-main text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 pr-8 dark:bg-[#112116] dark:border-gray-700 dark:text-white"
                            onChange={(e) => {
                                if (e.target.value.includes('Newest')) setSortBy('lastOrderDate');
                                else if (e.target.value.includes('Freq')) setSortBy('orderFrequency');
                                else setSortBy('');
                            }}
                        >
                            <option>Sort by: Default</option>
                            <option>Sort by: Newest Order</option>
                            <option>Sort by: Order Frequency</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-secondary">
                            <span className="material-symbols-outlined text-[18px]">expand_more</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* List Header (Desktop) */}
            <div className="hidden lg:flex px-4 text-xs font-bold text-text-secondary uppercase tracking-wider gap-3">
                <div className="w-[180px] xl:w-[220px]">Customer</div>
                <div className="flex-1 min-w-[140px]">Email</div>
                <div className="w-[115px] xl:w-[130px]">Mobile</div>
                {/* Skipped Last Order Column */}
                <div className="w-[80px] xl:w-[100px] text-right">Total Spent</div>
                <div className="w-[80px] xl:w-[100px] text-right">Outstanding</div>
                <div className="w-[60px] xl:w-[80px] text-center">Orders</div>
                <div className="w-[120px] text-right">Actions</div>
            </div>

            {/* Customer List */}
            <div className="flex flex-col gap-3">
                {filteredCustomers.map((c) => {
                    const stats = getStats(c);
                    const status = getStatus(c);

                    return (
                        <div key={c.Id} className="bg-white dark:bg-[#1a2e22] rounded-xl border border-gray-100 dark:border-[#2a4032] p-3 md:p-4 grid grid-cols-2 lg:flex lg:flex-row lg:items-center gap-3 lg:gap-3 group hover:shadow-md transition-all hover:border-primary/30">

                            {/* Customer Info */}
                            <div className="col-span-2 flex items-center gap-3 lg:w-[180px] xl:w-[220px]">
                                <div className="size-10 rounded-full bg-gray-200 bg-center bg-cover border border-gray-100 dark:border-gray-700 shrink-0 flex items-center justify-center font-bold text-gray-500 text-sm">
                                    {c.Name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-text-main dark:text-white text-base leading-tight truncate max-w-[120px]">{c.Name}</h3>
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide font-bold ${getStatusColor(status)}`}>
                                            {status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-text-secondary font-medium mt-0.5">ID: #CUS-{c.Id.toString().padStart(3, '0')}</p>
                                </div>
                            </div>

                            {/* Email */}
                            <div className="col-span-2 flex flex-col lg:flex-1 min-w-[140px]">
                                <span className="text-xs text-text-secondary uppercase font-bold lg:hidden mb-1">Email</span>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px] text-gray-400 lg:hidden">mail</span>
                                    <span className="text-sm font-medium text-text-main dark:text-white truncate" title={c.Email}>{c.Email || '-'}</span>
                                </div>
                            </div>

                            {/* Mobile */}
                            <div className="col-span-1 flex flex-col lg:w-[115px] xl:w-[130px]">
                                <span className="text-xs text-text-secondary uppercase font-bold lg:hidden mb-1">Mobile</span>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px] text-gray-400 lg:hidden">smartphone</span>
                                    <span className="text-sm font-bold text-text-main dark:text-white lg:font-medium tracking-tight">{c.Phone}</span>
                                </div>
                            </div>


                            {/* Total Spent */}
                            <div className="col-span-1 flex flex-col lg:w-[80px] xl:w-[100px] lg:items-end">
                                <span className="text-xs text-text-secondary uppercase font-bold lg:hidden mb-1">Total Spent</span>
                                <span className="text-sm font-bold text-text-main dark:text-white">${stats.totalSpent.toFixed(2)}</span>
                            </div>

                            {/* Due Amount */}
                            <div className="col-span-1 flex flex-col lg:w-[80px] xl:w-[100px] lg:items-end">
                                <span className="text-xs text-text-secondary uppercase font-bold lg:hidden mb-1">Due Amount</span>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px] text-gray-400 lg:hidden">payments</span>
                                    <span className={`font-bold text-sm lg:text-sm ${stats.dueAmount > 0 ? 'text-red-500' : 'text-green-600'}`}>
                                        ${stats.dueAmount.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* Orders Count */}
                            <div className="col-span-1 flex flex-col lg:w-[60px] xl:w-[80px] lg:items-center">
                                <span className="text-xs text-text-secondary uppercase font-bold lg:hidden mb-2">Orders</span>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px] text-primary lg:hidden">shopping_bag</span>
                                    <span className="text-sm font-bold text-text-main dark:text-white">{stats.orderCount}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="col-span-2 flex items-center gap-2 mt-2 lg:mt-0 justify-end w-full lg:w-[120px] border-t lg:border-t-0 border-gray-100 dark:border-[#2a4032] pt-2 lg:pt-0">
                                <button
                                    onClick={() => navigateToDetail(c.Id)}
                                    className="flex items-center justify-center size-8 rounded-lg bg-green-50 text-green-600 border border-green-100 hover:bg-primary hover:text-white hover:border-primary transition-all dark:bg-green-900/20 dark:border-green-800/50 dark:text-green-400 dark:hover:bg-primary group/btn"
                                    title="View Details"
                                >
                                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                                </button>
                                <button
                                    onClick={() => openEdit(c)}
                                    className="flex items-center justify-center size-8 rounded-lg bg-white border border-gray-200 text-text-main hover:bg-gray-50 dark:bg-[#112116] dark:border-[#2a4032] dark:text-gray-300 dark:hover:bg-white/5 transition-colors"
                                    title="Edit"
                                >
                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                </button>
                                <button
                                    onClick={() => { setCustomerToDelete(c.Id); setShowDeleteModal(true); }}
                                    className="flex items-center justify-center size-8 rounded-lg bg-red-50 border border-red-100 text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
                                    title="Delete"
                                >
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                            </div>

                        </div>
                    );
                })}

                {/* Infinite Scroll Sentinel */}
                <div ref={containerRef} className="flex flex-col items-center justify-center py-8">
                    {loading && (
                        <div className="flex items-center gap-2 text-primary">
                            <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
                            <span className="text-sm font-medium">Loading customers...</span>
                        </div>
                    )}
                    {!hasMore && customers.length > 0 && (
                        <p className="text-text-secondary text-sm">No more customers to load.</p>
                    )}
                    {!loading && customers.length === 0 && (
                        <p className="text-text-secondary text-base">No customers found.</p>
                    )}
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
