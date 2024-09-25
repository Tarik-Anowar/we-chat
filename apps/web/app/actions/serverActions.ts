'use server'
import connectToDatabase from "../lib/db";
import Chat from "../model/chatModel";
import { getServerSession } from "next-auth";
import { Types } from 'mongoose';
import User, { IUser } from "../model/userModel";
import { NEXT_AUTH } from "../lib/auth";
import Message from "../model/messaageModel";
import ReadStatus from "../model/readStatusModel";

enum ChatType { DIRECT = "DIRECT", GROUP = "GROUP" }

interface Participant {
    _id: string;
    name: string;
    username: string;
    image?: string;
}

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


interface IChat {
    _id: string;
    type?: "DIRECT" | "GROUP";
    name: string;
    participants?: Participant[];
    messages?: Message[];
}


interface PChat {
    _id: string;
    name: string;
    image?: string;
    lastMessage: Message;
    unreadCount: number;
}

function getString(id: Types.ObjectId): string {
    return id.toString();
}



export const getAllChats = async (): Promise<PChat[]> => {
    const session = await getServerSession(NEXT_AUTH);
    try {
        if (!session?.user?.id) {
            throw new Error('User is not authenticated');
        }
        await connectToDatabase();

        // Fetch all chats where the user is a participant
        const allChats = await Chat.find({ participants: session.user.id })
            .populate('participants', '_id name image')
            .populate('lastMessage', '_id content sender createdAt')
            .exec();

        // Fetch all read statuses for the user
        const readStatuses = await ReadStatus.find({ participantId: session.user.id }).exec();

        return await Promise.all(allChats.map(async (chat: any) => {
            // Find the user's last read status for this chat
            const lastReadMessageStatus = readStatuses.find((status: any) =>
                getString(status.chatId as Types.ObjectId) === getString(chat._id as Types.ObjectId)
            );
            
            let unreadCount = 0;

            // If the user has read some messages, calculate unread messages
            if (lastReadMessageStatus && lastReadMessageStatus.lastReadMessageId) {
                chat.messages.forEach((message: any) => {
                    // Compare message IDs to find unread messages
                    if (
                        getString(message._id as Types.ObjectId) >
                        getString(lastReadMessageStatus.lastReadMessageId as Types.ObjectId)
                    ) {
                        unreadCount++;
                    }
                });
            } else {
                // If no lastReadMessageId, consider all messages unread
                unreadCount = chat.messages.length;
            }

            // Return the processed chat details
            return {
                _id: getString(chat._id as Types.ObjectId),
                name: chat.type === 'DIRECT'
                    ? chat.participants.find((participant: any) => getString(participant._id as Types.ObjectId) !== session?.user.id)?.name
                    : chat.name,
                image: chat.type === 'DIRECT'
                    ? chat.participants.find((participant: any) => getString(participant._id as Types.ObjectId) !== session?.user.id)?.image
                    : chat.image,
                lastMessage: chat.lastMessage,
                unreadCount: unreadCount,
            };
        }));
    } catch (error) {
        console.error('Failed to fetch chats:', error);
        throw new Error('Failed to fetch chats');
    }
};


export const getAllChatIds = async (): Promise<string[]> => {
    const session = await getServerSession(NEXT_AUTH); {
        try {
            if (!session?.user?.id) {
                throw new Error('User is not authenticated');
            }
            await connectToDatabase();

            const chats = await Chat.find({ participants: session.user.id }).select('_id').exec();
            let allChatIds: string[] = [];
            chats.forEach((chat) => { allChatIds.push(getString(chat._id as Types.ObjectId)) });
            return allChatIds;
        } catch (error) {
            throw new Error('Failed to fetch chat ids');
        }
    }
}
export const getSingleChat = async (chatId: string): Promise<IChat> => {
    const session = await getServerSession(NEXT_AUTH);
    if (!session || !session.user || !session.user.id) {
        throw new Error('User not authenticated');
    }

    try {
        await connectToDatabase();
        const chatObjId = new Types.ObjectId(chatId);
        const chat = await Chat.findById(chatObjId)
            .populate('participants', '_id name username image')
            .populate("messages", "_id content author createdAt updatedAt")
            .exec();

        if (!chat) {
            throw new Error('Chat not found');
        }

        const participants: any[] = chat?.participants || [];

        // Return the chat details including participants
        const singleChat: any = {
            _id: getString(chat?._id as Types.ObjectId),
            type: chat?.type,
            name: chat?.type === 'DIRECT'
                ? participants.find((participant: Participant) => participant._id !== session?.user.id)?.name || ''
                : chat?.name,
            image: chat?.type === 'DIRECT'
                ? participants.find((participant: Participant) => participant._id !== session?.user.id)?.image || ''
                : chat?.image,
            messages: chat?.messages,
            participants,  // Include participants in the return object
        };

        return singleChat;
    } catch (error) {
        console.error('Error loading chat:', error);
        throw new Error('Failed to load chat');
    }
};

interface SUser {
    _id: string;
    username: string;
    name: string;
}
export const searchUser = async ({ value }: { value: string }): Promise<SUser[]> => {
    const session = await getServerSession(NEXT_AUTH);
    try {
        if (!session?.user?.id) {
            throw new Error('User is not authenticated');
        }
        await connectToDatabase();
        const userId: string = session?.user.id;
        const userObjectId = new Types.ObjectId(userId)
        const users = await User.find({
            $and: [
                { _id: { $ne: userObjectId } },
                {
                    $or: [
                        { username: { $regex: value, $options: "i" } },
                        { name: { $regex: value, $options: "i" } }
                    ]
                }
            ]
        }).select('_id username name image').exec();

        return users.map((user: IUser) => ({
            _id: getString(user._id as Types.ObjectId),
            username: user.username,
            name: user.name,
            image: user.image,
        }));
    } catch (error) {
        console.error('Error searching for users:', error);
        throw new Error('Error searching for users');
    }
};
export const createGroup = async ({
    selectedIds,
    groupName,
}: {
    selectedIds: string[];
    groupName: string;
}) => {
    const session = await getServerSession(NEXT_AUTH);
    try {
        if (!session?.user?.id) {
            throw new Error('User is not authenticated');
        }

        await connectToDatabase();
        const userId: string = session.user.id;

        const admin: Types.ObjectId[] = [new Types.ObjectId(userId)];
        const participants = selectedIds.map((id: string) => new Types.ObjectId(id));

        if (!groupName) {
            throw new Error('Group name is required');
        }

        const newChat = new Chat({
            type: 'GROUP',
            name: groupName,
            admins: admin,
            createdBy: new Types.ObjectId(userId),
            participants: [...admin, ...participants],
        });

        await newChat.save();

        const readStatusEntries = newChat?.participants?.map(participantId => ({
            chatId: newChat._id,
            participantId: participantId,
            lastReadMessageId: null, 
        }));

        await ReadStatus.create(readStatusEntries);

        return {
            success: true,
            message: 'Group chat created successfully',
            chat: newChat,
        };
    } catch (error: any) {
        console.error('Error creating group chat', error);
        return {
            success: false,
            message: error?.message || 'Error creating group chat',
        };
    }
};



export const sendMessage = async ({ chatId, content }: { chatId: string, content: any }): Promise<Message> => {
    const session = await getServerSession(NEXT_AUTH);
    try {
        await connectToDatabase();
        if (!session?.user?.id) {
            throw new Error('User is not authenticated');
        }
        const newMessage = new Message({
            author: session.user.id,
            content: {
                type: content.type,
                value: content.value,
            }
        });

        const savedMessage = await newMessage.save();


        const lastMessage = savedMessage;
        if (lastMessage) {
            await ReadStatus.updateOne(
                { chatId: new Types.ObjectId(chatId as string), participantId: new Types.ObjectId(session?.user.id as string) },
                { $set: { lastReadMessageId: lastMessage._id } },
                { new: true }
            );
        }

        await Chat.findByIdAndUpdate(
            chatId,
            {
                $push: { messages: savedMessage._id },
                lastMessage: savedMessage._id
            },
            {
                new: true
            }
        );
        return {
            _id: getString(savedMessage._id as Types.ObjectId),
            author: getString(savedMessage.author as Types.ObjectId),
            content: {
                type: savedMessage.content.type,
                value: savedMessage.content.value,
            },
            createdAt: savedMessage.createdAt,
            updatedAt: savedMessage.updatedAt
        } as Message;
    } catch (error) {
        console.error('Error sending Message:', error);
        throw new Error('Failed to send Message');
    }
}

export const updateLastRead = async ({
    chatId,
    messageId,
}: {
    chatId: string;
    messageId: string;
}) => {
    const session = await getServerSession(NEXT_AUTH);
    if (!session?.user?.id) {
        throw new Error('User is not authenticated');
    }

    try {
        await connectToDatabase();
        if (messageId) {
            const result = await ReadStatus.updateOne(
                {
                    chatId: new Types.ObjectId(chatId as string),
                    participantId: new Types.ObjectId(session.user.id as string),
                },
                { $set: { lastReadMessageId: new Types.ObjectId(messageId as string) } },
                { new: true }
            );

            if (result.modifiedCount === 0) {
                throw new Error('No document found or updated');
            }
        }
    } catch (error:any) {
        console.error(error); 
        throw new Error('Failed to update message: ' + error.message);
    }
};