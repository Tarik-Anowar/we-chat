"use client";
import { useSession } from "next-auth/react";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import io, { Socket } from 'socket.io-client';
import { getAllChatIds } from "./actions/serverActions";

const SocketContext = createContext<Socket | null>(null);

export const useSocket = () => {
    return useContext(SocketContext);
}

interface SocketProviderProps {
    children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
    const [allChatIds, setAllChatIds] = useState<string[]>([]);
    const { data: session, status } = useSession();
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        const fetchChatIds = async () => {
            if (status === 'authenticated') {
                try {
                    const getChatIds: string[] = await getAllChatIds();
                    setAllChatIds(getChatIds);
                } catch (error) {
                    console.error('Error fetching chat IDs:', error);
                }
            }
        };
        fetchChatIds();
    }, [status]);

    useEffect(() => {
        if (status === 'authenticated' && session?.user?.id && allChatIds.length > 0) {
            const userId = session.user.id;
            const newSocket = io('https://we-chat-5fk5.onrender.com', {
                query: { userId },
                transports: ['websocket'],
            });

            newSocket.on('connect', () => {
                console.log('Connected to socket server');
                console.log("chatIds: "+allChatIds)
                newSocket.emit('register', { userId, allChatIds });
            });

            newSocket.on('disconnect', () => {
                console.log('Disconnected from socket server');
            });

            setSocket(newSocket);

            return () => {
                newSocket.close();
                console.log('Socket connection closed');
            };
        }
    }, [status, session?.user?.id, allChatIds]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
