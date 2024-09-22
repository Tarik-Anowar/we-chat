import mongoose, { Document, Schema, Types, Model } from 'mongoose';

export interface IReadStatus extends Document {
    chatId: Types.ObjectId;
    participantId: Types.ObjectId;
    lastReadMessageId?: Types.ObjectId |null;
}

const ReadStatusSchema: Schema<IReadStatus> = new Schema({
    chatId: {
        type: Schema.Types.ObjectId,
        ref: 'Chat',
        required: true,
    },
    participantId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    lastReadMessageId: {
        type: Schema.Types.ObjectId,
        ref: 'Message',
        required: false,
    },
}, { timestamps: true });

ReadStatusSchema.index({ chatId: 1, participantId: 1}, { unique: true });

const ReadStatus: Model<IReadStatus> = mongoose.models.ReadStatus || mongoose.model<IReadStatus>('ReadStatus', ReadStatusSchema);
export default ReadStatus;
