import React, { useEffect, useRef, useState } from 'react';
import { IconButton, TextField, Typography, styled } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import UserAvatar from '../components/Avatar';
import SendIcon from '@mui/icons-material/Send';
import { getSingleChat, sendMessage, updateLastRead } from '../actions/serverActions';
import { useSession } from 'next-auth/react';
import { useSocket } from '../socketContest';

interface Participant {
    _id: string;
    name: string;
    username: string;
    image?: string;
}

interface IChat {
    _id: string;
    type?: "DIRECT" | "GROUP";
    name: string;
    participants?: Participant[];
    messages?: Message[];
}

interface ChatHeaderProps {
    singleChatSelected: string;
    setSingleChatSelected: (chatId: string) => void;
}

const Container = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%'
});

const HeaderContainer = styled('div')({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px',
    borderBottom: '1px solid #ccc',
    backgroundColor: '#f5f5f5',
    position: 'sticky',
    top: 0,
    width: '99%',
    marginRight: '20px',
    paddingRight: '30px'
});

const BodyContainer = styled('div')({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '10px',
    backgroundColor: '#a5f5f5',
    overflowY: 'auto',
});

const MessageContainer = styled('div')<{ isAuthor: boolean }>(({ isAuthor }) => ({
    display: 'flex',
    flexDirection: isAuthor ? 'row-reverse' : 'row',
    alignItems: 'flex-start',
    marginBottom: '10px',
    justifyContent: isAuthor ? 'flex-end' : 'flex-start'
}));

const MessageBubble = styled('div')<{ isAuthor: boolean }>(({ isAuthor }) => ({
    backgroundColor: isAuthor ? '#dcf8c6' : '#ffffff',
    padding: '10px',
    borderRadius: '15px',
    maxWidth: '60%',
    wordBreak: 'break-word',
    marginLeft: isAuthor ? 'auto' : '0',
    marginRight: isAuthor ? '0' : 'auto',
    textAlign: isAuthor ? 'right' : 'left'
}));

const LeftSide = styled('div')({
    display: 'flex',
    alignItems: 'center',
});

const RightSide = styled('div')({
    display: 'flex',
    alignItems: 'center',
    marginRight: '20px',
});

const InputContainer = styled('div')({
    display: 'flex',
    alignItems: 'center',
    padding: '10px',
    borderTop: '1px solid #ccc',
    backgroundColor: '#f5f5f5',
    position: 'sticky',
    bottom: 0,
    zIndex: 10,
});

const StyledTextField = styled(TextField)({
    flex: 1,
    marginRight: '10px',
    '& .MuiInputBase-root': {
        backgroundColor: '#fff',
        borderRadius: '25px',
        paddingLeft: '15px',
    },
    '& .MuiOutlinedInput-notchedOutline': {
        border: 'none',
    },
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

const SingleChat: React.FC<ChatHeaderProps> = ({ singleChatSelected, setSingleChatSelected }) => {
    const { data: session, status } = useSession();
    const [otherParticipant, setOtherParticipant] = useState<Participant | null>(null);
    const [message, setMessage] = useState('');
    const [messageIds, setMessageIds] = useState<Set<string>>(new Set()); 
    const [singleChat, setSingleChat] = useState<IChat>();
    const [lastMessageId, setLastMessageId] = useState<string | null>(null); 
    const endOfMessagesRef = useRef<HTMLDivElement | null>(null);

    const socket = useSocket();

    useEffect(() => {
        const fetchChatDetails = async () => {
            try {
                const chatDetails: IChat = await getSingleChat(singleChatSelected);
                setOtherParticipant(chatDetails?.participants?.find((participant: Participant) => participant._id !== session?.user.id) || null);
                setSingleChat(chatDetails);
            } catch (error) {
                console.error('Failed to fetch chat details:', error);
            }
        };
        if (singleChatSelected) {
            fetchChatDetails();
        }
    }, [singleChatSelected]);

    useEffect(() => {
        if (!socket) return;

        const handleMessageReceive = ({ chatId, message, sender }: { chatId: string; message: Message; sender: string }) => {
            if (singleChat && chatId === singleChat._id && socket.id !== sender) {
                setMessageIds(prevIds => new Set(prevIds).add(message._id));
                setSingleChat(prevChat => prevChat ? {
                    ...prevChat,
                    messages: [...(prevChat.messages || []), { ...message, sender }]
                } : undefined);
                const messageId = message._id;
                updateLastRead({chatId,messageId});
            }
        };

        socket.on('received-message', handleMessageReceive);

        return () => {
            socket.off('received-message', handleMessageReceive);
        };
    }, [socket, singleChat, session?.user.id, messageIds]);

    useEffect(() => {
        if (endOfMessagesRef.current) {
            endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [singleChat?.messages]);

    const handleBackClick = () => {
        if (singleChat) {
            socket?.emit('left-chat', singleChat._id);
            
            // const messageId = lastMessageId || singleChat.messages?.[singleChat.messages.length - 1]?._id;
            // const chatId = singleChatSelected;
            // if (messageId) {
            //     updateLastRead({chatId, messageId});
            // }
    
            setSingleChatSelected('');
        }
    };
    

    const handleSendMessage = async () => {
        if (message.trim()) {
            const content = {
                type: MessageType.TEXT,
                value: message
            };
            const chatId = singleChatSelected;
            try {
                const newMessage: Message = await sendMessage({ chatId, content });
                const messageId = newMessage._id;
                updateLastRead({chatId,messageId});
                setSingleChat(prevChat => prevChat ? {
                    ...prevChat,
                    messages: [...(prevChat.messages || []), newMessage]
                } : undefined);

                setMessageIds(prevIds => new Set(prevIds).add(newMessage._id));

                socket?.emit('send-message', { chatId, message: newMessage });

                setMessage('');
            } catch (error) {
                console.error('Failed to send message:', error);
            }
        }
    };

    return (
        <Container>
            <HeaderContainer>
                <LeftSide>
                    <IconButton onClick={handleBackClick}>
                        <ArrowBackIcon />
                    </IconButton>
                </LeftSide>

                <RightSide>
                    {otherParticipant && (
                        <>
                            <UserAvatar userId={singleChatSelected} name={otherParticipant.name} imageUrl={otherParticipant.image || ''} size={30} />
                            <Typography variant="h6" style={{ marginLeft: '10px' }}>
                                {otherParticipant.name}
                            </Typography>
                        </>
                    )}
                </RightSide>
            </HeaderContainer>

            <BodyContainer>
                {singleChat && singleChat.messages && singleChat.messages.length > 0 &&
                    singleChat.messages.map((message: Message) => (
                        <MessageContainer key={message._id} isAuthor={message.author === session?.user?.id}>
                            <MessageBubble isAuthor={message.author === session?.user?.id}>
                                <div>
                                    {message.content.value}
                                </div>
                                <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#888', marginTop: '5px' }}>
                                    {new Date(message.createdAt).toLocaleString()}
                                </div>
                            </MessageBubble>
                        </MessageContainer>
                    ))
                }
                <div ref={endOfMessagesRef} />
            </BodyContainer>

            <InputContainer>
                <StyledTextField
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSendMessage();
                        }
                    }}
                />
                <IconButton onClick={handleSendMessage}>
                    <SendIcon />
                </IconButton>
            </InputContainer>
        </Container>
    );
};

export default SingleChat;
