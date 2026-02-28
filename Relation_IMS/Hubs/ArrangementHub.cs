using Microsoft.AspNetCore.SignalR;

namespace Relation_IMS.Hubs
{
    public class ArrangementHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            Console.WriteLine($"[SignalR] Client connected: {Context.ConnectionId}");
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            Console.WriteLine($"[SignalR] Client disconnected: {Context.ConnectionId}");
            await base.OnDisconnectedAsync(exception);
        }

        public async Task JoinArrangementRoom()
        {
            Console.WriteLine($"[SignalR] JoinArrangementRoom called by: {Context.ConnectionId}");
            await Groups.AddToGroupAsync(Context.ConnectionId, "arrangement");
            Console.WriteLine($"[SignalR] Client {Context.ConnectionId} joined 'arrangement' group");
        }

        public async Task LeaveArrangementRoom()
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, "arrangement");
        }
    }

    public class ArrangementHubEvents
    {
        public const string OrderListUpdated = "OrderListUpdated";
    }
}
