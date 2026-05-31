import { connectDB } from "@/lib/db";
import User from "@/models/User";

import bcrypt from "bcryptjs";

import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

declare module "next-auth" {
  interface User {
    id: string;
    username: string;
    role: string;
  }
  interface Session {
    user: User & {
      id: string;
      username: string;
      role: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    role: string;
  }
}

export const authOptions: AuthOptions = {
  session: {
    strategy: "jwt",
  },

  providers: [
    CredentialsProvider({
      name: "credentials",

      credentials: {
        email: {},
        password: {},
      },

      async authorize(credentials) {
        try {
          await connectDB();

          const email = credentials?.email;
          const password = credentials?.password;

          if (!email || !password) {
            throw new Error(
              "Email and password required"
            );
          }

          const user = await User.findOne({
            email: email.toLowerCase(),
          });

          if (!user) {
            throw new Error(
              "Invalid credentials"
            );
          }

          if (!user.isVerified) {
            throw new Error(
              "Please verify your email first"
            );
          }

          const isPasswordCorrect =
            await bcrypt.compare(
              password,
              user.password
            );

          if (!isPasswordCorrect) {
            throw new Error(
              "Invalid credentials"
            );
          }

          return {
            id: user._id.toString(),
            email: user.email,
            username: user.username,
            role: user.role,
          };
        } catch (error) {
          throw error;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id =
          token.id as string;

        session.user.username =
          token.username as string;

        session.user.role =
          token.role as string;
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};