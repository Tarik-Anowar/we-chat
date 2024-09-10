import mongoose, { Schema, Document, Types, Model } from "mongoose";

enum MessageType {
    TEXT = "TEXT",
    IMAGE = "IMAGE",
    VIDEO = "VIDEO",
    LINK = "LINK",
    PDF = "PDF",
    AUDIO = "AUDIO",
}

interface IMessage extends Document {
    author: Types.ObjectId;
    content: {
        type: MessageType;
        value: string;
    };
    createdAt: Date;
    updatedAt?: Date;
}

const messageSchema = new Schema<IMessage>({
    author: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    content: {
        type: {
            type: String,
            enum: Object.values(MessageType),
            required: true,
        },
        value: {
            type: String,
            required: true,
        },
    },
}, { timestamps: true });

messageSchema.index({ author: 1 });
messageSchema.index({ createdAt: 1 });

const Message: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>('Message', messageSchema);
export default Message;
