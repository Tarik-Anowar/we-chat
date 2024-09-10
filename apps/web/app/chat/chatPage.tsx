import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import styles from '../styles/chatPage.module.css';
import Friends from "./friends";
import AllChats from "./allchats";
import SingleChat from "./singleChatPage";
import { useSocket } from "../socketContest";

const ChatBox = ({ renderOption }: { renderOption: string }) => {
    const { data: session, status } = useSession();
    const [singleChatSelected, setSingleChatSelected] = useState('');
    const [isMobile, setIsMobile] = useState<boolean>(false);
    const socket = useSocket();

    const handleSetSingleChatSelected = (chatId: string) => {
        setSingleChatSelected(chatId);
    };

    useEffect(() => {
        if (socket && singleChatSelected) {
            socket.emit('join-chat', {chatId: singleChatSelected });
        }
    }, [singleChatSelected])

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 750);
        };

        handleResize();

        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (status === 'authenticated') {
        const userId = session?.user.id as string;

        return (
            <div className={styles.container}>
                {(!singleChatSelected || !isMobile) && (
                    <div className={styles.leftSide}>
                        {renderOption === 'all-chats' && (
                            <AllChats singleChatSelected={singleChatSelected} setSingleChatSelected={handleSetSingleChatSelected} />
                        )}
                        {renderOption === 'updates' && (
                            <div>updates</div>
                        )}
                        {renderOption === 'friend-requests' && (
                            <Friends />
                        )}
                    </div>
                )}

                {(singleChatSelected || !isMobile) && (
                    <div className={`${styles.rightSide} ${singleChatSelected ? styles.visible : ''}`}>
                        {singleChatSelected ? (
                            <SingleChat singleChatSelected={singleChatSelected} setSingleChatSelected={setSingleChatSelected} />
                        ) : (
                            <div>Select a chat to start messaging</div>
                        )}
                    </div>
                )}
                
            </div>
        );
    } else {
        return <div>No authorization</div>;
    }
};

export default ChatBox;
