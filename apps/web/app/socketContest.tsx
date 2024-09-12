"use client";
import { useSession } from "next-auth/react";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import io, { Socket } from 'socket.io-client';

const SocketContext = createContext<Socket | null>(null);

export const useSocket = () => {
    return useContext(SocketContext);
}

interface SocketProviderProps {
    children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status === 'loading') return;  

        if (status !== 'authenticated') {
            console.error('Unauthorized: User is not authenticated');
            return;  
        }
    }, [status]);

    const userId = session?.user?.id;
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        if (status === 'authenticated' && userId) {
            const newSocket = io('http://192.168.1.10:8000', {  
                query: { userId },
                transports: ['websocket'],
            });

            newSocket.on('connect', () => {
                console.log('Connected to socket server');
                newSocket.emit('register', userId);
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
    }, [status, userId]); 

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
