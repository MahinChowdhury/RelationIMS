import { useState } from 'react';
import api from '../services/api';

interface ShareCatalogModalProps {
    show: boolean;
    onClose: () => void;
}

export default function ShareCatalogModal({ show, onClose }: ShareCatalogModalProps) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [shareUrl, setShareUrl] = useState('');
    const [created, setCreated] = useState(false);

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

        setLoading(true);
        try {
            const response = await api.post('/ShareCatalog', { password });
            const hash = response.data.shareHash;
            const url = `${window.location.origin}/products/share-catalog/${hash}`;
            setShareUrl(url);
            setCreated(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create share catalog.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
    };

    const handleClose = () => {
        setPassword('');
        setConfirmPassword('');
        setError('');
        setShareUrl('');
        setCreated(false);
        onClose();
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={handleClose}></div>
            <div className="relative bg-white dark:bg-[#203326] rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>

                <h2 className="text-xl font-bold text-text-main dark:text-white mb-4">
                    Share Catalog
                </h2>

                {created ? (
                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                            Share this link with others. The link will expire after 30 days.
                        </p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={shareUrl}
                                readOnly
                                className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-[#2a4032] border border-gray-200 dark:border-[#3d5a47] rounded-lg text-text-main dark:text-white"
                            />
                            <button
                                onClick={handleCopy}
                                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                            >
                                Copy
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
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
                            {error && (
                                <p className="text-sm text-red-500">{error}</p>
                            )}
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleClose}
                                className="flex-1 px-4 py-2 border border-gray-200 dark:border-[#3d5a47] rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Creating...' : 'Create Share Link'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
