import { connectDB } from "@/lib/db";
import User from "@/models/User";

import bcrypt from "bcryptjs";

import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

declare module "next-auth" {
  interface User {
    id: string;
    username?: string;
    role: string;
    usernameSetupRequired?: boolean;
  }
  interface Session {
    user: User & {
      id: string;
      username?: string;
      role: string;
      usernameSetupRequired?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username?: string;
    role: string;
    usernameSetupRequired?: boolean;
  }
}

async function attachGoogleAccount({
  email,
  googleId,
}: {
  email: string;
  googleId: string;
}) {
  await connectDB();

  const normalizedEmail =
    email.toLowerCase();

  let user = await User.findOne({
    $or: [
      {
        googleId,
      },
      {
        email: normalizedEmail,
      },
    ],
  });

  if (user) {
    user.googleId = googleId;
    user.isVerified = true;
    user.authProviders = Array.from(
      new Set([
        ...(user.authProviders || []),
        "google",
      ])
    );
    user.usernameSetupRequired =
      !user.username;

    await user.save();

    return user;
  }

  user = await User.create({
    email: normalizedEmail,
    username: null,
    role: "user",
    isVerified: true,
    googleId,
    authProviders: ["google"],
    usernameSetupRequired: true,
  });

  return user;
}

export const authOptions: AuthOptions = {
  session: {
    strategy: "jwt",
  },

  providers: [
    GoogleProvider({
      clientId:
        process.env.GOOGLE_CLIENT_ID || "",
      clientSecret:
        process.env.GOOGLE_CLIENT_SECRET ||
        "",
    }),

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

          if (!user.password) {
            throw new Error(
              "Please continue with Google"
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
            username:
              user.username || undefined,
            role: user.role,
            usernameSetupRequired:
              !!user.usernameSetupRequired,
          };
        } catch (error) {
          throw error;
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") {
        return true;
      }

      if (
        !user.email ||
        !account.providerAccountId
      ) {
        return false;
      }

      const dbUser =
        await attachGoogleAccount({
          email: user.email,
          googleId:
            account.providerAccountId,
        });

      user.id = dbUser._id.toString();
      user.username =
        dbUser.username || undefined;
      user.role = dbUser.role;
      user.usernameSetupRequired =
        !!dbUser.usernameSetupRequired;

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
        token.usernameSetupRequired =
          !!user.usernameSetupRequired;
      } else if (token.id) {
        await connectDB();

        const dbUser = await User.findById(
          token.id
        )
          .select(
            "username role usernameSetupRequired"
          )
          .lean();

        if (dbUser) {
          token.username =
            dbUser.username || undefined;
          token.role = dbUser.role;
          token.usernameSetupRequired =
            !!dbUser.usernameSetupRequired;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id =
          token.id as string;

        session.user.username =
          token.username as
            | string
            | undefined;

        session.user.role =
          token.role as string;

        session.user.usernameSetupRequired =
          !!token.usernameSetupRequired;
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
