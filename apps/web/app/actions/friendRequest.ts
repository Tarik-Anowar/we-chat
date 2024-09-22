'use server'
import { Types } from "mongoose";
import connectToDatabase from "../lib/db";
import FriendRequest from "../model/friendRequestModel";
import Chat from "../model/chatModel";
import User from "../model/userModel";
import ReadStatus from "../model/readStatusModel";

interface Friends {
    _id: string;
    name: string;
    username: string;
    image?: string;
}


function getString(id: Types.ObjectId): string {
    return id.toString();
}


export const sendFriendRequest = async ({ senderId, receiverId }: { senderId: string, receiverId: string }) => {
    try {
        await connectToDatabase();
        if (!senderId) {
            throw new Error('Sender ID is missing or invalid.');
        }
        if (!Types.ObjectId.isValid(senderId) || !Types.ObjectId.isValid(receiverId)) {
            throw new Error('Invalid ObjectId');
        }

        const existingRequest = await FriendRequest.findOne({
            senderId: new Types.ObjectId(senderId),
            receiverId: new Types.ObjectId(receiverId)
        });

        if (existingRequest) {
            throw new Error('Friend request already sent');
        }

        const newFriendRequest = new FriendRequest({
            senderId: new Types.ObjectId(senderId),
            receiverId: new Types.ObjectId(receiverId)
        });

        await newFriendRequest.save();
    } catch (error: any) {
        console.error('Error sending friend request:', error.message);
        throw new Error(`Failed to send friend request: ${error.message}`);
    }
};


export const fetchInComingFriendRequest = async (userId: string): Promise<Friends[]> => {
    try {
        await connectToDatabase();
        if (!userId) {
            throw new Error('User ID is missing or invalid.');
        }

        if (!Types.ObjectId.isValid(userId)) {
            throw new Error('Invalid ObjectId');
        }

        const requests = await FriendRequest.find({
            receiverId: new Types.ObjectId(userId)
        }).populate('senderId', 'name username image');

        return requests.map((request: any) => ({
            _id: request._id.toString(),
            name: request.senderId?.name,
            username: request.senderId?.username,
            image: request.senderId?.image
        }));
    } catch (error) {
        console.error('Error finding incoming friend requests:', error);
        throw error;
    }
};

export const fetchOutGoingFriendRequest = async (userId: string): Promise<Friends[]> => {
    try {
        await connectToDatabase();

        if (!userId) {
            throw new Error('User ID is missing or invalid.');
        }

        if (!Types.ObjectId.isValid(userId)) {
            throw new Error('Invalid ObjectId');
        }

        const requests = await FriendRequest.find({
            senderId: new Types.ObjectId(userId)
        })
            .populate({
                path: 'receiverId',
                select: 'name username image'
            });

        return requests.map((request: any) => ({
            _id: request._id.toString(),
            name: request?.receiverId?.name,
            username: request?.receiverId?.username,
            image: request?.receiverId?.image
        }));

    } catch (error) {
        console.error('Error finding outgoing friend requests:', error);
        throw error;
    }
};

export const acceptRequest = async ({ requestId }: { requestId: string }) => {
    try {
        if (!requestId) {
            throw new Error('User ID is missing or invalid.');
        }
        await connectToDatabase();
        const reqObjId = new Types.ObjectId(requestId);

        const request = await FriendRequest.findById(reqObjId).populate([
            {
                path: 'senderId',
                select: '_id'
            },
            {
                path: 'receiverId',
                select: '_id'
            },
        ]);

        if (!request) {
            throw new Error('Cannot find request');
        }

        const sender:any = request.senderId;
        const receiver:any = request.receiverId;

        if (!sender || !receiver) {
            throw new Error('Sender or receiver not found');
        }

        const existingChat = await Chat.findOne({
            participants: { $all: [sender._id, receiver._id] },
            type: 'DIRECT'
        });

        if (existingChat) {
            throw new Error('Chat already exists between these users.');
        }

        const newChat = new Chat({
            type: 'DIRECT',
            participants: [sender._id, receiver._id]
        });

        await newChat.save();
        await FriendRequest.deleteOne({ _id: reqObjId });

        await User.updateOne(
            { _id: sender._id },
            { $addToSet: { friends: receiver._id } }
        );

        await User.updateOne(
            { _id: receiver._id },
            { $addToSet: { friends: sender._id } }
        );

        const readStatusEntries = newChat?.participants?.map(participantId => ({
            chatId: newChat._id,
            participantId: participantId,
            lastReadMessageId: null, 
        }));

        await ReadStatus.create(readStatusEntries);

        return { success: true, message: 'Request accepted successfully' };
    } catch (error:any) {
        console.error('Error accepting friend request:', error);
        return { success: false, message: error?.message };
    }
}

export const deleteFriendRequest = async ({ requestId }: { requestId: string }) => {
    try {
        if (!requestId) {
            throw new Error('User ID is missing or invalid.');
        }
        await connectToDatabase();
        const reqObjId = new Types.ObjectId(requestId);

        const result = await FriendRequest.deleteOne({ _id: reqObjId });

        if (result.deletedCount === 0) {
            throw new Error('No request found to delete');
        }

        return { success: true, message: 'Request deleted successfully' };
    } catch (error:any) {
        console.error('Error deleting friend request:', error);
        return { success: false, message: error?.message };
    }
}
