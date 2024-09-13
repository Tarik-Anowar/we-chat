import { Server } from "socket.io";
import Redis from "ioredis";
import dotenv from 'dotenv';
dotenv.config();
const REDIS_URL:any = process.env.REDIS_URL;
const pub = new Redis(REDIS_URL);
const sub = new Redis(REDIS_URL);

const redisConnection = async () => {
  try {
    await pub.set('foo', 'bar');
    console.log('Redis connected successfully');
  } catch (error) {
    console.error('Redis connection error:', error);
  }
};
redisConnection();

enum MessageType {
  TEXT = "TEXT",
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  LINK = "LINK",
  PDF = "PDF",
  AUDIO = "AUDIO",
}

interface Message {
  _id: string;
  author: string;
  content: {
    type: MessageType;
    value: string;
  };
  createdAt: Date;
  updatedAt?: Date;
}

class SocketService {
  private _io: Server;
  private chatRooms: Record<string, string[]> = {};
  private socketChats: Record<string, string[]> = {};
  private onlineSockets: Set<string> = new Set();

  constructor() {
    console.log("Init Socket Service...");
    this._io = new Server({
      cors: {
        allowedHeaders: ["*"],
        origin: "*",
      },
    });
  }

  public initListeners() {
    console.log("Setting up listeners...");
    const io = this._io;

    io.on('connection', (socket) => {
      console.log("New socket connected:", socket.id, "with query:", socket.handshake.query);

      socket.on('register', (userId) => {
        if (!this.onlineSockets.has(socket.id)) {
          this.onlineSockets.add(socket.id);
          this.socketChats[socket.id] = [];
          console.log(`User ${userId} is now online with socket ID: ${socket.id}`);
        }
      });

      socket.on('join-chat', ({ chatId }) => {
        if (!this.chatRooms[chatId]) {
          this.chatRooms[chatId] = [];
        }

        if (!this.chatRooms[chatId].includes(socket.id)) {
          this.chatRooms[chatId].push(socket.id);
          console.log(`Socket ${socket.id} joined chat ${chatId}`);
        }

        if (!this.socketChats[socket.id]) {
          this.socketChats[socket.id] = [];
        }

        if (!this.socketChats[socket.id].includes(chatId)) {
          this.socketChats[socket.id].push(chatId);
          console.log(`Socket ${socket.id} connected to chat ${chatId}`);
        }

        sub.subscribe(`chat-${chatId}`, (err, count) => {
          if (err) {
            console.error(`Error subscribing to chat-${chatId}:`, err);
          } else {
            console.log(`Subscribed to chat-${chatId}, ${count} total subscriptions.`);
          }
        });
      });

      socket.on('send-message', ({ chatId, message }) => {
        const channel = `chat-${chatId}`;
        pub.publish(channel, JSON.stringify({ message, sender: socket.id }), (err, count) => {
          if (err) {
            console.error("Error publishing message:", err);
          } else {
            console.log(`Message published to ${count} subscribers on channel ${channel}`);
          }
        });
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
        this.cleanupSocket(socket.id);
      });
    });

    sub.on('message', (channel, message) => {
      console.log(`Message received on Redis channel ${channel}`);
      try {
        const parsedMessage = JSON.parse(message);
        const chatId = channel.split('-')[1];

        if (this.chatRooms[chatId]) {
          for (const socketId of this.chatRooms[chatId]) {
            if (socketId !== parsedMessage.sender && this.onlineSockets.has(socketId)) {
              io.to(socketId).emit('received-message', {
                chatId: chatId,
                message: parsedMessage.message,
                sender: parsedMessage.sender
              });
              console.log(`Message sent to socket ${socketId} for chat ${chatId}`);
            }
          }
        }
      } catch (err) {
        console.error("Error parsing message:", err);
      }
    });

    sub.psubscribe("chat-*", (err, count) => {
      if (err) {
        console.error("Failed to subscribe to Redis pattern channels:", err);
      } else {
        console.log(`Subscribed to ${count} Redis pattern channels.`);
      }
    });
  }

  private cleanupSocket(socketId: string) {
    if (this.socketChats[socketId]) {
      this.socketChats[socketId].forEach(chatId => {
        this.chatRooms[chatId] = this.chatRooms[chatId].filter(id => id !== socketId);
        if (this.chatRooms[chatId].length === 0) {
          delete this.chatRooms[chatId];
        }
      });
    }
    this.onlineSockets.delete(socketId);
  }

  get io() {
    return this._io;
  }
}

export default SocketService;
