import { Server } from "socket.io";
import Redis from "ioredis";

const pub = new Redis({
    host: 'localhost',
    port: 6379,
});
const sub = new Redis({
    host: 'localhost',
    port: 6379,
});

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
    private users: Record<string, string[]> = {};
    private subscribedChats: Record<string, string> = {}; 

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
            console.log("New socket connected: ", socket.id);

            socket.on('register', (userId) => {
                // If userId is already registered, append the new socket ID to the list of socket IDs
                if (this.users[userId]) {
                    this.users[userId].push(socket.id);
                } else {
                    this.users[userId] = [socket.id];
                }
                console.log(`User ${userId} registered with socket ID: ${socket.id}`);
            });

            socket.on('chat-message', ({ chatId, message }) => {
                console.log(`chat-${chatId}`, JSON.stringify({ message, author: socket.id }));
                pub.publish(`chat-${chatId}`, JSON.stringify({ message, author: socket.id }));
            });

            socket.on('join-chat', ({ chatId }) => {
                if (!this.subscribedChats[socket.id]) {
                    sub.subscribe(`chat-${chatId}`);
                    this.subscribedChats[socket.id] = `chat-${chatId}`;
                    console.log(`User ${socket.id} joined chat ${chatId}`);
                }
            });

            socket.on('disconnect', () => {
                console.log('User disconnected:', socket.id);

                // Find the user who owns this socket ID and remove it
                for (const userId in this.users) {
                    this.users[userId] = this.users[userId].filter(id => id !== socket.id);

                    // If no more sockets are associated with the user, delete the user
                    if (this.users[userId].length === 0) {
                        delete this.users[userId];
                    }
                }

                if (this.subscribedChats[socket.id]) {
                    sub.unsubscribe(this.subscribedChats[socket.id]);
                    delete this.subscribedChats[socket.id];
                    console.log(`User ${socket.id} unsubscribed from all chats.`);
                }
            });
        });

        sub.on('message', (channel, message) => {
            const parsedMessage = JSON.parse(message);
            const chatId = channel.split('-')[1];
            console.log(`Received message on channel ${chatId}, message: ${parsedMessage.message.value}, author: ${parsedMessage.author}`);


            for (const [userId, socketIds] of Object.entries(this.users)) {
                socketIds.forEach((socketId) => {
                    if (this.subscribedChats[socketId] === channel && socketId !== parsedMessage.author) {
                        io.to(socketId).emit('received-message', {
                            chatId,
                            message: parsedMessage.message as Message,
                            sender: parsedMessage.author as string,
                        });
                    }
                });
            }
        });
    }

    get io() {
        return this._io;
    }
}

export default SocketService;
