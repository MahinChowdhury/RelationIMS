import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
    const navigate = useNavigate();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate login API call
        setTimeout(() => {
            setLoading(false);
            navigate('/dashboard');
        }, 1500);
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
                        <h1 className="text-3xl font-bold text-text-main font-display">Welcome Back</h1>
                        <p className="text-text-secondary mt-2">Sign in to manage your inventory.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-text-main mb-1">
                                Phone Number
                            </label>
                            <div className="relative">
                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    autoComplete="tel"
                                    required
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    className="block w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-text-main placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                                    placeholder="01700000000"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-text-main mb-1">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
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
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-text-main cursor-pointer">
                                    Remember me
                                </label>
                            </div>

                            <div className="text-sm">
                                <a href="#" className="font-medium text-primary hover:text-primary-dark transition-colors">
                                    Forgot password?
                                </a>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:translate-y-[-1px] active:translate-y-[1px]"
                            >
                                {loading ? 'Signing in...' : 'Login'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-text-secondary">
                            Don't have an account?{' '}
                            <Link to="/register" className="font-medium text-primary hover:text-primary-dark transition-colors">
                                Register now
                            </Link>
                        </p>
                    </div>
                </div>

                <p className="mt-8 text-center text-sm text-text-secondary opacity-75">
                    Relation Inventory Management System
                </p>
            </main>
        </div>
    );
};

export default Login;
