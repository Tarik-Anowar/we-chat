import React, { useCallback, useState } from 'react';
import {
  Button,
  Modal,
  Box,
  Typography,
  TextField,
  Checkbox,
  List,
  ListItem,
  ListItemIcon,
  Snackbar,
  styled,
  debounce,
  Tooltip,
  Stack,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { createGroup, searchUser } from '../actions/serverActions';
import { useSession } from 'next-auth/react';
import UserAvatar from '../components/Avatar';

interface SUser {
  _id: string;
  username: string;
  name: string;
  image?: string;
}

interface createGroupProps {
  newGroupModalOn: boolean;
  setNewGroupModalOn: React.Dispatch<React.SetStateAction<boolean>>;
  setCreateGroupResponse: React.Dispatch<React.SetStateAction<any>>;
}

const Buttons = styled('div')({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-evenly',
});

const debouncedSearch = debounce(
  async (value: string, setSearchedUsers: React.Dispatch<React.SetStateAction<SUser[]>>) => {
    try {
      if (value !== '') {
        const users: SUser[] = await searchUser({ value });
        setSearchedUsers(users);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchedUsers([]);
    }
  },
  300
);

const StyledInput = styled('input')(({ theme }) => ({
  padding: '10px',
  width: '300px',
  borderRadius: '5px',
  border: '1px solid #ccc',
  fontSize: '16px',
  '&:focus': {
    outline: 'none',
    borderColor: theme.palette.primary.main,
    boxShadow: `0 0 5px ${theme.palette.primary.main}`,
  },
}));

const StyledList = styled('div')({
  height: '300px',
  overflowY: 'auto',
});

const CreateChatGroupModal: React.FC<createGroupProps> = ({
  newGroupModalOn,
  setNewGroupModalOn,
  setCreateGroupResponse,
}) => {
  const [groupName, setGroupName] = useState<string>('');
  const [selectedMembers, setSelectedMembers] = useState<SUser[]>([]);
  const [error, setError] = useState<boolean>(false);
  const [searchedUsers, setSearchedUsers] = useState<SUser[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarStatus, setSnackbarStatus] = useState<'success' | 'error'>('success');
  const { data: session, status } = useSession();

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      if (status === 'authenticated' && value.trim() !== '') {
        debouncedSearch(value, setSearchedUsers);
      } else {
        setSearchedUsers([]);
      }
    },
    [session?.user.id]
  );

  const handleClose = () => setNewGroupModalOn(false);

  const handleToggleMember = (user: SUser) => {
    setSelectedMembers((prevSelected) =>
      prevSelected.some((member) => member._id === user._id)
        ? prevSelected.filter((member) => member._id !== user._id)
        : [...prevSelected, user]
    );
  };

  const handleRemoveMember = (id: string) => {
    setSelectedMembers((prevSelected) =>
      prevSelected.filter((member) => member._id !== id)
    );
  };

  const handleCreateGroup = async () => {
    if (selectedMembers.length < 2) {
      setError(true);
    } else {
      if (!groupName) return;
      const selectedIds: string[] = [];
      selectedMembers.forEach((member) => {
        if (!selectedIds.includes(member._id)) {
          selectedIds.push(member._id);
        }
      });

      try {
        const response = await createGroup({ selectedIds, groupName });
        setCreateGroupResponse(response);

        setSnackbarMessage('Group created successfully!');
        setSnackbarStatus('success');
      } catch (error) {
        setSnackbarMessage('Failed to create group. Try again.');
        setSnackbarStatus('error');
      } finally {
        setSnackbarOpen(true);
        setGroupName('');
        setSelectedMembers([]);
        setNewGroupModalOn(false);
      }
    }
  };

  return (
    <div>
      <Modal open={newGroupModalOn} onClose={handleClose}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            maxHeight: 600,
            overflowY: 'auto',
            overflowX: 'hidden',
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
          }}
        >
          <Typography variant="h6" component="h2">
            Create New Chat Group
          </Typography>

          <TextField
            fullWidth
            label="Group Name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            margin="normal"
          />
          <Tooltip title="Search users" placement="right-end" arrow>
            <StyledInput
              type="text"
              name="input"
              onChange={handleSearchChange}
              placeholder="Search users"
            />
          </Tooltip>

          <Typography variant="subtitle1" gutterBottom>
            Select Members (At least 2):
          </Typography>
          <Stack direction="row" spacing={1} sx={{ marginBottom: 2, overflowX: 'auto' }}>
            {selectedMembers &&
              selectedMembers.length > 0 &&
              selectedMembers.map((selectedUser) => (
                <Stack key={selectedUser._id} direction="row" spacing={1} alignItems="center">
                  <UserAvatar
                    userId={selectedUser._id}
                    name={selectedUser.name}
                    imageUrl={selectedUser.image}
                    size={30}
                  />
                  <Typography>{selectedUser.name}</Typography>
                  <IconButton onClick={() => handleRemoveMember(selectedUser._id)} size="small">
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
          </Stack>

          <StyledList>
            <List>
              {searchedUsers.map((user) => (
                <ListItem key={user._id} button onClick={() => handleToggleMember(user)}>
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={selectedMembers.some((member) => member._id === user._id)}
                    />
                  </ListItemIcon>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                    <UserAvatar userId={user._id} name={user.name} imageUrl={user.image} size={40} />
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{user.name}</div>
                      <div style={{ color: 'gray' }}>{user.username}</div>
                    </div>
                  </Stack>
                </ListItem>
              ))}
            </List>
          </StyledList>
          <Buttons>
            <Button
              variant="contained"
              fullWidth
              color="primary"
              onClick={() => setNewGroupModalOn(false)}
              sx={{ margin: '2px' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              fullWidth
              color="primary"
              onClick={handleCreateGroup}
              sx={{ margin: '2px' }}
            >
              Create Group
            </Button>
          </Buttons>

          {error && (
            <Snackbar
              open={error}
              autoHideDuration={3000}
              onClose={() => setError(false)}
              message="Please select at least 2 members."
            />
          )}

          {/* Snackbar for response messages */}
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={4000}
            onClose={() => setSnackbarOpen(false)}
            message={snackbarMessage}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            ContentProps={{
              sx: {
                backgroundColor: snackbarStatus === 'success' ? 'green' : 'red',
              },
            }}
          />
        </Box>
      </Modal>
    </div>
  );
};

export default CreateChatGroupModal;
