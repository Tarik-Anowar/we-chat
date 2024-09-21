import { Session as NextAuthSession } from "next-auth";
import { JWT as NextAuthJWT } from "next-auth/jwt";

// Extend the NextAuth session type
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      name: string;
      image?: string | null;
    } & NextAuthSession["user"];
  }
}

// Extend the NextAuth JWT type
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    name: string;
  }
}
