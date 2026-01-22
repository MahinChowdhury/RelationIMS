import { Link } from 'react-router-dom';
import { type Order, OrderInternalStatus } from '../../types';

interface InternalOrderCycleProps {
    order: Order;
}

export default function InternalOrderCycle({ order }: InternalOrderCycleProps) {



    // Calculate progress percentage based on current status and visible steps
    const getProgressPercentage = () => {
        // Steps count is 3: Created (0%), Arrangement (50%), Confirmed (100%)
        // If status is "Arranging" (1), we want it to be 50% to match the second node.
        // If status is "Arranged" (2), it should also be at least 50% (maybe slightly more or just stay there).
        // If status is "Confirmed" (3), it is 100%.

        if (order.InternalStatus >= OrderInternalStatus.Confirmed) return 100;
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
                        const isComplete = order.InternalStatus > step.status;
                        // Special handling for Arrangement node: it acts as current for both Arranging and Arranged statuses
                        const isArrangementNode = step.status === OrderInternalStatus.Arranging;
                        const isCurrent = order.InternalStatus === step.status || (isArrangementNode && order.InternalStatus === OrderInternalStatus.Arranged);

                        // Check if order is confirmed (completed)
                        const isOrderConfirmed = order.InternalStatus >= OrderInternalStatus.Confirmed;

                        // Determine Link target based on step status
                        let linkTarget = null;
                        if (step.status === OrderInternalStatus.Created) linkTarget = `/orders/${order.Id}?view=details`;
                        if (step.status === OrderInternalStatus.Arranging) linkTarget = `/arrangement/${order.Id}`;

                        const StepContent = (
                            <>
                                <div className={`
                                    w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-300 cursor-pointer bg-background-light dark:bg-background-dark
                                    ${isComplete && step.status === OrderInternalStatus.Arranging && isOrderConfirmed ? 'bg-green-500 border-green-500 text-white' : ''}
                                    ${isComplete && step.status === OrderInternalStatus.Confirmed ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 border-purple-500 text-white' : ''}
                                    ${isComplete && step.status === OrderInternalStatus.Created ? 'bg-primary border-primary text-white' : ''}
                                    ${isCurrent ? 'bg-white dark:bg-gray-800 border-primary text-primary scale-110 shadow-lg shadow-primary/30' : ''}
                                    ${!isComplete && !isCurrent ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-400 group-hover:border-primary/50' : ''}
                                `} style={{ zIndex: 10 }}>
                                    <span className="material-symbols-outlined text-xl">
                                        {isComplete ? 'check' : step.icon}
                                    </span>
                                </div>
                                <div className="absolute top-14 w-32 text-center">
                                    <span className={`text-sm font-bold block ${isCurrent && step.status === OrderInternalStatus.Confirmed ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 bg-clip-text text-transparent' : isCurrent ? 'text-primary' : 'text-text-main dark:text-gray-400 group-hover:text-primary transition-colors'}`}>
                                        {step.label}
                                    </span>
                                    {isCurrent && (
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block ${step.status === OrderInternalStatus.Confirmed ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white shadow-lg' : 'text-primary bg-primary/10'}`}>
                                            Current Stage
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
                                    <div className="flex flex-col items-center">
                                        {StepContent}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="flex flex-row gap-4 justify-center mt-12">
                    <Link
                        to={`/orders/${order.Id}?view=details`}
                        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-primary hover:text-primary transition-colors flex items-center gap-2 text-sm"
                    >
                        <span className="material-symbols-outlined text-lg">visibility</span>
                        View Order Details
                    </Link>

                    {(order.InternalStatus === OrderInternalStatus.Created || order.InternalStatus === OrderInternalStatus.Arranging || order.InternalStatus === OrderInternalStatus.Arranged) && (
                        <Link
                            to={`/arrangement/${order.Id}`}
                            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-primary hover:text-primary transition-colors flex items-center gap-2 text-sm"
                        >
                            <span className="material-symbols-outlined text-lg">qr_code_scanner</span>
                            Start Arrangement
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}