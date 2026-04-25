import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { signalRService } from '../services/signalR';

interface NotificationContextType {
    newOrderCount: number;
    newArrangementCount: number;
}

const NotificationContext = createContext<NotificationContextType>({
    newOrderCount: 0,
    newArrangementCount: 0,
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [newOrderCount, setNewOrderCount] = useState(0);
    const [newArrangementCount, setNewArrangementCount] = useState(0);
    const location = useLocation();

    useEffect(() => {
        const connectSignalR = async () => {
            await signalRService.connect();
        };
        connectSignalR();

        const unsubscribe = signalRService.onOrderListUpdate(() => {
            // Only increment if we are not currently on the page
            if (!location.pathname.startsWith('/orders')) {
                setNewOrderCount(prev => prev + 1);
            }
            if (!location.pathname.startsWith('/arrangement')) {
                setNewArrangementCount(prev => prev + 1);
            }
        });

        return () => {
            unsubscribe();
        };
    }, [location.pathname]);

    // Clear counters when visiting the respective pages
    useEffect(() => {
        if (location.pathname.startsWith('/orders')) {
            setNewOrderCount(0);
        }
        if (location.pathname.startsWith('/arrangement')) {
            setNewArrangementCount(0);
        }
    }, [location.pathname]);

    return (
        <NotificationContext.Provider value={{ newOrderCount, newArrangementCount }}>
            {children}
        </NotificationContext.Provider>
    );
};
