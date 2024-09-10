"use client"

import { Button, Stack, styled } from "@mui/material";
import React, { useCallback, useEffect, useState } from "react";
import UserAvatar from "../components/Avatar";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { acceptRequest, deleteFriendRequest, fetchInComingFriendRequest, fetchOutGoingFriendRequest } from "../actions/friendRequest";
import { useSession } from "next-auth/react";

interface Friends {
    _id: string,
    name: string;
    username: string,
    image?: string
}

const RequestContainer = styled('div')({
    marginRight: '30px',
    padding: '10px',
    paddingLeft: '20px',
    paddingRight: '20px',
    backgroundColor: '#f0f0f0',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    borderRadius: '8px'
});

const IncomingButton = styled(Button)({
    marginRight: '8px',
    textTransform: 'none',
    color: 'blue',
});

const OutgoingButton = styled(Button)({
    textTransform: 'none'
});

const UserInfo = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    marginLeft: '8px'
});

const Name = styled('div')({
    fontWeight: 'bold'
});

const Username = styled('strong')({
    color: 'gray'
});

const ButtonGroup = styled('div')({
    display: 'flex',
    gap: '8px',
    marginLeft: 'auto',
    cursor: 'pointer'
});

const RequestOption = styled('div')({
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-evenly'
})

const Friends: React.FC = () => {
    const { data: session } = useSession();
    const [isIncoming, setIncoming] = useState(true);
    const [incomingRequest, setIncomingRequest] = useState<Friends[]>([]);
    const [outGoingRequest, setOutGoingRequest] = useState<Friends[]>([]);

    const fetchFriendRequests = useCallback(async () => {
        if (session?.user.id) {
            if (isIncoming) {
                const incoming = await fetchInComingFriendRequest(session.user.id);
                setIncomingRequest(incoming);
            } else {
                const outgoing = await fetchOutGoingFriendRequest(session.user.id);
                setOutGoingRequest(outgoing);
            }
        }
    }, [isIncoming, session?.user.id]);

    useEffect(() => {
        fetchFriendRequests();
    }, [fetchFriendRequests]);

    const handleAddClick = async (id: string) => {
        const result = await acceptRequest({ requestId: id });
        if (result.success) {
            setIncomingRequest(prevRequests => prevRequests.filter(request => request._id !== id));
        } else {
            console.error(result.message);
        }
    }
    
    const handleCancelClick = async (id: string) => {
        const result = await deleteFriendRequest({ requestId: id });
        if (result.success) {
            setIncomingRequest(prevRequests => prevRequests.filter(request => request._id !== id));
            setOutGoingRequest(prevRequests => prevRequests.filter(request => request._id !== id));
        } else {
            console.error(result.message);
        }
    }
    
    

    return (
        <div>
            <RequestOption>
                <IncomingButton onClick={() => setIncoming(true)}>
                    Incoming
                </IncomingButton>
                <OutgoingButton onClick={() => setIncoming(false)}>
                    Outgoing
                </OutgoingButton>
            </RequestOption>
            {
                isIncoming ? (
                    <div>
                        {
                            incomingRequest.length > 0 ?
                            incomingRequest.map((request) => (
                                <RequestContainer key={request._id}>
                                    <Stack direction="row" spacing="1" alignItems="center" sx={{ width: '100%', height: '35px' }} justifyContent="space-between">
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <UserAvatar userId={request._id} name={request.name} imageUrl={request.image} size={25} />
                                            <UserInfo>
                                                <Name>{request.name}</Name>
                                                <Username>{request.username}</Username>
                                            </UserInfo>
                                        </div>
                                        <ButtonGroup>
                                            <CheckCircleIcon onClick={() => handleAddClick(request._id)} />
                                            <CancelIcon onClick={() => handleCancelClick(request._id)} />
                                        </ButtonGroup>
                                    </Stack>
                                </RequestContainer>
                            )) : <div>No incoming requests</div>
                        }
                    </div>
                ) : (
                    <div>
                        {
                            outGoingRequest.length > 0 ?
                            outGoingRequest.map((request) => (
                                <RequestContainer key={request._id}>
                                    <Stack direction="row" spacing="1" alignItems="center" sx={{ width: '100%', height: '35px' }} justifyContent="space-between">
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <UserAvatar userId={request._id} name={request.name} imageUrl={request.image} size={25} />
                                            <UserInfo>
                                                <Name>{request.name}</Name>
                                                <Username>{request.username}</Username>
                                            </UserInfo>
                                        </div>
                                        <ButtonGroup>
                                            <CancelIcon onClick={() => handleCancelClick(request._id)} />
                                        </ButtonGroup>
                                    </Stack>
                                </RequestContainer>
                            )) : <div>No outgoing requests</div>
                        }
                    </div>
                )
            }
        </div>
    )
}

export default Friends;
