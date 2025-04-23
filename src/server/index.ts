import express, { Request, Response } from "express";
import http from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import cors from "cors";
import { ethers } from "ethers";

// In-memory auction state (MVP)
let auctionState: any = {
  status: 'active',
  currentPlayerIndex: 0,
  currentPlayer: {
    id: 1,
    name: "Virat Kohli",
    role: "Batsman",
    country: "India",
    basePrice: 2.0,
    stats: {
      battingAverage: 50.3,
      strikeRate: 138.1,
      matches: 210,
    },
    imgUrl: "https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/IPLHeadshot2023/2.png"
  },
  players: [],
  currentBid: 2.0,
  currentBidder: null,
  bidHistory: [],
  timer: 30
};

// In-memory user store (MVP)
interface User {
  address: string;
  team: string;
  budget: number;
}
const users: Record<string, User> = {};

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// Root path handler to show API info
app.get("/", (req: Request, res: Response) => {
  res.json({
    name: "IPL Player Auction API",
    version: "1.0.0",
    description: "Backend API for the IPL Player NFT Auction platform",
    endpoints: {
      "GET /api/auction/state": "Get current auction state",
      "POST /api/auction/state": "Update auction state (admin only)",
      "POST /api/auth/wallet": "Authenticate with wallet",
      "POST /api/user/update": "Update user team and budget",
      "GET /api/user/:address": "Get user info"
    },
    socketio: {
      events: {
        "connection": "Client connected",
        "auctionStateUpdate": "Emitted when auction state is updated",
        "updateAuctionState": "Listen for state updates from clients"
      }
    }
  });
});

// REST endpoint to get current auction state
app.get("/api/auction/state", (req: Request, res: Response) => {
  console.log("GET /api/auction/state - Returning auction state:", auctionState);
  res.json(auctionState);
});

// REST endpoint to update auction state (for AI moderator or admin)
app.post("/api/auction/state", (req: Request, res: Response) => {
  console.log("POST /api/auction/state - Updating auction state", req.body);
  auctionState = req.body;
  io.emit("auctionStateUpdate", auctionState);
  res.json({ success: true });
});

// Endpoint for wallet-based authentication (MetaMask signature verification)
app.post("/api/auth/wallet", async (req: Request, res: Response) => {
  console.log("POST /api/auth/wallet - Authentication request received", req.body);
  const { address, signature, message } = req.body;
  try {
    const recovered = ethers.verifyMessage(message, signature);
    if (recovered.toLowerCase() !== address.toLowerCase()) {
      res.status(401).json({ success: false, error: "Invalid signature" });
      return;
    }
    if (!users[address]) {
      users[address] = { address, team: "", budget: 0 };
    }
    res.json({ success: true, user: users[address] });
  } catch (err) {
    res.status(400).json({ success: false, error: "Signature verification failed" });
  }
});

// Endpoint to update user team and budget
app.post("/api/user/update", (req: Request, res: Response) => {
  const { address, team, budget } = req.body;
  if (!users[address]) {
    res.status(404).json({ success: false, error: "User not found" });
    return;
  }
  users[address].team = team;
  users[address].budget = budget;
  res.json({ success: true, user: users[address] });
});

// Endpoint to get user info
app.get("/api/user/:address", (req: Request, res: Response) => {
  const address = req.params.address.toLowerCase();
  const user = users[address];
  if (!user) {
    res.status(404).json({ success: false, error: "User not found" });
    return;
  }
  res.json({ success: true, user });
});

// WebSocket connection for real-time updates
io.on("connection", (socket: Socket) => {
  console.log("Client connected:", socket.id);
  
  // Send current state on connect
  socket.emit("auctionStateUpdate", auctionState);

  // Listen for state updates from moderator/AI
  socket.on("updateAuctionState", (state: any) => {
    console.log("updateAuctionState received:", state);
    auctionState = state;
    io.emit("auctionStateUpdate", auctionState);
  });
  
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Auction backend server running on port ${PORT}`);
});
