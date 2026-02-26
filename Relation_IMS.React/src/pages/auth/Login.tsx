import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { login } = useAuth();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await login(phoneNumber, password);
            navigate('/');
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Login failed. Please check your credentials.';
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
                        <div className="inline-flex items-center justify-center bg-primary/10 rounded-full p-4 mb-4 ring-1 ring-primary/20">
                            <span className="material-symbols-outlined text-primary text-4xl">
                                temp_preferences_custom
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold text-text-main font-display">{t.auth.welcomeBack}</h1>
                        <p className="text-text-secondary mt-2">{t.auth.signInSubtitle}</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="phoneNumber" className="block text-sm font-medium text-text-main mb-1">
                                {t.auth.phoneNumber}
                            </label>
                            <div className="relative">
                                <input
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    type="tel"
                                    autoComplete="tel"
                                    required
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    className="block w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-text-main placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                                    placeholder="01XXXXXXXXX"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-text-main mb-1">
                                {t.auth.password}
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-text-main placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="show-password"
                                    name="show-password"
                                    type="checkbox"
                                    checked={showPassword}
                                    onChange={(e) => setShowPassword(e.target.checked)}
                                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer transition-transform active:scale-90"
                                />
                                <label htmlFor="show-password" className="ml-2 block text-sm text-text-main cursor-pointer select-none">
                                    {t.auth.showPassword}
                                </label>
                            </div>

                            <div className="text-sm">
                                <a href="#" className="font-medium text-primary hover:text-primary-dark transition-colors">
                                    {t.auth.forgotPassword}
                                </a>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:translate-y-[-1px] active:translate-y-[1px]"
                            >
                                {loading ? t.auth.signingIn : t.auth.login}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-text-secondary">
                            {t.auth.dontHaveAccount}{' '}
                            <Link to="/register" className="font-medium text-primary hover:text-primary-dark transition-colors">
                                {t.auth.registerNow}
                            </Link>
                        </p>
                    </div>
                </div>

                <p className="mt-8 text-center text-sm text-text-secondary opacity-75">
                    {t.app.fullName}
                </p>
            </main>
        </div>
    );
};

export default Login;
