import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from 'bcryptjs';
import GoogleProvider from "next-auth/providers/google";
import { NextAuthOptions } from "next-auth";
import connectToDatabase from "./db";
import User from "../model/userModel";
import { Types } from "mongoose";
function getString(id: Types.ObjectId): string {
    return id.toString();
}
export const NEXT_AUTH: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Email",
            credentials: {
                username: { label: 'Email', type: 'email', placeholder: 'Email' },
                password: { label: 'Password', type: 'password', placeholder: 'Password' }
            },
            async authorize(credentials) {
                const { username, password } = credentials || {};
                console.log(username)
                console.log(password)
                if (!username || !password) {
                
                    throw new Error("Username or password is missing.");
                }
                await connectToDatabase();
                const user = await User.findOne({ username })
                    .select('+password')
                    .populate('friends', 'name username image'); 

                if (!user || !user.password) {
                    throw new Error("No user found with this email or password is missing.");
                }

                const isMatch = await bcrypt.compare(password, user.password);

                if (!isMatch) {
                    throw new Error("Incorrect password.");
                }

                return {
                    id: getString(user._id as Types.ObjectId),
                    name: user.name,
                    username: user.username,
                    image: user.image,
                };
            }
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || ""
        })
    ],
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === 'google') {
                try {
                    await connectToDatabase();
                    const existingUser = await User.findOne({ username: profile?.email });
                    if (!existingUser) {
                        const newUser = await User.create({
                            name: profile?.name,
                            username: profile?.email,
                            image: profile?.image,
                        });
                        user.id = getString(newUser?._id as Types.ObjectId);
                    } else {
                        user.id = getString(existingUser._id as Types.ObjectId);
                    }
                } catch (error) {
                    console.error("Error in signIn callback:", error);
                    return false;
                }
            }
            return true;
        }
        ,

        async jwt({ token, user }) {
            if (user) {
                token.id = (user as any).id;
                token.username = (user as any).username;
                token.name = (user as any).name;
            }
            return token;
        },

        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.username = token.username as string;
                session.user.name = token.name as string;
            }
            return session;
        },
        async redirect({ url, baseUrl }) {
            return url.startsWith(baseUrl)
                ? url
                : baseUrl;
        }
    },
    pages: {
        signIn: "/api/auth/signin"
    }
};
