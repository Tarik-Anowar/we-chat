import React, { useEffect, useState, useCallback } from 'react';
import { Stack, Typography, styled, Badge } from '@mui/material';
import styles from '../styles/allChats.module.css';
import UserAvatar from '../components/Avatar';
import { useSession } from 'next-auth/react';
import { getAllChats } from '../actions/serverActions';
import { useSocket } from '../socketContest';

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

interface PChat {
  _id: string;
  name: string;
  image?: string;
  lastMessage: Message;
  unreadCount: number;
}

const ChatInfo = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  marginLeft: '10px',
});

interface SingleChatProps {
  selected: boolean;
}

const SingleChat = styled('div')<SingleChatProps>(({ selected }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: '10px',
  cursor: 'pointer',
  backgroundColor: selected ? 'rgb(173, 216, 230)' : 'rgb(200, 255, 200)', // Bluish when selected
  borderRadius: '5px',
  marginBottom: '3px',
  '&:hover': {
    backgroundColor: '#f0f0f0',
  },
}));

interface AllChatsProps {
  singleChatSelected: string;
  setSingleChatSelected: (chatId: string) => void;
}

const AllChats: React.FC<AllChatsProps> = ({ singleChatSelected, setSingleChatSelected }) => {
  const { data: session, status } = useSession();
  const [chats, setChats] = useState<PChat[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({});
  const socket = useSocket();

  const onChatClick = useCallback((chatId: string) => {
    setSingleChatSelected(chatId);

    setUnreadMessages((prev) => ({
      ...prev,
      [chatId]: 0,
    }));
  }, [setSingleChatSelected]);

  const fetchAllChats = useCallback(async () => {
    try {
      if (status === 'authenticated') {
        const fetchedChats: PChat[] = await getAllChats();
        setChats(fetchedChats);

        const initialUnreadMessages = fetchedChats.reduce((acc, chat) => {
          acc[chat._id] = chat.unreadCount || 0;
          return acc;
        }, {} as Record<string, number>);

        setUnreadMessages(initialUnreadMessages);
      }
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    }
  }, [status]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchAllChats();
    }
  }, [session?.user?.id, fetchAllChats]);

  useEffect(() => {
    if (!socket) return;

    const handleMessageNotification = ({ chatId, message, sender }: { chatId: string; message: Message; sender: string }) => {
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat._id === chatId ? { ...chat, lastMessage: message } : chat
        )
      );

      if (sender !== socket.id && chatId !== singleChatSelected) {
        setUnreadMessages((prev) => ({
          ...prev,
          [chatId]: (prev[chatId] || 0) + 1,
        }));
      }
    };

    socket.on('message-notification', handleMessageNotification);

    return () => {
      socket.off('message-notification', handleMessageNotification);
    };
  }, [socket, singleChatSelected]);

  const truncateMessage = (message: string) => (
    message.length > 15 ? `${message.substring(0, 15)}...` : message
  );

  return (
    <div className={styles.allChatsContainer}>
      {chats.length > 0 ? (
        chats.map((chat: PChat) => (
          <div key={chat._id} onClick={() => onChatClick(chat._id)}>
            <SingleChat selected={singleChatSelected === chat._id}>
              <Badge
                badgeContent={unreadMessages[chat._id] || 0}
                color="secondary"
                overlap="circular"
                invisible={singleChatSelected === chat._id || unreadMessages[chat._id] === 0}
              >
                <UserAvatar userId={chat._id} name={chat.name} imageUrl={chat.image} size={40} />
              </Badge>
              <ChatInfo>
                <strong>{chat.name}</strong>
                <Typography variant="body2" color="textSecondary">
                  {chat.lastMessage?.content?.value ? truncateMessage(chat.lastMessage.content.value) : 'No messages yet'}
                </Typography>
              </ChatInfo>
            </SingleChat>
          </div>
        ))
      ) : (
        <Typography variant="body1" align="center">
          No chats available.
        </Typography>
      )}
    </div>
  );
};

export default AllChats;
