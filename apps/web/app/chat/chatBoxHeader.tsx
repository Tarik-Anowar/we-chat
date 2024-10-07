import * as React from 'react';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import { Alert, debounce, Snackbar } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import ChatIcon from '@mui/icons-material/Chat';
import AdsClickIcon from '@mui/icons-material/AdsClick';
import AddBoxIcon from '@mui/icons-material/AddBox';
import Tooltip from '@mui/material/Tooltip';
import { useSession } from 'next-auth/react';
import { useState, useCallback, useRef } from 'react';
import { Types } from 'mongoose';
import { searchUser } from '../actions/serverActions';
import UserAvatar from '../components/Avatar';
import styles from '../styles/chatHeader.module.css';
import { sendFriendRequest } from '../actions/friendRequest';
import CreateChatGroupModal from './creteGroup';

interface SUser {
    _id: string;
    username: string;
    name: string;
    image?: string;
}

const debouncedSearch = debounce(async (value: string, setSearchedUsers: React.Dispatch<React.SetStateAction<SUser[]>>) => {
    try {
        if (value !== '') {
            const users = await searchUser({ value });
            setSearchedUsers(users);
        }
    } catch (error) {
        console.error('Error searching users:', error);
        setSearchedUsers([]);
    }
}, 300);

interface ChatHeaderProps {
    setRenderOption: (option: string) => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ setRenderOption }) => {
    const [searchedUsers, setSearchedUsers] = useState<SUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<SUser | null>(null);
    const { data: session, status } = useSession();
    const userId = session?.user.id as string | undefined;
    const inputRef = useRef<HTMLInputElement>(null);

    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
    const [newGroupModalOn, setNewGroupModalOn] = useState(false);
    const [createGroupResponse, setCreateGroupResponse] = useState<any>(null);

    const [dropdownOpen, setDropdownOpen] = useState(false);

    const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value.trim();
        if (status === 'authenticated' && value !== '') {
            debouncedSearch(value, setSearchedUsers);
            setDropdownOpen(true);
        } else {
            setSearchedUsers([]);
            setDropdownOpen(false);
        }
    }, [userId]);

    const handleUserSelect = (user: SUser) => {
        setSelectedUser(user);
        setDropdownOpen(false);
    };

    const handleAddClick = async (userIdToAdd: string) => {
        try {
            if (userId) {
                await sendFriendRequest({ senderId: userId, receiverId: userIdToAdd });
                setSearchedUsers([]);
                if (inputRef.current) {
                    inputRef.current.value = '';
                }
                setSnackbarMessage('Friend request sent successfully!');
                setSnackbarSeverity('success');
            } else {
                throw new Error('User ID is not available.');
            }
        } catch (error: any) {
            console.error('Error sending friend request:', error);
            setSnackbarMessage(error?.message || 'An error occurred');
            setSnackbarSeverity('error');
        }
        setSnackbarOpen(true);
    };

    const handleCloseSnackbar = () => {
        setSnackbarOpen(false);
    };

    const filteredUsers = searchedUsers.filter(user => user._id !== userId);

    return (
        <div className={styles.chatHeaderContainer}>
            <Tooltip title="Search users" placement="right-end" arrow>
                <Stack spacing={1} sx={{ width: 250, height: 40 }}>
                    <TextField
                        id="search-input"
                        label="Search users"
                        inputRef={inputRef}
                        onChange={handleSearchChange}
                        sx={{
                            '& .MuiInputBase-root': {
                                height: 40,
                            },
                            '& .MuiInputLabel-root': {
                                fontSize: '0.8rem',
                            },
                        }}
                    />
                    {dropdownOpen && filteredUsers.length > 0 && (
                        <div className={styles.dropdown}>
                            {filteredUsers.map((user) => (
                                <div key={user._id} className={styles.dropdownItem} onClick={() => handleUserSelect(user)}>
                                    <Stack direction="row" spacing="1" alignItems="center" sx={{ width: '100%', height: '35px',backgroundColor:'white',color:'black',zIndex:1000,position:'relative',padding:'5px'}}>
                                        <UserAvatar userId={user._id} name={user.name} imageUrl={user.image} size={25} />
                                        <div className={styles.userInfo}>
                                            <div className={styles.name}>{user.name}</div>
                                            <strong className={styles.username}>{user.username}</strong>
                                        </div>
                                        <div className={styles.addButton}>
                                            <PersonAddIcon onClick={() => handleAddClick(user._id)} />
                                        </div>
                                    </Stack>
                                </div>
                            ))}
                        </div>
                    )}
                </Stack>
            </Tooltip>

            <div>
                <Tooltip title="All Chats" arrow>
                    <ChatIcon className={styles.icon} onClick={() => setRenderOption('all-chats')} />
                </Tooltip>
            </div>
            <div>
                <Tooltip title="Updates" arrow>
                    <AdsClickIcon className={styles.icon} onClick={() => setRenderOption('updates')} />
                </Tooltip>
            </div>
            <div>
                <Tooltip title="Friend Requests" arrow>
                    <PeopleAltIcon className={styles.icon} onClick={() => setRenderOption('friend-requests')} />
                </Tooltip>
            </div>
            <div>
                <Tooltip title="New Group" arrow>
                    <AddBoxIcon className={styles.icon} onClick={() => setNewGroupModalOn(!newGroupModalOn)} />
                </Tooltip>
            </div>
            <Snackbar open={snackbarOpen} autoHideDuration={5000} onClose={handleCloseSnackbar}>
                <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>

            {newGroupModalOn && <CreateChatGroupModal newGroupModalOn={newGroupModalOn} setNewGroupModalOn={setNewGroupModalOn} setCreateGroupResponse={setCreateGroupResponse} />}
        </div>
    );
};

export default ChatHeader;
