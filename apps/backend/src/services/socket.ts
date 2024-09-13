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
  private onlineSokets: Set<string> = new Set();

  constructor() {
      console.log('Init socket server');
      this._io = new Server({
          cors: {
              allowedHeaders: ["*"],
              origin: "*",  
          },
      });
  }

  public initListeners() {
      console.log("Listeners initialized...");
      const io = this._io;

      io.on('connection', (socket) => {
          console.log("New socket connected: ", socket.id, "with query: ", socket.handshake.query);

          socket.on('register', (userId) => {
              if (!this.onlineSokets.has(socket.id)) {
                  this.onlineSokets.add(socket.id);
                  this.socketChats[socket.id] = [];
                  console.log(`User ${userId} is now online`);
              }
          });

          socket.on('join-chat', ({ chatId }) => {
              if (!this.chatRooms[chatId]) {
                  this.chatRooms[chatId] = [];
              }

              if (!this.chatRooms[chatId].includes(socket.id)) {
                  this.chatRooms[chatId].push(socket.id);
                  console.log(`(Socket ${socket.id}) joined chat ${chatId}`);
              }

              if (!this.socketChats[socket.id]) {
                  this.socketChats[socket.id] = [];
              }

              if (!this.socketChats[socket.id].includes(chatId)) {
                  this.socketChats[socket.id].push(chatId);
                  console.log(`socket: ${socket.id} ->chat_id: ${chatId} connection made`);
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
              console.log(`Publishing message to channel: chat-${chatId}, Message: ${message.content.value}`);
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

              if (this.socketChats[socket.id]) {
                  this.socketChats[socket.id].forEach(chatId => {
                      this.chatRooms[chatId] = this.chatRooms[chatId].filter(id => id !== socket.id);
                      if (this.chatRooms[chatId].length === 0) {
                          delete this.chatRooms[chatId];
                      }
                  });
              }

              this.onlineSokets.delete(socket.id)
          });
      });

      sub.on('message', (channel, message) => {
          console.log(`Message received on Redis channel ${channel}`);
          try {
              const parsedMessage = JSON.parse(message);
              console.log(`Parsed message: ${parsedMessage.message.content.value}, from sender: ${parsedMessage.sender}`);

              const chatId = channel.split('-')[1];
              if (!this.chatRooms[chatId]) {
                  console.log(`No sockets found for chatId: ${chatId}`);
                  return;
              }

              for (const socketId of this.chatRooms[chatId]) {
                  if (socketId !== parsedMessage.sender && this.onlineSokets.has(socketId)) {
                      io.to(socketId).emit('received-message', {
                          chatId: chatId,
                          message: parsedMessage.message as Message,
                          sender: parsedMessage.sender
                      });
                      console.log(`Message sent to socket: ${socketId}, chatId: ${chatId}`);
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

  get io() {
      return this._io;
  }
}

export default SocketService;