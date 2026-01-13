import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            alert("Passwords don't match!");
            return;
        }
        setLoading(true);
        // Simulate register API call
        setTimeout(() => {
            setLoading(false);
            navigate('/login');
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
                        <div className="inline-flex items-center justify-center bg-primary/10 rounded-full p-3 mb-4 ring-1 ring-primary/20">
                            <span className="material-symbols-outlined text-primary text-3xl">
                                eco
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold text-text-main font-display">Create Account</h1>
                        <p className="text-text-secondary mt-2">Join to manage your inventory intelligently.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-text-main mb-1">
                                Full Name
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                autoComplete="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                className="block w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-text-main placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                                placeholder="John Doe"
                            />
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-text-main mb-1">
                                Phone Number
                            </label>
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                autoComplete="tel"
                                required
                                value={formData.phone}
                                onChange={handleChange}
                                className="block w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-text-main placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                                placeholder="01700000000"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-text-main mb-1">
                                Password
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
                                Confirm Password
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
                                {loading ? 'Creating Account...' : 'Register'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-text-secondary">
                            Already have an account?{' '}
                            <Link to="/login" className="font-medium text-primary hover:text-primary-dark transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Register;
