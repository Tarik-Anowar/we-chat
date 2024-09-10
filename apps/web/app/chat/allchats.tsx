import React, { useEffect, useState, useCallback } from 'react';
import { Stack, Typography, styled } from '@mui/material';
import styles from '../styles/allChats.module.css';
import UserAvatar from '../components/Avatar';
import { useSession } from 'next-auth/react';
import { getAllChats } from '../actions/serverActions';

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
  author:string;
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
  const { data: session,status } = useSession();
  const [chats, setChats] = useState<PChat[]>([]);

  const onChatClick = useCallback((chatId: string) => {
    setSingleChatSelected(chatId);
  }, [setSingleChatSelected]);

  const fetchAllChats = useCallback(async () => {
    try {
      if (status==='authenticated') {
        const fetchedChats:PChat[] = await getAllChats();
        setChats(fetchedChats);
      }
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    }
  }, []);

  useEffect(() => {
    fetchAllChats(); 
  }, [session?.user.id]); 

  return (
    <div className={styles.allChatsContainer}>
      {chats.length > 0 ? (
        chats.map((chat: PChat) => (
          <div key={chat._id} onClick={() => onChatClick(chat._id)}>
            <SingleChat selected={singleChatSelected === chat._id}>
              <UserAvatar userId={chat._id} name={chat.name} imageUrl={chat.image} size={30} />
              <ChatInfo>
                <strong>{chat.name}</strong>
                <Typography variant="body2" color="textSecondary">
                  {chat.lastMessage?.content?.value || 'No messages yet'}
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
