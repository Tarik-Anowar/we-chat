import mongoose, { Document, Model, Schema } from 'mongoose';
import { Types } from 'mongoose';

interface Participant {
    _id: Types.ObjectId;
}

interface Message {
    _id: Types.ObjectId;
}

export interface IChat extends Document {
    type?: 'DIRECT' | 'GROUP';
    name?: string;
    image?: string;
    participants?: Participant[];
    messages?: Message[];
    lastMessage?: Message;
    admins?: Types.ObjectId[];
    createdBy?: Types.ObjectId;
}

const ChatSchema: Schema = new Schema({
    type: { 
        type: String, 
        enum: ['DIRECT', 'GROUP'], 
        default: 'DIRECT',
    },
    name: { 
        type: String, 
        validate: {
            validator: function (this: IChat, value: string) {
                return this.type === 'GROUP' ? Boolean(value) : true;
            },
            message: 'Chat name is required for group chats',
        },
    },
    image: {
        type: String,
        require: false,
    },
    participants: [{ 
        type: Schema.Types.ObjectId, 
        ref: 'User',
    }],
    messages: [{ 
        type: Schema.Types.ObjectId, 
        ref: 'Message',
    }],
    lastMessage: {
        type: Schema.Types.ObjectId, 
        ref: 'Message',
    },
    admins: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
    }],
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        validate: {
            validator: function (this: IChat, value: Types.ObjectId) {
                return this.type === 'GROUP' ? Boolean(value) : true;
            },
            message: 'Group chats must have a creator',
        },
    },
});

const Chat: Model<IChat> = mongoose.models.Chat || mongoose.model<IChat>('Chat', ChatSchema);
export default Chat;
