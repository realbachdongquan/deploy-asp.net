import * as signalR from "@microsoft/signalr";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5042/api';
// Extract base URL by removing /api suffix if it exists
const BASE_URL = API_URL.replace(/\/api$/, "");
const HUB_URL = `${BASE_URL}/hub/showtime`;

class ShowtimeSignalR {
  connection = null;
  currentShowtimeId = null;
  startingPromise = null;
  currentCallback = null;

  updateCallback(callback) {
    this.currentCallback = callback;
  }

  async startConnection(showtimeId, onSeatStatusChanged) {
    this.currentCallback = onSeatStatusChanged;
    
    // If already connected to the same showtime, just update callback
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected && this.currentShowtimeId === showtimeId) {
      console.log(`[SignalR] Already connected, updating callback for showtime ${showtimeId}`);
      return;
    }

    // If starting, wait for it
    if (this.startingPromise) {
        await this.startingPromise;
        if (this.currentShowtimeId === showtimeId) return;
    }

    // Stop old connection if any
    if (this.connection) {
        await this.stopConnection(this.currentShowtimeId);
    }

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.startingPromise = this.connection.start();

    try {
      await this.startingPromise;
      this.currentShowtimeId = showtimeId;
      console.log(`[SignalR] Connected to Showtime_${showtimeId}`);
      
      if (this.connection.state === signalR.HubConnectionState.Connected) {
        await this.connection.invoke("JoinShowtimeGroup", parseInt(showtimeId));
        console.log(`[SignalR] Joined Group: Showtime_${showtimeId}`);
      }

      this.connection.on("SeatStatusChanged", (updatedSeats) => {
        console.log("[SignalR] Received SeatStatusChanged");
        if (this.currentCallback) this.currentCallback({ type: 'full_update', data: updatedSeats });
      });

      this.connection.on("SeatSelected", (seatId, userId) => {
        console.log(`[SignalR] Received SeatSelected: ${seatId} by ${userId}`);
        if (this.currentCallback) this.currentCallback({ type: 'seat_selected', seatId, userId });
      });

      this.connection.on("SeatUnselected", (seatId) => {
        console.log(`[SignalR] Received SeatUnselected: ${seatId}`);
        if (this.currentCallback) this.currentCallback({ type: 'seat_unselected', seatId });
      });

      this.connection.onreconnected(async () => {
        console.log("[SignalR] Reconnected. Re-joining group...");
        if (this.connection.state === signalR.HubConnectionState.Connected) {
          await this.connection.invoke("JoinShowtimeGroup", parseInt(showtimeId));
        }
      });

    } catch (err) {
      console.error("SignalR Start Error:", err);
      this.connection = null;
      // Retry after delay
      setTimeout(() => this.startConnection(showtimeId, onSeatStatusChanged), 5000);
    } finally {
      this.startingPromise = null;
    }
  }

  async selectSeat(showtimeId, seatId, userId) {
    try {
      if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
        await this.connection.invoke("SelectSeat", parseInt(showtimeId), parseInt(seatId), userId);
      }
    } catch (err) {
      console.warn("[SignalR] SelectSeat failed (Backend might need a restart):", err.message);
    }
  }

  async unselectSeat(showtimeId, seatId, userId) {
    try {
      if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
        await this.connection.invoke("UnselectSeat", parseInt(showtimeId), parseInt(seatId), userId);
      }
    } catch (err) {
      console.warn("[SignalR] UnselectSeat failed:", err.message);
    }
  }

  async stopConnection(showtimeId) {
    if (this.startingPromise) {
        try { await this.startingPromise; } catch(e) {}
    }

    if (this.connection) {
      try {
        if (this.connection.state === signalR.HubConnectionState.Connected) {
          await this.connection.invoke("LeaveShowtimeGroup", parseInt(showtimeId));
          await this.connection.stop();
        } else if (this.connection.state !== signalR.HubConnectionState.Disconnected) {
          await this.connection.stop();
        }
        console.log(`SignalR: Stopped connection for ${showtimeId}`);
      } catch (err) {
        console.error("SignalR Stop Error:", err);
      } finally {
        this.connection = null;
        this.currentShowtimeId = null;
      }
    }
  }
}

export default new ShowtimeSignalR();
