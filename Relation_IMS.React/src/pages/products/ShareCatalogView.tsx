import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import ProductsPage from './Products';
import { API_BASE_URL } from '../../services/api';

export default function ShareCatalogView() {
    const { hash } = useParams<{ hash: string }>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [requiresPassword, setRequiresPassword] = useState(true);
    const [password, setPassword] = useState('');
    const [verified, setVerified] = useState(false);

    useEffect(() => {
        checkCatalog();
    }, []);

    const checkCatalog = async () => {
        setLoading(true);
        try {
            const savedPassword = sessionStorage.getItem(`catalog_pwd_${hash}`);

            if (savedPassword) {
                try {
                    const res = await axios.post(`${API_BASE_URL}/ShareCatalog/${hash}/verify`, {
                        password: savedPassword
                    });
                    if (res.data.valid) {
                        setPassword(savedPassword);
                        setRequiresPassword(false);
                        setVerified(true);
                        setLoading(false);
                        return;
                    }
                } catch (e) {
                    sessionStorage.removeItem(`catalog_pwd_${hash}`);
                }
            }

            const res = await axios.get(`${API_BASE_URL}/ShareCatalog/${hash}`);
            if (res.data.requiresPassword) {
                setRequiresPassword(true);
            } else {
                setRequiresPassword(false);
                setVerified(true);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Unable to access share catalog.');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) return;

        setLoading(true);
        setError('');
        try {
            const res = await axios.post(`${API_BASE_URL}/ShareCatalog/${hash}/verify`, {
                password
            });
            if (res.data.valid) {
                setRequiresPassword(false);
                setVerified(true);
                sessionStorage.setItem(`catalog_pwd_${hash}`, password);
            } else {
                setError('Invalid password');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid password');
        } finally {
            setLoading(false);
        }
    };

    if (loading && requiresPassword) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error && !verified) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
                <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">error</span>
                <p className="text-gray-500 text-center">{error}</p>
                <Link to="/products" className="mt-4 text-primary hover:underline">
                    Go to your products
                </Link>
            </div>
        );
    }

    if (requiresPassword) {
        return (
            <div className="flex items-center justify-center min-h-[400px] p-4">
                <div className="bg-white dark:bg-[#203326] rounded-2xl shadow-lg p-8 w-full max-w-md">
                    <div className="text-center mb-6">
                        <span className="material-symbols-outlined text-5xl text-primary mb-2">lock</span>
                        <h2 className="text-xl font-bold text-text-main dark:text-white">
                            Protected Catalog
                        </h2>
                        <p className="text-sm text-gray-500 mt-2">
                            Enter the password to view this product catalog.
                        </p>
                    </div>
                    <form onSubmit={handlePasswordSubmit}>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            className="w-full px-4 py-3 border border-gray-200 dark:border-[#3d5a47] rounded-xl bg-white dark:bg-[#2a4032] text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary mb-4"
                            autoFocus
                        />
                        {error && (
                            <p className="text-sm text-red-500 mb-4">{error}</p>
                        )}
                        <button
                            type="submit"
                            disabled={loading || !password}
                            className="w-full py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Verifying...' : 'View Catalog'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <ProductsPage
            isGuestView={true}
            password={password}
        />
    );
}
