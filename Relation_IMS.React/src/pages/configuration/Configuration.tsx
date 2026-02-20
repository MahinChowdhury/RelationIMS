import { useState, useEffect } from 'react';
import api from '../../services/api';

// --- Types ---
interface Brand { Id: number; Name: string; CategoryId: number; }
interface Category { Id: number; Name: string; }
interface Color { id: number; name: string; hex: string; }
interface Size { id: number; name: string; categoryId?: number; }

// --- Types for API Payloads ---

export default function Configuration() {
    // --- State ---
    const [brands, setBrands] = useState<Brand[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [colors, setColors] = useState<Color[]>([]);
    const [sizes, setSizes] = useState<Size[]>([]);

    const [loading, setLoading] = useState(true);

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'brand' | 'category' | 'color' | 'size'>('brand');
    const [editingItem, setEditingItem] = useState<any>(null);

    // Form State
    const [formData, setFormData] = useState({ name: '', hex: '', categoryId: 0 });

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        setLoading(true);
        try {
            // Helper to safe load so one failure doesn't break the page
            const safeGet = async (url: string) => {
                try { return await api.get(url); } catch (e) { console.error(`Failed to load ${url}`, e); return { data: [] }; }
            };

            const [brandRes, catRes, colorRes, sizeRes] = await Promise.all([
                safeGet('/Brand'),
                safeGet('/Category'),
                safeGet('/ProductVariantColors'),
                safeGet('/ProductVariantSizes')
            ]);

            setBrands(brandRes.data);
            setCategories(catRes.data);

            setColors(colorRes.data.map((c: any) => ({ id: c.Id, name: c.Name, hex: c.HexCode })));

            // Backend returns: { Id, Name, CategoryId }
            setSizes(sizeRes.data.map((s: any) => ({ id: s.Id, name: s.Name, categoryId: s.CategoryId })));

        } catch (error) {
            console.error("Failed to load configuration data", error);
        } finally {
            setLoading(false);
        }
    };

    // --- Handlers ---

    const openModal = (type: 'brand' | 'category' | 'color' | 'size', item?: any) => {
        setModalType(type);
        setEditingItem(item);
        setModalOpen(true);

        // Reset or Fill Form
        if (item) {
            setFormData({
                name: item.Name || item.name,
                hex: item.hex || item.HexCode || '',
                categoryId: item.CategoryId || 0
            });
        } else {
            setFormData({ name: '', hex: '', categoryId: 0 });
        }
    };

    const handleDelete = async (type: 'brand' | 'category' | 'color' | 'size', id: number) => {
        if (!window.confirm("Are you sure you want to delete this item?")) return;

        try {
            let endpoint = '';
            switch (type) {
                case 'brand': endpoint = `/Brand/${id}`; break;
                case 'category': endpoint = `/Category/${id}`; break;
                case 'color': endpoint = `/ProductVariantColors/${id}`; break;
                case 'size': endpoint = `/ProductVariantSizes/${id}`; break;
            }

            await api.delete(endpoint);
            loadAllData(); // Refresh list
        } catch (error) {
            console.error("Delete failed", error);
            alert("Failed to delete item.");
        }
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
                    payload = { Name: formData.name, CategoryId: formData.categoryId };
                    break;
                case 'category':
                    endpoint = isEdit ? `/Category/${id}` : '/Category';
                    payload = { Name: formData.name };
                    break;
                case 'color':
                    endpoint = isEdit ? `/ProductVariantColors/${id}` : '/ProductVariantColors';
                    payload = { Name: formData.name, HexCode: formData.hex };
                    break;
                case 'size':
                    endpoint = isEdit ? `/ProductVariantSizes/${id}` : '/ProductVariantSizes';
                    payload = { Name: formData.name, CategoryId: formData.categoryId || 1 }; // Default cat ID if needed?
                    break;
            }

            if (isEdit) {
                await api.put(endpoint, payload);
            } else {
                await api.post(endpoint, payload);
            }

            setModalOpen(false);
            loadAllData();
        } catch (error) {
            console.error("Save failed", error);
            alert("Failed to save changes.");
        }
    };


    const renderCard = (title: string, subtitle: string | null, type: 'brand' | 'category' | 'color' | 'size', item: any, colorHex?: string) => (
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
                    onClick={() => handleDelete(type, item.Id || item.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex-1 overflow-y-auto bg-[#f6f8f6] dark:bg-[#112116] p-6 md:p-8">
            <div className="max-w-6xl mx-auto flex flex-col gap-12 pb-20">

                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-extrabold text-[#0e1b12] dark:text-white">Configuration</h1>
                    <p className="text-[#4e9767] dark:text-gray-400">Manage your product attributes and metadata.</p>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-gray-400 font-bold">Loading Configuration...</div>
                ) : (
                    <>
                        {/* Brands Section */}
                        <div className="bg-white/80 dark:bg-[#1a2e22]/80 backdrop-blur-md border border-white/50 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                                <h2 className="text-lg font-bold text-[#0e1b12] dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#17cf54]">verified</span>
                                    Brands
                                </h2>
                                <button
                                    onClick={() => openModal('brand')}
                                    className="px-3 py-1.5 bg-[#17cf54] hover:bg-[#12a542] text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-[16px]">add</span>
                                    Add Brand
                                </button>
                            </div>
                            <div className="p-4">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                                    {brands.length > 0 ? (
                                        brands.map(b => renderCard(b.Name, categories.find(c => c.Id === b.CategoryId)?.Name || null, 'brand', b))
                                    ) : (
                                        <p className="text-xs text-gray-400 col-span-full py-4 text-center">No brands configured yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Categories Section */}
                        <div className="bg-white/80 dark:bg-[#1a2e22]/80 backdrop-blur-md border border-white/50 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                                <h2 className="text-lg font-bold text-[#0e1b12] dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#17cf54]">category</span>
                                    Categories
                                </h2>
                                <button
                                    onClick={() => openModal('category')}
                                    className="px-3 py-1.5 bg-[#17cf54] hover:bg-[#12a542] text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-[16px]">add</span>
                                    Add Category
                                </button>
                            </div>
                            <div className="p-4">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                                    {categories.length > 0 ? (
                                        categories.map(c => renderCard(c.Name, null, 'category', c))
                                    ) : (
                                        <p className="text-xs text-gray-400 col-span-full py-4 text-center">No categories configured yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Colors Section */}
                        <div className="bg-white/80 dark:bg-[#1a2e22]/80 backdrop-blur-md border border-white/50 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                                <h2 className="text-lg font-bold text-[#0e1b12] dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#17cf54]">palette</span>
                                    Colors
                                </h2>
                                <button
                                    onClick={() => openModal('color')}
                                    className="px-3 py-1.5 bg-[#17cf54] hover:bg-[#12a542] text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-[16px]">add</span>
                                    Add Color
                                </button>
                            </div>
                            <div className="p-4">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                                    {colors.length > 0 ? (
                                        colors.map(c => renderCard(c.name, c.hex, 'color', c, c.hex))
                                    ) : (
                                        <p className="text-xs text-gray-400 col-span-full py-4 text-center">No colors configured yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sizes Section */}
                        <div className="bg-white/80 dark:bg-[#1a2e22]/80 backdrop-blur-md border border-white/50 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                                <h2 className="text-lg font-bold text-[#0e1b12] dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#17cf54]">straighten</span>
                                    Sizes
                                </h2>
                                <button
                                    onClick={() => openModal('size')}
                                    className="px-3 py-1.5 bg-[#17cf54] hover:bg-[#12a542] text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-[16px]">add</span>
                                    Add Size
                                </button>
                            </div>
                            <div className="p-4">
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                                    {sizes.length > 0 ? (
                                        [...sizes]
                                            .sort((a, b) => {
                                                const catA = categories.find(c => c.Id === a.categoryId)?.Name || 'Generic';
                                                const catB = categories.find(c => c.Id === b.categoryId)?.Name || 'Generic';
                                                if (catA !== catB) return catA.localeCompare(catB);
                                                return a.name.localeCompare(b.name);
                                            })
                                            .map(s => {
                                                const categoryName = categories.find(c => c.Id === s.categoryId)?.Name;
                                                return renderCard(s.name, categoryName || 'Generic', 'size', s);
                                            })
                                    ) : (
                                        <p className="text-xs text-gray-400 col-span-full py-4 text-center">No sizes configured yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#1a2e22] rounded-2xl w-full max-w-md shadow-2xl border border-white/10 p-6 animate-fadeIn">
                        <h2 className="text-xl font-bold text-[#0e1b12] dark:text-white mb-6">
                            {editingItem ? 'Edit' : 'Add'} {modalType.charAt(0).toUpperCase() + modalType.slice(1)}
                        </h2>

                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-[#f6f8f6] dark:bg-black/20 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 font-medium focus:ring-[#17cf54] focus:border-[#17cf54]"
                                    placeholder={`Enter ${modalType} name...`}
                                    autoFocus
                                />
                            </div>

                            {modalType === 'brand' && (
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Category <span className="text-red-400">*</span></label>
                                    <select
                                        value={formData.categoryId}
                                        onChange={e => setFormData({ ...formData, categoryId: parseInt(e.target.value) })}
                                        className="w-full bg-[#f6f8f6] dark:bg-black/20 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 font-medium focus:ring-[#17cf54] focus:border-[#17cf54]"
                                    >
                                        <option value={0} disabled>Select a category...</option>
                                        {categories.map(c => (
                                            <option key={c.Id} value={c.Id}>{c.Name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {modalType === 'color' && (
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Color Hex</label>
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
                                            className="flex-1 bg-[#f6f8f6] dark:bg-black/20 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 font-medium focus:ring-[#17cf54] focus:border-[#17cf54]"
                                            placeholder="#000000"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* For Size, we might want Category selection, although user didn't explicitly ask for it, the backend often implies it. For simplicity, we can offer it or default it. */}
                            {modalType === 'size' && (
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Category (Optional)</label>
                                    <select
                                        value={formData.categoryId}
                                        onChange={e => setFormData({ ...formData, categoryId: parseInt(e.target.value) })}
                                        className="w-full bg-[#f6f8f6] dark:bg-black/20 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 font-medium focus:ring-[#17cf54] focus:border-[#17cf54]"
                                    >
                                        <option value={0}>Generic / All</option>
                                        {categories.map(c => (
                                            <option key={c.Id} value={c.Id}>{c.Name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setModalOpen(false)}
                                className="flex-1 py-3 text-gray-500 hover:text-gray-700 font-bold hover:bg-gray-50 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 py-3 bg-[#17cf54] hover:bg-[#12a542] text-white font-bold rounded-xl shadow-lg shadow-green-500/20 transition-all"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
