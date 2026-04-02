import * as signalR from "@microsoft/signalr";

const HUB_URL = "http://localhost:5018/hub/showtime";

class ShowtimeSignalR {
  connection = null;
  currentShowtimeId = null;

  async startConnection(showtimeId, onSeatStatusChanged) {
    // If already connected to the same showtime, do nothing
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected && this.currentShowtimeId === showtimeId) {
      console.log(`SignalR: Already connected to showtime ${showtimeId}`);
      return;
    }

    // Stop old connection if any
    if (this.connection) {
        await this.stopConnection(this.currentShowtimeId);
    }

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        skipNegotiation: false, // Must be false for standard websockets with CORS
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    try {
      await this.connection.start();
      this.currentShowtimeId = showtimeId;
      console.log(`SignalR Status: Connected. Joining Group Showtime_${showtimeId}`);
      
      // Join group
      await this.connection.invoke("JoinShowtimeGroup", parseInt(showtimeId));

      // Listen for updates - Logic V2: No ID filtering, trust the Group
      this.connection.on("SeatStatusChanged", (updatedSeats) => {
        console.log("SignalR: Received SeatStatusChanged broadcast", updatedSeats);
        onSeatStatusChanged(updatedSeats);
      });

      this.connection.onreconnected((connectionId) => {
        console.log("SignalR Reconnected. Re-joining group...");
        this.connection.invoke("JoinShowtimeGroup", parseInt(showtimeId));
      });

    } catch (err) {
      console.error("SignalR Error:", err);
      setTimeout(() => this.startConnection(showtimeId, onSeatStatusChanged), 5000);
    }
  }

  async stopConnection(showtimeId) {
    if (this.connection) {
      try {
        console.log(`SignalR: Stopping connection for ${showtimeId}`);
        if (this.connection.state === signalR.HubConnectionState.Connected) {
          await this.connection.invoke("LeaveShowtimeGroup", parseInt(showtimeId));
        }
        await this.connection.stop();
        this.connection = null;
        this.currentShowtimeId = null;
      } catch (err) {
        console.error("SignalR Stop Error:", err);
      }
    }
  }
}

export default new ShowtimeSignalR();
