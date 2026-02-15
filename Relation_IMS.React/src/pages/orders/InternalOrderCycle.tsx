import { Link, useNavigate } from 'react-router-dom';
import { type Order, OrderInternalStatus } from '../../types';
import { useState } from 'react';
import api from '../../services/api';

interface InternalOrderCycleProps {
    order: Order;
}

export default function InternalOrderCycle({ order }: InternalOrderCycleProps) {
    const navigate = useNavigate();
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [loading, setLoading] = useState(false);

    const finalizeOrder = async () => {
        setLoading(true);
        try {
            // Fix 413 Error: Only send necessary update DTO fields, not the entire Order object
            const updatePayload = {
                CustomerId: order.CustomerId,
                TotalAmount: order.TotalAmount,
                Discount: order.Discount,
                NetAmount: order.NetAmount,
                PaidAmount: order.PaidAmount,
                PaymentStatus: order.PaymentStatus,
                UserId: order.UserId,
                Remarks: order.Remarks,
                InternalStatus: OrderInternalStatus.Confirmed
            };

            await api.put(`/Order/${order.Id}`, updatePayload);
            setShowConfirmModal(false);
            setShowPrintModal(true);
        } catch (err) {
            console.error("Failed to confirm order", err);
            alert("Failed to confirm order.");
        } finally {
            setLoading(false);
        }
    };

    const handlePrintInvoice = () => {
        setShowPrintModal(false);
        // Simple print trigger, ideally this would link to a printable view or PDF generation
        window.print();
        navigate(0);
    };

    const handleNoPrint = () => {
        setShowPrintModal(false);
        navigate(0);
    };

    // Calculate progress percentage based on current status and visible steps
    const getProgressPercentage = () => {
        // Steps count is 3: Created (0%), Arrangement (50%), Confirmed (100%)
        if (order.InternalStatus >= OrderInternalStatus.Confirmed) return 100;
        if (order.InternalStatus === OrderInternalStatus.Arranged) return 75; // Midway between Arrangement and Confirmed
        if (order.InternalStatus >= OrderInternalStatus.Arranging) return 50;
        return 0;
    };

    const steps = [
        { label: 'Created', status: OrderInternalStatus.Created, icon: 'add_shopping_cart' },
        { label: 'Arrangement', status: OrderInternalStatus.Arranging, icon: 'fact_check' },
        { label: 'Confirmed', status: OrderInternalStatus.Confirmed, icon: 'check_circle' },
    ];

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-background-light dark:bg-background-dark">
            <div className="max-w-3xl w-full">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                        <span className="material-symbols-outlined text-5xl text-primary">deployed_code</span>
                    </div>
                    <h1 className="text-3xl font-black text-text-main dark:text-white mb-2">Internal Order Cycle</h1>
                    <p className="text-text-secondary">Order #ORD-{order.Id} is currently in progress.</p>
                </div>

                <div className="relative flex justify-between items-center w-full mb-16">
                    {/* Progress Bar Background */}
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700 -translate-y-1/2 rounded-full" style={{ zIndex: 0 }}></div>

                    {/* Green line between Created and Arrangement */}
                    <div className="absolute top-1/2 left-0 h-2 bg-green-500 -translate-y-1/2 rounded-full" style={{ width: '50%', zIndex: 1 }}></div>

                    {/* Active Progress */}
                    <div
                        className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${getProgressPercentage()}%`, zIndex: 2 }}
                    ></div>

                    {steps.map((step, index) => {
                        // Logic refactored for clarity:
                        // "Complete" means we have passed this stage.
                        // "Arrangement" is passed if status > Arranging (so Arranged or Confirmed).
                        // "Created" is passed if status > Created.

                        let isComplete = false;
                        if (step.status === OrderInternalStatus.Created) isComplete = order.InternalStatus > OrderInternalStatus.Created;
                        if (step.status === OrderInternalStatus.Arranging) isComplete = order.InternalStatus >= OrderInternalStatus.Arranged; // Arranged counts as completing "Arranging" step
                        if (step.status === OrderInternalStatus.Confirmed) isComplete = order.InternalStatus === OrderInternalStatus.Confirmed;

                        const isArranged = order.InternalStatus === OrderInternalStatus.Arranged;

                        // Current logic: 
                        // If Created -> Created is current
                        // If Arranging -> Arrangement is current
                        // If Arranged -> Confirmed is the *Next/Target* current (but waiting action)
                        // If Confirmed -> Confirmed is current/done

                        let isCurrent = false;
                        if (order.InternalStatus === OrderInternalStatus.Created && step.status === OrderInternalStatus.Created) isCurrent = true;
                        if (order.InternalStatus === OrderInternalStatus.Arranging && step.status === OrderInternalStatus.Arranging) isCurrent = true;
                        if (order.InternalStatus === OrderInternalStatus.Arranged && step.status === OrderInternalStatus.Confirmed) isCurrent = true;
                        if (order.InternalStatus === OrderInternalStatus.Confirmed && step.status === OrderInternalStatus.Confirmed) isCurrent = true;

                        // Actionable checking logic
                        const isConfirmActionable = step.status === OrderInternalStatus.Confirmed && isArranged;

                        // Determine Link target based on step status
                        let linkTarget = null;
                        if (step.status === OrderInternalStatus.Created) linkTarget = `/orders/${order.Id}?view=details`;
                        if (step.status === OrderInternalStatus.Arranging) linkTarget = `/arrangement/${order.Id}`;

                        const StepContent = (
                            <>
                                <div className={`
                                    w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-300
                                    ${isConfirmActionable ? 'cursor-pointer animate-pulse hover:scale-110 shadow-lg shadow-primary/30' : 'cursor-default'}
                                    ${linkTarget ? 'cursor-pointer' : ''}
                                    bg-background-light dark:bg-background-dark
                                    
                                    /* Colors */
                                    ${isComplete ? 'bg-green-500 border-green-500 text-white' : ''}
                                    ${!isComplete && step.status === OrderInternalStatus.Confirmed && isArranged ? 'bg-white dark:bg-gray-800 border-primary text-primary scale-110 shadow-lg' : ''} 
                                    ${!isComplete && isCurrent && step.status !== OrderInternalStatus.Confirmed ? 'bg-white dark:bg-gray-800 border-primary text-primary scale-110 shadow-lg' : ''}
                                    ${!isComplete && !isCurrent && !isConfirmActionable ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-400 group-hover:border-primary/50' : ''}
                                `} style={{ zIndex: 10 }}>
                                    <span className="material-symbols-outlined text-xl">
                                        {isComplete ? 'check' : step.icon}
                                    </span>
                                </div>
                                <div className="absolute top-14 w-32 text-center">
                                    <span className={`text-sm font-bold block 
                                        ${isCurrent && step.status === OrderInternalStatus.Confirmed && isComplete ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 bg-clip-text text-transparent' : ''}
                                        ${isConfirmActionable ? 'text-primary' : ''}
                                        ${!isConfirmActionable && !isCurrent ? 'text-text-main dark:text-gray-400' : ''}
                                        ${isCurrent && !isComplete ? 'text-primary' : ''}
                                    `}>
                                        {step.label}
                                    </span>

                                    {/* Labels */}
                                    {isCurrent && !isConfirmActionable && !isComplete && (
                                        <span className="text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block text-primary bg-primary/10">
                                            Current Stage
                                        </span>
                                    )}
                                    {isConfirmActionable && (
                                        <span className="text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block bg-primary text-white animate-bounce shadow-lg shadow-primary/30">
                                            Click to Confirm
                                        </span>
                                    )}
                                    {isComplete && step.status === OrderInternalStatus.Confirmed && (
                                        <span className="text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block bg-green-100 text-green-700">
                                            Completed
                                        </span>
                                    )}
                                </div>
                            </>
                        );

                        return (
                            <div key={index} className="flex flex-col items-center relative gap-3 group">
                                {linkTarget ? (
                                    <Link to={linkTarget} className="flex flex-col items-center">
                                        {StepContent}
                                    </Link>
                                ) : (
                                    <div
                                        className={`flex flex-col items-center ${isConfirmActionable ? 'cursor-pointer' : ''}`}
                                        onClick={() => isConfirmActionable && setShowConfirmModal(true)}
                                    >
                                        {StepContent}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="flex flex-row gap-4 justify-center mt-12 flex-wrap">
                    <Link
                        to={`/orders/${order.Id}?view=details`}
                        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-primary hover:text-primary transition-colors flex items-center gap-2 text-sm"
                    >
                        <span className="material-symbols-outlined text-lg">visibility</span>
                        View Order Details
                    </Link>

                    {(order.InternalStatus === OrderInternalStatus.Created || order.InternalStatus === OrderInternalStatus.Arranging || order.InternalStatus === OrderInternalStatus.Arranged) && order.InternalStatus < OrderInternalStatus.Confirmed && (
                        <Link
                            to={`/arrangement/${order.Id}`}
                            className={`px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-primary hover:text-primary transition-colors flex items-center gap-2 text-sm ${order.InternalStatus === OrderInternalStatus.Arranged ? 'bg-green-50 dark:bg-green-900/20' : ''}`}
                        >
                            <span className="material-symbols-outlined text-lg">fact_check</span>
                            {order.InternalStatus === OrderInternalStatus.Arranged ? 'View Arrangement' : 'Start Arrangement'}
                        </Link>
                    )}

                    {order.InternalStatus === OrderInternalStatus.Arranged && (
                        <button
                            onClick={() => setShowConfirmModal(true)}
                            disabled={loading}
                            className="px-6 py-2 rounded-lg bg-primary text-white font-bold hover:bg-primary-dark transition-all shadow-lg shadow-green-500/30 flex items-center gap-2 text-sm animate-in fade-in"
                        >
                            {loading ? (
                                <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                            ) : (
                                <span className="material-symbols-outlined text-lg">check_circle</span>
                            )}
                            Confirm Order Completion
                        </button>
                    )}
                </div>
            </div>

            {/* Final Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1a2e22] rounded-2xl shadow-2xl max-w-md w-full p-6 border border-[#e7f3eb] dark:border-[#2a4032] transform scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-4xl text-primary">verified</span>
                            </div>
                            <h3 className="text-xl font-bold text-text-main dark:text-white mb-2">Final Confirmation</h3>
                            <p className="text-text-secondary dark:text-gray-400 text-sm leading-relaxed">
                                Are you sure you want to mark this order as <strong className="text-primary">Fully Confirmed</strong>?
                                <br />
                                This action is irreversible.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 text-text-main dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={finalizeOrder}
                                className="flex-1 px-4 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors shadow-lg shadow-green-200/50 dark:shadow-none"
                            >
                                Yes, Complete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Print Invoice Modal */}
            {showPrintModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1a2e22] rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-[#e7f3eb] dark:border-[#2a4032] transform scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center mb-6">
                            <h3 className="text-xl font-bold text-text-main dark:text-white mb-2">Order Confirmed! 🎉</h3>
                            <p className="text-text-secondary dark:text-gray-400 text-sm">
                                Do you want to print the invoice now?
                            </p>
                        </div>
                        <div className="flex gap-3 flex-col">
                            <button
                                onClick={handlePrintInvoice}
                                className="w-full px-4 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors shadow-lg flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined">print</span>
                                Yes, Print Invoice
                            </button>
                            <button
                                onClick={handleNoPrint}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 text-text-secondary dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 font-medium transition-colors"
                            >
                                No, thanks
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}