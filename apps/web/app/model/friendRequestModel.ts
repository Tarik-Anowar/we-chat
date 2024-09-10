import mongoose, { Schema, Document, Model } from "mongoose";

interface IfriendRequest extends Document {
    senderId: Schema.Types.ObjectId;
    receiverId: Schema.Types.ObjectId;
}

const friendRequestSchema = new Schema<IfriendRequest>({
    senderId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    receiverId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }
});

const FriendRequest:Model<IfriendRequest> = mongoose.models.FriendRequest || mongoose.model<IfriendRequest>('FriendRequest', friendRequestSchema);
export default FriendRequest;
