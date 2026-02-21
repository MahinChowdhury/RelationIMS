import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { type Inventory } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';

export default function InventoryLocations() {
    const { t } = useLanguage();
    const [inventories, setInventories] = useState<Inventory[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        Name: '',
        Description: ''
    });
    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadInventories();
    }, []);

    const loadInventories = async () => {
        try {
            const res = await api.get<Inventory[]>('/Inventory');
            setInventories(res.data);
        } catch (error) {
            console.error('Failed to load inventories', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = () => {
        setFormData({ Name: '', Description: '' });
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setFormData({ Name: '', Description: '' });
    };

    const handleCreateInventory = async () => {
        if (!formData.Name.trim()) {
            alert(t.inventory.enterLocationName);
            return;
        }

        setSaving(true);
        try {
            const res = await api.post<Inventory>('/Inventory', formData);
            setInventories([...inventories, res.data]);
            handleCloseModal();
        } catch (error) {
            console.error('Failed to create inventory', error);
            alert(t.inventory.failedToCreateLocation);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="container mx-auto max-w-7xl px-4 py-4 md:px-8 md:py-8 flex flex-col gap-6 md:gap-8">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="flex">
                <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                    <li className="inline-flex items-center">
                        <Link to="/dashboard" className="inline-flex items-center text-sm font-medium text-text-secondary hover:text-primary dark:text-gray-400 dark:hover:text-white">
                            <span className="material-symbols-outlined text-[18px] mr-1">dashboard</span>
                            {t.nav.dashboard || 'Dashboard'}
                        </Link>
                    </li>
                    <li>
                        <div className="flex items-center">
                            <span className="material-symbols-outlined text-text-secondary text-[18px]">chevron_right</span>
                            <Link to="/inventory" className="ms-1 text-sm font-medium text-text-secondary hover:text-primary md:ms-2 dark:text-gray-400 dark:hover:text-white">{t.inventory.title || 'Inventory'}</Link>
                        </div>
                    </li>
                    <li aria-current="page">
                        <div className="flex items-center">
                            <span className="material-symbols-outlined text-text-secondary text-[18px]">chevron_right</span>
                            <span className="ms-1 text-sm font-bold text-text-main md:ms-2 dark:text-white">{t.inventory.locations || 'Locations'}</span>
                        </div>
                    </li>
                </ol>
            </nav>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl md:text-4xl font-extrabold text-text-main dark:text-white tracking-tight">{t.inventory.locations || 'Inventory Locations'}</h1>
                    <p className="text-text-secondary dark:text-gray-400 text-sm md:text-base max-w-2xl">
                        {t.inventory.manageLocationsSubtitle || 'Manage your physical inventory locations and view stock distribution.'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleOpenModal}
                        className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-green-600 transition-all shadow-sm"
                    >
                        <span className="material-symbols-outlined text-[20px]">add_location</span>
                        <span>{t.inventory.addLocation || 'Add Location'}</span>
                    </button>
                </div>
            </div>

            {/* Content Grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary border-gray-200"></div>
                </div>
            ) : inventories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#1a2e22] rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                    <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">warehouse</span>
                    <h3 className="text-xl font-bold text-text-main dark:text-white mb-2">{t.inventory.noLocationsFound || 'No Locations Found'}</h3>
                    <p className="text-text-secondary dark:text-gray-400 mb-6">{t.inventory.getStartedLocations || 'Get started by creating your first inventory location.'}</p>
                    <button
                        onClick={handleOpenModal}
                        className="px-6 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20"
                    >
                        {t.inventory.createLocation || 'Create Location'}
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {inventories.map((inv) => (
                        <div key={inv.Id} className="group bg-white dark:bg-[#1a2e22] rounded-xl border border-gray-100 dark:border-[#2a4032] shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-lg hover:border-primary/50 transition-all duration-300 overflow-hidden relative cursor-pointer"
                            onClick={() => navigate(`/inventory/locations/${inv.Id}`)}>
                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[100px] -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                            <div className="p-6 flex flex-col gap-5 relative z-10">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-lg bg-primary/10 text-primary">
                                            <span className="material-symbols-outlined text-3xl">warehouse</span>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-text-main dark:text-white">{inv.Name}</h3>
                                            <p className="text-sm text-text-secondary dark:text-gray-400">ID: #{inv.Id}</p>
                                        </div>
                                    </div>
                                    <div className="relative group/menu">
                                        <button className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition-colors">
                                            <span className="material-symbols-outlined">more_vert</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="py-4 border-y border-dashed border-gray-100 dark:border-[#2a4032]">
                                    <p className="text-sm text-text-secondary dark:text-gray-300 line-clamp-2 min-h-[40px]">
                                        {inv.Description || t.common.noData || 'No description provided.'}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                                        <span className="text-sm font-medium text-text-secondary dark:text-gray-300">{t.inventory.active || 'Active'}</span>
                                    </div>
                                    <Link to={`/inventory/locations/${inv.Id}`} className="text-sm font-bold text-primary hover:text-green-700 flex items-center gap-1 group-hover:gap-2 transition-all">
                                        {t.inventory.viewDetails || 'View Details'} <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Add New Location Card */}
                    <button
                        onClick={handleOpenModal}
                        className="group flex flex-col items-center justify-center gap-4 p-6 rounded-xl border-2 border-dashed border-gray-200 dark:border-[#2a4032] hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 h-full min-h-[240px] w-full text-left"
                    >
                        <div className="p-4 rounded-full bg-white dark:bg-[#1a2e22] text-gray-400 group-hover:text-primary shadow-sm group-hover:shadow-md transition-all">
                            <span className="material-symbols-outlined text-4xl">add</span>
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-bold text-text-main dark:text-white group-hover:text-primary transition-colors">{t.inventory.addNewLocation || 'Add New Location'}</h3>
                            <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">{t.inventory.configureNewLocation || 'Configure a new warehouse or shop'}</p>
                        </div>
                    </button>
                </div>
            )}

            {/* Create Location Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all">
                    <div className="bg-white dark:bg-[#1a2e22] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-[#2a4032] animate-fadeIn">
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-gray-100 dark:border-[#2a4032] flex items-center justify-between bg-gray-50/50 dark:bg-[#112116]/50">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-xl flex items-center justify-center shadow-sm bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                    <span className="material-symbols-outlined text-[24px]">add_location</span>
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-text-main dark:text-white leading-tight">
                                        {t.inventory.addNewLocation || 'Add New Location'}
                                    </h2>
                                    <p className="text-xs text-text-secondary dark:text-gray-400 font-medium">
                                        {t.inventory.createLocation || 'Create a new inventory location'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleCloseModal}
                                className="size-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                            >
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 flex flex-col gap-4">
                            {/* Name */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-bold text-text-main dark:text-gray-300">{t.inventory.locationName || 'Location Name'} *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                                        <span className="material-symbols-outlined text-[20px]">warehouse</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.Name}
                                        onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 text-text-main text-sm rounded-lg focus:ring-primary focus:border-primary block dark:bg-[#112116] dark:border-gray-700 dark:placeholder-gray-400 dark:text-white transition-colors"
                                        placeholder="e.g. Main Warehouse, Shop A"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-bold text-text-main dark:text-gray-300">{t.common.description || 'Description'}</label>
                                <div className="relative">
                                    <div className="absolute top-3 left-3 pointer-events-none text-gray-400">
                                        <span className="material-symbols-outlined text-[20px]">description</span>
                                    </div>
                                    <textarea
                                        value={formData.Description}
                                        onChange={(e) => setFormData({ ...formData, Description: e.target.value })}
                                        rows={3}
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 text-text-main text-sm rounded-lg focus:ring-primary focus:border-primary block dark:bg-[#112116] dark:border-gray-700 dark:placeholder-gray-400 dark:text-white transition-colors resize-none"
                                        placeholder={t.inventory.enterLocationDescription || "Enter location description (optional)"}
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-gray-50/50 dark:bg-[#112116]/50 border-t border-gray-100 dark:border-[#2a4032] flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                disabled={saving}
                                className="px-4 py-2 text-sm font-bold text-text-main bg-white border border-gray-200 rounded-lg hover:bg-gray-50 dark:bg-[#1a2e22] dark:border-[#2a4032] dark:text-gray-200 dark:hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {t.common.cancel || 'Cancel'}
                            </button>
                            <button
                                type="button"
                                onClick={handleCreateInventory}
                                disabled={saving}
                                className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-green-500 shadow-md shadow-green-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        <span>{t.common.loading || 'Creating...'}</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[18px]">check</span>
                                        <span>{t.inventory.createLocation || 'Create Location'}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
