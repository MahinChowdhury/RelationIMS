import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <nav className="bg-[#f8fcf9] font-sans">
            <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">

                {/* Logo */}
                <div className="flex items-center gap-4 text-[#17B169]">
                    <div className="size-4">
                        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M24 4C25.7818 14.2173 33.7827 22.2182 44 24C33.7827 25.7818 25.7818 33.7827 24 44C22.2182 33.7827 14.2173 25.7818 4 24C14.2173 22.2182 22.2182 14.2173 24 4Z"
                                fill="currentColor"
                            ></path>
                        </svg>
                    </div>
                    <Link to="/" className="text-[#0e1b12] hover:text-[#17B169] text-2xl font-bold leading-tight tracking-[-0.015em]">
                        Relation
                    </Link>
                </div>

                {/* Right buttons */}
                <div className="flex md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
                    <button
                        className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-8 px-4 my-1 bg-[#32de84] hover:bg-[#49796B] hover:text-[#FAF9F6] text-[#0e1b12] text-sm font-medium leading-normal">
                        <span className="truncate">Create Order</span>
                    </button>

                    {/* Hamburger button */}
                    <button
                        onClick={toggleMenu}
                        type="button"
                        className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200">
                        <span className="sr-only">Open main menu</span>
                        <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                d="M1 1h15M1 7h15M1 13h15" />
                        </svg>
                    </button>
                </div>

                {/* Collapsible menu */}
                <div
                    className={`${isMenuOpen ? 'block' : 'hidden'
                        } w-full md:flex md:w-auto md:order-1 transition-all duration-300 ease-in-out`}
                >
                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-9 py-2 md:py-0">
                        <Link to="/dashboard" className="text-[#0e1b12] hover:text-[#17B169] text-base font-medium leading-normal">Dashboard</Link>
                        <Link to="/products" className="text-[#0e1b12] hover:text-[#17B169] text-base font-medium leading-normal">Products</Link>
                        <Link to="/orders" className="text-[#0e1b12] hover:text-[#17B169] text-base font-medium leading-normal">Orders</Link>
                        <Link to="/customers" className="text-[#0e1b12] hover:text-[#17B169] text-base font-medium leading-normal">Customers</Link>
                        <Link to="/reports" className="text-[#0e1b12] hover:text-[#17B169] text-base font-medium leading-normal">Reports</Link>
                        <Link to="/inventory" className="text-[#0e1b12] hover:text-[#17B169] text-base font-medium leading-normal">Inventory</Link>
                    </div>
                </div>

            </div>
        </nav>
    );
}
