import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        firstname: '',
        lastname: '',
        phoneNumber: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError(t.auth.passwordsDontMatch);
            return;
        }
        setLoading(true);
        setError('');

        try {
            await register(formData.firstname, formData.lastname, formData.phoneNumber, formData.password);
            navigate('/login');
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Registration failed. Please try again.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center p-4 bg-background-light dark:bg-background-dark overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/20 rounded-full filter blur-[100px] opacity-50 animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-blue-400/10 dark:bg-blue-900/10 rounded-full filter blur-[100px] opacity-40 animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Pattern Overlay */}
            <div className="absolute inset-0 z-0 bg-pattern"></div>

            <main className="relative z-10 w-full max-w-md mx-auto">
                <div className="glass-panel p-8 md:p-12 rounded-2xl shadow-2xl backdrop-blur-xl">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center bg-primary/10 rounded-full p-3 mb-4 ring-1 ring-primary/20">
                            <span className="material-symbols-outlined text-primary text-3xl">
                                eco
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold text-text-main font-display">{t.auth.createAccount}</h1>
                        <p className="text-text-secondary mt-2">{t.auth.joinSubtitle}</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label htmlFor="firstname" className="block text-sm font-medium text-text-main mb-1">
                                    {t.common.name} ({t.auth.fullName})
                                </label>
                                <input
                                    id="firstname"
                                    name="firstname"
                                    type="text"
                                    autoComplete="given-name"
                                    required
                                    value={formData.firstname}
                                    onChange={handleChange}
                                    className="block w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-text-main placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                                    placeholder="First"
                                />
                            </div>
                            <div>
                                <label htmlFor="lastname" className="block text-sm font-medium text-text-main mb-1">
                                    &nbsp;
                                </label>
                                <input
                                    id="lastname"
                                    name="lastname"
                                    type="text"
                                    autoComplete="family-name"
                                    value={formData.lastname}
                                    onChange={handleChange}
                                    className="block w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-text-main placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                                    placeholder="Last"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="phoneNumber" className="block text-sm font-medium text-text-main mb-1">
                                {t.auth.phoneNumber}
                            </label>
                            <input
                                id="phoneNumber"
                                name="phoneNumber"
                                type="tel"
                                autoComplete="tel"
                                required
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                className="block w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-text-main placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                                placeholder="01XXXXXXXXX"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-text-main mb-1">
                                {t.auth.password}
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className="block w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-text-main placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                                placeholder="••••••••"
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-main mb-1">
                                {t.auth.confirmPassword}
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="block w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-text-main placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:translate-y-[-1px] active:translate-y-[1px]"
                            >
                                {loading ? t.auth.creatingAccount : t.auth.register}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-text-secondary">
                            {t.auth.alreadyHaveAccount}{' '}
                            <Link to="/login" className="font-medium text-primary hover:text-primary-dark transition-colors">
                                {t.auth.signIn}
                            </Link>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Register;
