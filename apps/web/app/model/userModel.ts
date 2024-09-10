import mongoose, { Types, Schema, Document,Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import validator from 'validator';

export interface IUser extends Document {
    name: string;
    username: string;
    password: string;
    image?: string;
    friends: Types.ObjectId[];
    resetPasswordToken?: string;
    resetPasswordExpire?: Date;
}

const userSchema = new Schema<IUser>({
    name: {
        type: String,
        required: [true, "Please enter your name"],
        maxlength: [30, "Name cannot exceed 30 characters"],
        minlength: [1, "Name must have at least 1 character"],
    },
    username: {
        type: String,
        required: [true, "Please enter your username"],
        unique: true,
        validate: [validator.isEmail, "Please enter a valid email address"],
    },
    password: {
        type: String,
        required: [false, "Please enter your password"],
        minlength: [8, "Password should be at least 8 characters"],
        select: false,
    },
    image: { type: String },
    friends: [{ type: Schema.Types.ObjectId, ref: "User" }],
    resetPasswordToken: { type: String},
    resetPasswordExpire: { type: Date },
}, { timestamps: true });

userSchema.pre<IUser>("save", async function (next) {
    if (!this.isModified("password")) return next();

    try {
        this.password = await bcrypt.hash(this.password, 10);
        next();
    } catch (error: unknown) {
        if (error instanceof Error) {
            next(error);
        } else {
            next(new Error('An unknown error occurred')); 
        }
    }
});

userSchema.methods.getResetPasswordToken = async function (): Promise<string> {
    const resetToken = crypto.randomBytes(20).toString("hex");

    this.resetPasswordToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000; 

    return resetToken;
};

const User: Model<IUser> = mongoose.models.User ?? mongoose.model<IUser>('User', userSchema);
export default User;
