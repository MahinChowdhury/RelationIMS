import { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import ConfirmDeleteInput from '../../components/ConfirmDeleteInput';

// --- Types ---
interface Brand { Id: number; Name: string; Categories: Category[]; }
interface Category { Id: number; Name: string; }
interface Quarter { Id: number; Name: string; }
interface Color { id: number; name: string; hex: string; }
interface Size { id: number; name: string; Categories?: Category[]; }

// --- Types for API Payloads ---

export default function Configuration() {
    const { t } = useLanguage();

    // --- State for each section (loaded independently) ---
    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [quarters, setQuarters] = useState<Quarter[]>([]);
    const [colors, setColors] = useState<Color[]>([]);
    const [sizes, setSizes] = useState<Size[]>([]);

    // --- Loading states for each section ---
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [loadingBrands, setLoadingBrands] = useState(true);
    const [loadingQuarters, setLoadingQuarters] = useState(true);
    const [loadingColors, setLoadingColors] = useState(true);
    const [loadingSizes, setLoadingSizes] = useState(true);

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'brand' | 'category' | 'quarter' | 'color' | 'size'>('brand');
    const [editingItem, setEditingItem] = useState<any>(null);

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteItem, setDeleteItem] = useState<{ type: 'brand' | 'category' | 'quarter' | 'color' | 'size', id: number } | null>(null);

    // Form State
    const [formData, setFormData] = useState({ name: '', hex: '', categoryId: 0, categoryIds: [] as number[] });

    useEffect(() => {
        loadCategories();
        loadBrands();
        loadQuarters();
        loadColors();
        loadSizes();
    }, []);

    const loadCategories = async () => {
        try {
            const res = await api.get('/Category');
            setCategories(res.data);
        } catch (e) { console.error('Failed to load categories', e); }
        finally { setLoadingCategories(false); }
    };

    const loadBrands = async () => {
        try {
            const res = await api.get('/Brand');
            setBrands(res.data);
        } catch (e) { console.error('Failed to load brands', e); }
        finally { setLoadingBrands(false); }
    };

    const loadQuarters = async () => {
        try {
            const res = await api.get('/Quarter');
            setQuarters(res.data);
        } catch (e) { console.error('Failed to load quarters', e); }
        finally { setLoadingQuarters(false); }
    };

    const loadColors = async () => {
        try {
            const res = await api.get('/ProductVariantColors');
            setColors(res.data.map((c: any) => ({ id: c.Id, name: c.Name, hex: c.HexCode })));
        } catch (e) { console.error('Failed to load colors', e); }
        finally { setLoadingColors(false); }
    };

    const loadSizes = async () => {
        try {
            const res = await api.get('/ProductVariantSizes');
            setSizes(res.data.map((s: any) => ({ id: s.Id, name: s.Name, Categories: s.Categories || [] })));
        } catch (e) { console.error('Failed to load sizes', e); }
        finally { setLoadingSizes(false); }
    };

    const refreshAll = () => {
        loadCategories();
        loadBrands();
        loadQuarters();
        loadColors();
        loadSizes();
    };

    // --- Handlers ---

    const openModal = (type: 'brand' | 'category' | 'quarter' | 'color' | 'size', item?: any) => {
        setModalType(type);
        setEditingItem(item);
        setModalOpen(true);

        // Reset or Fill Form
        if (item) {
            setFormData({
                name: item.Name || item.name,
                hex: item.hex || item.HexCode || '',
                categoryId: 0,
                categoryIds: item.Categories ? item.Categories.map((c: any) => c.Id) : []
            });
        } else {
            setFormData({ name: '', hex: '', categoryId: 0, categoryIds: [] });
        }
    };

    const handleDeleteClick = (type: 'brand' | 'category' | 'quarter' | 'color' | 'size', id: number) => {
        setDeleteItem({ type, id });
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteItem) return;

        try {
            let endpoint = '';
            switch (deleteItem.type) {
                case 'brand': endpoint = `/Brand/${deleteItem.id}`; break;
                case 'category': endpoint = `/Category/${deleteItem.id}`; break;
                case 'quarter': endpoint = `/Quarter/${deleteItem.id}`; break;
                case 'color': endpoint = `/ProductVariantColors/${deleteItem.id}`; break;
                case 'size': endpoint = `/ProductVariantSizes/${deleteItem.id}`; break;
            }

            await api.delete(endpoint);
            setDeleteModalOpen(false);
            setDeleteItem(null);

            // Only refresh the specific section instead of all
            switch (deleteItem.type) {
                case 'brand': loadBrands(); break;
                case 'category': loadCategories(); break;
                case 'quarter': loadQuarters(); break;
                case 'color': loadColors(); break;
                case 'size': loadSizes(); break;
            }
        } catch (error) {
            console.error("Delete failed", error);
            alert(t.config.failedToDelete);
            setDeleteModalOpen(false);
            setDeleteItem(null);
        }
    };

    const cancelDelete = () => {
        setDeleteModalOpen(false);
        setDeleteItem(null);
    };

    const handleSave = async () => {
        try {
            let endpoint = '';
            let payload: any = {};
            const isEdit = !!editingItem;
            const id = editingItem?.Id || editingItem?.id;

            switch (modalType) {
                case 'brand':
                    endpoint = isEdit ? `/Brand/${id}` : '/Brand';
                    payload = { Name: formData.name, CategoryIds: formData.categoryIds };
                    break;
                case 'category':
                    endpoint = isEdit ? `/Category/${id}` : '/Category';
                    payload = { Name: formData.name };
                    break;
                case 'quarter':
                    endpoint = isEdit ? `/Quarter/${id}` : '/Quarter';
                    payload = { Name: formData.name };
                    break;
                case 'color':
                    endpoint = isEdit ? `/ProductVariantColors/${id}` : '/ProductVariantColors';
                    payload = { Name: formData.name, HexCode: formData.hex };
                    break;
                case 'size':
                    endpoint = isEdit ? `/ProductVariantSizes/${id}` : '/ProductVariantSizes';
                    payload = { Name: formData.name, CategoryIds: formData.categoryIds };
                    break;
            }

            if (isEdit) {
                await api.put(endpoint, payload);
            } else {
                await api.post(endpoint, payload);
            }

            setModalOpen(false);

            // Only refresh the specific section instead of all
            switch (modalType) {
                case 'brand': loadBrands(); break;
                case 'category': loadCategories(); break;
                case 'quarter': loadQuarters(); break;
                case 'color': loadColors(); break;
                case 'size': loadSizes(); break;
            }
        } catch (error) {
            console.error("Save failed", error);
            alert(t.config.failedToSave);
        }
    };


    const sortedSizes = useMemo(() => {
        return [...sizes].sort((a, b) => {
            const catANames = a.Categories?.map(c => c.Name).join(', ') || t.common.generic;
            const catBNames = b.Categories?.map(c => c.Name).join(', ') || t.common.generic;
            if (catANames !== catBNames) return catANames.localeCompare(catBNames);
            return a.name.localeCompare(b.name);
        });
    }, [sizes, categories, t.common.generic]);

    const renderCard = (title: string, subtitle: string | null, type: 'brand' | 'category' | 'quarter' | 'color' | 'size', item: any, colorHex?: string) => (
        <div className="bg-white dark:bg-[#1a2e22] border border-gray-100 dark:border-[#2a4032] rounded-lg p-2 flex justify-between items-center group hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
            <div className="flex items-center gap-2 overflow-hidden">
                {colorHex ? (
                    <div className="w-4 h-4 rounded-full border border-gray-200 shrink-0" style={{ backgroundColor: colorHex }}></div>
                ) : (
                    <div className="w-0.5 h-5 rounded-full bg-[#17cf54]/30 shrink-0"></div>
                )}
                <div className="min-w-0">
                    <h3 className="font-semibold text-sm text-[#0e1b12] dark:text-white truncate">{title}</h3>
                    {subtitle && <p className="text-[10px] text-gray-400">{subtitle}</p>}
                </div>
            </div>
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                    onClick={() => openModal(type, item)}
                    className="p-1 text-gray-400 hover:text-[#17cf54] transition-colors"
                >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                </button>
                <button
                    onClick={() => handleDeleteClick(type, item.Id || item.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex-1 overflow-y-auto bg-[#f6f8f6] dark:bg-transparent p-6 md:p-8">
            <div className="max-w-6xl mx-auto flex flex-col gap-12 pb-20">

                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-extrabold text-[#0e1b12] dark:text-white">{t.config.title}</h1>
                    <p className="text-[#4e9767] dark:text-gray-400">{t.config.subtitle}</p>
                </div>

                {/* Categories Section */}
                <div className="bg-white/80 dark:bg-[#1a2e22]/80 backdrop-blur-md border border-white/50 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                        <h2 className="text-lg font-bold text-[#0e1b12] dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#17cf54]">category</span>
                            {t.config.categories}
                        </h2>
                        <button
                            onClick={() => openModal('category')}
                            className="px-3 py-1.5 bg-[#17cf54] hover:bg-[#12a542] text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95"
                        >
                            <span className="material-symbols-outlined text-[16px]">add</span>
                            {t.config.addCategory}
                        </button>
                    </div>
                    <div className="p-4">
                        {loadingCategories ? (
                            <div className="text-center py-4 text-gray-400">{t.config.loadingConfig}</div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                                {categories.length > 0 ? (
                                    categories.map(c => renderCard(c.Name, null, 'category', c))
                                ) : (
                                    <p className="text-xs text-gray-400 col-span-full py-4 text-center">{t.config.noCategories}</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Brands Section */}
                <div className="bg-white/80 dark:bg-[#1a2e22]/80 backdrop-blur-md border border-white/50 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                        <h2 className="text-lg font-bold text-[#0e1b12] dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#17cf54]">verified</span>
                            {t.config.brands}
                        </h2>
                        <button
                            onClick={() => openModal('brand')}
                            className="px-3 py-1.5 bg-[#17cf54] hover:bg-[#12a542] text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95"
                        >
                            <span className="material-symbols-outlined text-[16px]">add</span>
                            {t.config.addBrand}
                        </button>
                    </div>
                    <div className="p-4">
                        {loadingBrands ? (
                            <div className="text-center py-4 text-gray-400">{t.config.loadingConfig}</div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                                {brands.length > 0 ? (
                                    brands.map(b => renderCard(b.Name, b.Categories?.map(c => c.Name).join(', ') || null, 'brand', b))
                                ) : (
                                    <p className="text-xs text-gray-400 col-span-full py-4 text-center">{t.config.noBrands}</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quarters Section */}
                <div className="bg-white/80 dark:bg-[#1a2e22]/80 backdrop-blur-md border border-white/50 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden mt-6">
                    <div className="p-5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                        <h2 className="text-lg font-bold text-[#0e1b12] dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#17cf54]">calendar_month</span>
                            {t.config.quarters}
                        </h2>
                        <button
                            onClick={() => openModal('quarter')}
                            className="px-3 py-1.5 bg-[#17cf54] hover:bg-[#12a542] text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95"
                        >
                            <span className="material-symbols-outlined text-[16px]">add</span>
                            {t.config.addQuarter}
                        </button>
                    </div>
                    <div className="p-4">
                        {loadingQuarters ? (
                            <div className="text-center py-4 text-gray-400">{t.config.loadingConfig}</div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                                {quarters.length > 0 ? (
                                    quarters.map(q => renderCard(q.Name, null, 'quarter', q))
                                ) : (
                                    <p className="text-xs text-gray-400 col-span-full py-4 text-center">{t.config.noQuarters}</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Colors Section */}
                <div className="bg-white/80 dark:bg-[#1a2e22]/80 backdrop-blur-md border border-white/50 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                        <h2 className="text-lg font-bold text-[#0e1b12] dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#17cf54]">palette</span>
                            {t.config.colors}
                        </h2>
                        <button
                            onClick={() => openModal('color')}
                            className="px-3 py-1.5 bg-[#17cf54] hover:bg-[#12a542] text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95"
                        >
                            <span className="material-symbols-outlined text-[16px]">add</span>
                            {t.config.addColor}
                        </button>
                    </div>
                    <div className="p-4">
                        {loadingColors ? (
                            <div className="text-center py-4 text-gray-400">{t.config.loadingConfig}</div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                                {colors.length > 0 ? (
                                    colors.map(c => renderCard(c.name, c.hex, 'color', c, c.hex))
                                ) : (
                                    <p className="text-xs text-gray-400 col-span-full py-4 text-center">{t.config.noColors}</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sizes Section */}
                <div className="bg-white/80 dark:bg-[#1a2e22]/80 backdrop-blur-md border border-white/50 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                        <h2 className="text-lg font-bold text-[#0e1b12] dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#17cf54]">straighten</span>
                            {t.config.sizes}
                        </h2>
                        <button
                            onClick={() => openModal('size')}
                            className="px-3 py-1.5 bg-[#17cf54] hover:bg-[#12a542] text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95"
                        >
                            <span className="material-symbols-outlined text-[16px]">add</span>
                            {t.config.addSize}
                        </button>
                    </div>
                    <div className="p-4">
                        {loadingSizes ? (
                            <div className="text-center py-4 text-gray-400">{t.config.loadingConfig}</div>
                        ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                                {sizes.length > 0 ? (
                                    sortedSizes.map(s => {
                                        const categoryNames = s.Categories?.map(c => c.Name).join(', ') || t.common.generic;
                                        return renderCard(s.name, categoryNames, 'size', s);
                                    })
                                ) : (
                                    <p className="text-xs text-gray-400 col-span-full py-4 text-center">{t.config.noSizes}</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-[100] flex items-start md:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#1a2e22] rounded-2xl w-full max-w-md shadow-2xl border border-white/10 p-6 animate-fadeIn">
                        <h2 className="text-xl font-bold text-[#0e1b12] dark:text-white mb-6">
                            {editingItem ? t.common.edit : t.common.add} {modalType.charAt(0).toUpperCase() + modalType.slice(1)}
                        </h2>

                        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">{t.common.name}</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-[#f6f8f6] dark:bg-black/20 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 font-medium text-[#0e1b12] dark:text-white focus:ring-[#17cf54] focus:border-[#17cf54]"
                                        placeholder={t.config.enterName.replace('{type}', modalType)}
                                        autoFocus
                                    />
                                </div>

                                {modalType === 'brand' && (
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">{t.config.categories} <span className="text-red-400">*</span></label>
                                        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto bg-[#f6f8f6] dark:bg-black/20 border border-gray-200 dark:border-gray-600 rounded-xl p-3">
                                            {categories.map(c => (
                                                <label key={c.Id} className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        value={c.Id}
                                                        checked={formData.categoryIds.includes(c.Id)}
                                                        onChange={(e) => {
                                                            const id = parseInt(e.target.value);
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                categoryIds: e.target.checked
                                                                    ? [...prev.categoryIds, id]
                                                                    : prev.categoryIds.filter(cid => cid !== id)
                                                            }));
                                                        }}
                                                        className="w-4 h-4 text-[#17cf54] rounded focus:ring-[#17cf54] focus:ring-offset-0 dark:bg-black/20 dark:border-gray-600"
                                                    />
                                                    <span className="text-sm font-medium text-[#0e1b12] dark:text-gray-200">{c.Name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {modalType === 'color' && (
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">{t.config.colorHex}</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={formData.hex || '#000000'}
                                                onChange={e => setFormData({ ...formData, hex: e.target.value })}
                                                className="h-12 w-12 rounded-lg border border-gray-200 cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={formData.hex}
                                                onChange={e => setFormData({ ...formData, hex: e.target.value })}
                                                className="flex-1 bg-[#f6f8f6] dark:bg-black/20 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 font-medium text-[#0e1b12] dark:text-white focus:ring-[#17cf54] focus:border-[#17cf54]"
                                                placeholder="#000000"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* For Size, we might want Category selection */}
                                {modalType === 'size' && (
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">{t.config.categories} <span className="text-red-400">*</span></label>
                                        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto bg-[#f6f8f6] dark:bg-black/20 border border-gray-200 dark:border-gray-600 rounded-xl p-3">
                                            {categories.map(c => (
                                                <label key={c.Id} className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        value={c.Id}
                                                        checked={formData.categoryIds.includes(c.Id)}
                                                        onChange={(e) => {
                                                            const id = parseInt(e.target.value);
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                categoryIds: e.target.checked
                                                                    ? [...prev.categoryIds, id]
                                                                    : prev.categoryIds.filter(cid => cid !== id)
                                                            }));
                                                        }}
                                                        className="w-4 h-4 text-[#17cf54] rounded focus:ring-[#17cf54] focus:ring-offset-0 dark:bg-black/20 dark:border-gray-600"
                                                    />
                                                    <span className="text-sm font-medium text-[#0e1b12] dark:text-gray-200">{c.Name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="flex-1 py-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white font-bold hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
                                >
                                    {t.common.cancel}
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-[#17cf54] hover:bg-[#12a542] text-white font-bold rounded-xl shadow-lg shadow-green-500/20 transition-all"
                                >
                                    {t.common.saveChanges}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteModalOpen && (
                <div className="fixed inset-0 flex items-start md:items-center justify-center bg-black/60 backdrop-blur-sm z-[100] animate-fadeIn p-4 md:p-0 pt-4 md:pt-0">
                    <div className="bg-white dark:bg-[#1a2e22] rounded-2xl shadow-2xl p-6 w-[90%] max-w-md border border-gray-100 dark:border-[#2a4032]">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-red-500 text-[24px]">warning</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-text-main dark:text-white">Delete {deleteItem?.type}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t.config.confirmDelete || 'This action cannot be undone.'}</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                            Are you sure you want to delete this {deleteItem?.type}? This action cannot be undone.
                        </p>
                        <ConfirmDeleteInput
                            onConfirm={confirmDelete}
                            onCancel={cancelDelete}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
