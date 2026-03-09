import { useState, useEffect } from 'react';
import api from '../services/api';
import ConfirmDeleteInput from './ConfirmDeleteInput';

interface ShareCatalog {
    shareHash: string;
    password: string;
    createdAt: string;
    expiresAt: string;
    isExpired: boolean;
}

interface ShareCatalogModalProps {
    show: boolean;
    onClose: () => void;
}

export default function ShareCatalogModal({ show, onClose }: ShareCatalogModalProps) {
    const [shareCatalogs, setShareCatalogs] = useState<ShareCatalog[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [creating, setCreating] = useState(false);
    const [copiedHash, setCopiedHash] = useState<string | null>(null);
    const [copiedPasswordHash, setCopiedPasswordHash] = useState<string | null>(null);
    const [deletingHash, setDeletingHash] = useState<string | null>(null);

    useEffect(() => {
        if (show) {
            fetchShareCatalogs();
            setShowCreateForm(false);
            setPassword('');
            setConfirmPassword('');
            setError('');
        }
    }, [show]);

    const fetchShareCatalogs = async () => {
        setLoading(true);
        try {
            const response = await api.get('/ShareCatalog');
            setShareCatalogs(response.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load share catalogs.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        setError('');

        if (password.length < 4) {
            setError('Password must be at least 4 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setCreating(true);
        try {
            await api.post('/ShareCatalog', { password });
            setPassword('');
            setConfirmPassword('');
            setShowCreateForm(false);
            fetchShareCatalogs();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create share catalog.');
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteClick = (hash: string) => {
        setDeletingHash(hash);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingHash) return;

        try {
            await api.delete(`/ShareCatalog/${deletingHash}`);
            setDeletingHash(null);
            fetchShareCatalogs();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete share catalog.');
            setDeletingHash(null);
        }
    };

    const handleDeleteCancel = () => {
        setDeletingHash(null);
    };

    const handleCopyUrl = (hash: string) => {
        const url = `${window.location.origin}/products/share-catalog/${hash}`;
        navigator.clipboard.writeText(url);
        setCopiedHash(hash);
        setTimeout(() => setCopiedHash(null), 2000);
    };

    const handleCopyPassword = (hash: string, password: string) => {
        navigator.clipboard.writeText(password);
        setCopiedPasswordHash(hash);
        setTimeout(() => setCopiedPasswordHash(null), 2000);
    };

    const handleClose = () => {
        setPassword('');
        setConfirmPassword('');
        setError('');
        setShowCreateForm(false);
        onClose();
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={handleClose}></div>
            <div className="relative bg-white dark:bg-[#203326] rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[80vh] overflow-hidden flex flex-col">
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>

                <h2 className="text-xl font-bold text-text-main dark:text-white mb-4">
                    Share Catalog
                </h2>

                {error && (
                    <p className="text-sm text-red-500 mb-4">{error}</p>
                )}

                <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                    {loading ? (
                        <p className="text-center text-gray-500 py-4">Loading...</p>
                    ) : shareCatalogs.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">No share links yet.</p>
                    ) : (
                        shareCatalogs.map((catalog) => (
                            <div
                                key={catalog.shareHash}
                                className="p-3 bg-gray-50 dark:bg-[#2a4032] rounded-lg border border-gray-100 dark:border-[#3d5a47]"
                            >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                            Share URL
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm text-text-main dark:text-white truncate flex-1">
                                                {window.location.origin}/products/share-catalog/{catalog.shareHash}
                                            </p>
                                            <button
                                                onClick={() => handleCopyUrl(catalog.shareHash)}
                                                className="text-primary hover:text-primary/80 text-xs whitespace-nowrap"
                                            >
                                                {copiedHash === catalog.shareHash ? 'Copied!' : 'Copy'}
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteClick(catalog.shareHash)}
                                        className="text-red-500 hover:text-red-600 p-1"
                                        title="Delete"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                    </button>
                                </div>

                                <div className="flex items-center gap-4 mb-2">
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Password</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm text-text-main dark:text-white font-mono">
                                                {catalog.password}
                                            </p>
                                            <button
                                                onClick={() => handleCopyPassword(catalog.shareHash, catalog.password)}
                                                className="text-primary hover:text-primary/80 text-xs"
                                            >
                                                {copiedPasswordHash === catalog.shareHash ? 'Copied!' : 'Copy'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                    <span>Created: {formatDate(catalog.createdAt)}</span>
                                    <span>Expires: {formatDate(catalog.expiresAt)}</span>
                                    {catalog.isExpired && (
                                        <span className="text-red-500 font-medium">Expired</span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {showCreateForm ? (
                    <div className="border-t border-gray-100 dark:border-[#3d5a47] pt-4">
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                            Create a password to protect your shared catalog. Guests will need this password to view your products.
                        </p>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Password (min 4 characters)
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-[#3d5a47] rounded-lg bg-white dark:bg-[#2a4032] text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Enter password"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-[#3d5a47] rounded-lg bg-white dark:bg-[#2a4032] text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Confirm password"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => setShowCreateForm(false)}
                                className="flex-1 px-4 py-2 border border-gray-200 dark:border-[#3d5a47] rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={creating}
                                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                                {creating ? 'Creating...' : 'Create'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="w-full px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        Create New Share Link
                    </button>
                )}

                {deletingHash && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[60] animate-fadeIn">
                        <div className="bg-white dark:bg-[#203326] rounded-2xl shadow-2xl p-6 w-[90%] max-w-md border border-gray-100 dark:border-[#3d5a47]">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                                    <span className="material-symbols-outlined text-red-500 text-[24px]">warning</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-text-main dark:text-white">Delete Share Link</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone.</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                                Are you sure you want to delete this share link? Users will no longer be able to access the shared catalog.
                            </p>
                            <ConfirmDeleteInput
                                onConfirm={handleDeleteConfirm}
                                onCancel={handleDeleteCancel}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
