import React, { useEffect, useRef, useState } from 'react';
import { IconButton, TextField, Typography, debounce, styled } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import UserAvatar from '../components/Avatar';
import SendIcon from '@mui/icons-material/Send';
import { getSingleChat, sendMessage, updateLastRead } from '../actions/serverActions';
import { useSession } from 'next-auth/react';
import { useSocket } from '../socketContest';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'

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
  justifyContent: isAuthor ? 'flex-end' : 'flex-start',
}));

const MessageBubble = styled('div')<{ isAuthor: boolean }>(({ isAuthor }) => ({
  backgroundColor: isAuthor ? '#dcf8c6' : '#ffffff',
  padding: '10px',
  borderRadius: '15px',
  maxWidth: '60%',
  wordBreak: 'break-word',
  marginLeft: isAuthor ? 'auto' : '0',
  marginRight: isAuthor ? '0' : 'auto',
  textAlign: isAuthor ? 'right' : 'left',
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
interface TypingUser {
  sender: string;
  name: string;
}
const SingleChat: React.FC<ChatHeaderProps> = ({ singleChatSelected, setSingleChatSelected }) => {
  const { data: session, status } = useSession();
  const [otherParticipant, setOtherParticipant] = useState<Participant | null>(null);
  const [message, setMessage] = useState('');
  const [messageIds, setMessageIds] = useState<Set<string>>(new Set());
  const [singleChat, setSingleChat] = useState<IChat>();
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [typingUser, setTypingUser] = useState<TypingUser | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const socket = useSocket();


  useEffect(() => {
    const fetchChatDetails = async () => {
      try {
        const chatDetails: IChat = await getSingleChat(singleChatSelected);
        setOtherParticipant(chatDetails?.participants?.find((participant: Participant) => participant._id !== session?.user.id) || null);
        setSingleChat(chatDetails);

        // Only update last read if there are unread messages
        if (chatDetails?.messages && chatDetails.messages.length > 0) {
          const lastMsgId = chatDetails.messages[chatDetails.messages.length - 1]?._id || "";
          if (lastMsgId && !messageIds.has(lastMsgId)) {
            setLastMessageId(lastMsgId);
            updateLastRead({ chatId: chatDetails._id, messageId: lastMsgId });
          }
        }
        setIsEmojiPickerOpen(false);
      } catch (error) {
        console.error('Failed to fetch chat details:', error);
      }
    };

    if (singleChatSelected) {
      fetchChatDetails();
    }
  }, [singleChatSelected, messageIds]);

  useEffect(() => {
    if (!socket) return;

    const handleMessageReceive = ({ chatId, message, sender }: { chatId: string; message: Message; sender: string }) => {
      if (singleChat && chatId === singleChat._id && socket.id !== sender) {
        setMessageIds(prevIds => new Set(prevIds).add(message._id));
        setSingleChat(prevChat => prevChat ? {
          ...prevChat,
          messages: [...(prevChat.messages || []), { ...message, sender }]
        } : undefined);

        // Update last read if the message is from another participant
        if (session?.user.id !== sender) {
          updateLastRead({ chatId, messageId: message._id });
        }
      }
    };

    const handleUserTyping = ({ chatId, name, sender }: { chatId: string; name: string; sender: string }) => {
      if (chatId === singleChat?._id) {
        console.log("typing");
        setTypingUser({ sender:sender, name:name });
      };
    }

    const handleUserStoppedTyping = ({ chatId, sender }: { chatId: string; sender: string }) => {
      if (chatId === singleChat?._id) {
        console.log("typing stopped");
        setTypingUser(null);
      }
    };

    socket.on('received-message', handleMessageReceive);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stopped_typing', handleUserStoppedTyping);

    return () => {
      socket.off('received-message', handleMessageReceive);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stopped_typing', handleUserStoppedTyping);
    };
  }, [socket, singleChat, session?.user.id]);

  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [singleChat?.messages]);

  // On chat exit, update the last read message
  const handleBackClick = () => {
    if (singleChat) {
      socket?.emit('left-chat', singleChat._id);
      const messageId = singleChat.messages?.[singleChat.messages.length - 1]?._id;
      const chatId = singleChatSelected;
      if (messageId) {
        updateLastRead({ chatId, messageId });
      }
      setIsEmojiPickerOpen(false);
      setSingleChatSelected('');
    }
  };

  const handleEmojiClick = (emoji: any) => {
    setMessage(prevMessage => prevMessage + emoji.native);
  };

  const toggleEmojiPicker = () => {
    setIsEmojiPickerOpen(prev => !prev);
  };

  const renderTypingUsers = () => {
    if (!typingUser) return null;
    if(typingUser.sender===socket?.id) return;
    return (

      <Typography variant="body2" style={{ marginLeft: '10px', fontStyle: 'italic' }}>
        {singleChat?.type === 'GROUP' && `${typingUser.name} is`} typing...
      </Typography>
    );

  };

  const handleTyping = () => {
    if (!socket || !singleChat || !session?.user?.name) return; 

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { chatId: singleChat._id, name: session.user.name });
    }

    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    const newTimeout = setTimeout(() => {
      socket.emit('stopped_typing', { chatId: singleChat._id });
      setIsTyping(false);
    }, 1000);

    setTypingTimeout(newTimeout);
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
        setSingleChat(prevChat => prevChat ? {
          ...prevChat,
          messages: [...(prevChat.messages || []), newMessage]
        } : undefined);

        setMessageIds(prevIds => new Set(prevIds).add(newMessage._id));

        socket?.emit('send-message', { chatId, message: newMessage });

        setMessage('');
        setIsEmojiPickerOpen(false);
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    }
  };

  const truncateName = (name: string) => {
    const firstName = name.split(' ')[0];
    if (!firstName) return "";
    return firstName.length > 10 ? `${firstName.substring(0, 10)}...` : firstName;
  };



  return (
    <Container>
      <HeaderContainer>
        <LeftSide>
          <IconButton onClick={handleBackClick}>
            <ArrowBackIcon />
          </IconButton>
          {typingUser && renderTypingUsers()}
        </LeftSide>

        <RightSide>
          {otherParticipant && (
            <div>{singleChat && singleChat.type !== "GROUP" &&
              <span style={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h6" style={{ marginLeft: '10px' }}>
                  {otherParticipant.name}
                </Typography>
                <UserAvatar userId={singleChatSelected} name={otherParticipant.name} imageUrl={otherParticipant.image || ''} size={30} />
              </span>
            }
            </div>
          )}
        </RightSide>
      </HeaderContainer>

      <BodyContainer>
        {singleChat && singleChat.messages && singleChat.messages.length > 0 &&
          singleChat.messages.map((message: Message) => {
            const isAuthor = message.author === session?.user?.id;
            const sender = singleChat.participants?.find(p => String(p._id) === String(message.author));
            return (
              <MessageContainer key={message._id} isAuthor={isAuthor}>
                {singleChat.type === "GROUP" && !isAuthor && sender && (
                  <div style={{ marginRight: '10px' }}>
                    <UserAvatar userId={sender._id} name={sender.name} imageUrl={sender.image || ''} size={30} />
                    <Typography variant="caption" style={{ textAlign: 'center', display: 'block' }}>
                      {truncateName(sender.name)}
                    </Typography>
                  </div>
                )}
                <MessageBubble isAuthor={isAuthor}>
                  <div>{message.content.value}</div>
                  <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#888', marginTop: '5px' }}>
                    {new Date(message.createdAt).toLocaleString()}
                  </div>
                </MessageBubble>
              </MessageContainer>
            );
          })
        }
        <div ref={endOfMessagesRef} />
      </BodyContainer>


      <InputContainer>
        <IconButton onClick={toggleEmojiPicker}>
          <EmojiEmotionsIcon />
        </IconButton>

        {isEmojiPickerOpen && (
          <div onSelect={handleEmojiClick} style={{ position: 'absolute', bottom: '60px', zIndex: 1000 }}>
            <Picker data={data} onEmojiSelect={handleEmojiClick} />
          </div>
        )}

        <StyledTextField
          placeholder="Type a message..."
          value={message}
          onChange={(e) => { setMessage(e.target.value); handleTyping(); }}
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