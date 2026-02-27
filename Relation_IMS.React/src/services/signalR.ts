import * as signalR from '@microsoft/signalr';

const SIGNALR_URL = import.meta.env.VITE_API_URL 
    ? `${import.meta.env.VITE_API_URL.replace('/api', '')}/hubs/arrangement`
    : 'http://localhost:5000/hubs/arrangement';

class SignalRService {
    private connection: signalR.HubConnection | null = null;
    private orderListUpdateCallbacks: Set<() => void> = new Set();

    async connect(): Promise<void> {
        if (this.connection?.state === signalR.HubConnectionState.Connected) {
            return;
        }

        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(SIGNALR_URL, {
                withCredentials: true
            })
            .withAutomaticReconnect([0, 1000, 5000, 10000, 30000])
            .configureLogging(signalR.LogLevel.Warning)
            .build();

        this.connection.on('OrderListUpdated', () => {
            console.log('[SignalR] Received OrderListUpdated event, notifying callbacks...');
            this.orderListUpdateCallbacks.forEach(callback => {
                console.log('[SignalR] Invoking update callback');
                callback();
            });
        });

        this.connection.onreconnecting(() => {
            console.log('SignalR reconnecting...');
        });

        this.connection.onreconnected(() => {
            console.log('SignalR reconnected');
            this.joinArrangementRoom();
        });

        this.connection.onclose(() => {
            console.log('SignalR connection closed');
        });

        try {
            await this.connection.start();
            console.log('SignalR Connected');
            await this.joinArrangementRoom();
        } catch (err) {
            console.error('SignalR Connection Error:', err);
        }
    }

    async disconnect(): Promise<void> {
        if (this.connection) {
            await this.connection.stop();
            this.connection = null;
        }
    }

    async joinArrangementRoom(): Promise<void> {
        console.log('[SignalR] joinArrangementRoom called, state:', this.connection?.state);
        if (this.connection?.state === signalR.HubConnectionState.Connected) {
            await this.connection.invoke('JoinArrangementRoom');
            console.log('[SignalR] Joined arrangement room successfully');
        } else {
            console.log('[SignalR] Cannot join room - not connected');
        }
    }

    async leaveArrangementRoom(): Promise<void> {
        if (this.connection?.state === signalR.HubConnectionState.Connected) {
            await this.connection.invoke('LeaveArrangementRoom');
        }
    }

    onOrderListUpdate(callback: () => void): () => void {
        this.orderListUpdateCallbacks.add(callback);
        return () => {
            this.orderListUpdateCallbacks.delete(callback);
        };
    }

    get connectionState(): signalR.HubConnectionState | null {
        return this.connection?.state ?? null;
    }
}

export const signalRService = new SignalRService();
