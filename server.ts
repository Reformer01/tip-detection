import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import Stripe from "stripe";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  
  // Initialize Socket.io
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Initialize Stripe (Lazy initialization to prevent crashing if key is missing)
  let stripeClient: Stripe | null = null;
  function getStripe(): Stripe {
    if (!stripeClient) {
      const key = process.env.STRIPE_SECRET_KEY;
      if (!key) {
        throw new Error("STRIPE_SECRET_KEY environment variable is required");
      }
      stripeClient = new Stripe(key, { apiVersion: "2024-12-18.acacia" });
    }
    return stripeClient;
  }

  // --- API Routes ---

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Stripe Payment Intent Endpoint
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount, currency = "usd" } = req.body;
      const stripe = getStripe();
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(400).json({ error: { message: error.message } });
    }
  });

  // --- WebSockets (Real-time Events) ---

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Broadcast a tip event to all clients
    socket.on("send_tip", (data) => {
      console.log("Tip received:", data);
      io.emit("new_tip", data);
    });

    // Broadcast a chat message to all clients
    socket.on("send_chat", (data) => {
      console.log("Chat received:", data);
      io.emit("new_chat", data);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // --- Vite Middleware (for development) or Static Serving (for production) ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
