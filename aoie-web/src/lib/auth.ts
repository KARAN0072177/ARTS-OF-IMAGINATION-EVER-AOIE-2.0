import { connectDB } from "@/lib/db";
import User from "@/models/User";
import {
  logPlatformActivity,
  trackFailedLoginAttempt,
  extractClientIp,
  isIpBlocked,
  blockIpFor30Mins,
} from "@/lib/telemetry";

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
    loginProvider?: string;
  }
  interface Session {
    user: User & {
      id: string;
      username?: string;
      role: string;
      usernameSetupRequired?: boolean;
      loginProvider?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username?: string;
    role: string;
    usernameSetupRequired?: boolean;
    loginProvider?: string;
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

      async authorize(credentials, req) {
        try {
          await connectDB();

          const clientInfo = extractClientIp(req?.headers);
          if (isIpBlocked(clientInfo.ipAddress)) {
            logPlatformActivity({
              category: "SECURITY",
              severity: "EMERGENCY",
              eventType: "BLOCKED_IP_LOGIN_ATTEMPT",
              actor: { email: credentials?.email || "unknown", username: "blocked-ip", ...clientInfo },
              details: {
                route: "/api/auth/callback/credentials",
                attackVector: "30-Minute IP Lockout Active",
                payloadSnippet: `Blocked IP ${clientInfo.ipAddress} attempted login.`,
              },
            }).catch(() => {});
            throw new Error("IP temporarily blocked for 30 minutes due to excessive failed login attempts.");
          }

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
            const { count, isBruteForce } = trackFailedLoginAttempt(email.toLowerCase());
            if (isBruteForce) {
              blockIpFor30Mins(clientInfo.ipAddress);
              logPlatformActivity({
                category: "SECURITY",
                severity: "CRITICAL",
                eventType: "AUTH_BRUTE_FORCE",
                actor: { email: email.toLowerCase(), username: "unknown", ...clientInfo },
                details: {
                  route: "/api/auth/callback/credentials",
                  attackVector: `Brute-Force Password Surge (${count} failed attempts in 60s). IP blocked for 30 mins.`,
                  failureCount: count,
                  payloadSnippet: `Repeated invalid credentials targeting email ${email}`,
                },
              }).catch(() => {});
            } else {
              logPlatformActivity({
                category: "AUTH",
                severity: "WARNING",
                eventType: "FAILED_LOGIN_ATTEMPT",
                actor: { email: email.toLowerCase(), username: "unknown", ...clientInfo },
                details: { route: "/api/auth/callback/credentials", attackVector: "Non-existent Account", failureCount: count },
              }).catch(() => {});
            }
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
            const { count, isBruteForce } = trackFailedLoginAttempt(user.email);
            if (isBruteForce) {
              blockIpFor30Mins(clientInfo.ipAddress);
              logPlatformActivity({
                category: "SECURITY",
                severity: "CRITICAL",
                eventType: "AUTH_BRUTE_FORCE",
                actor: { email: user.email, username: user.username || "", ...clientInfo },
                details: {
                  route: "/api/auth/callback/credentials",
                  attackVector: `Brute-Force Password Surge (${count} failed attempts in 60s). IP blocked for 30 mins.`,
                  failureCount: count,
                  payloadSnippet: `Repeated invalid credentials targeting account ${user.email}`,
                },
              }).catch(() => {});
            } else {
              logPlatformActivity({
                category: "AUTH",
                severity: "WARNING",
                eventType: "FAILED_LOGIN_ATTEMPT",
                actor: { email: user.email, username: user.username || "", ...clientInfo },
                details: { route: "/api/auth/callback/credentials", attackVector: "Invalid Password", failureCount: count },
              }).catch(() => {});
            }

            throw new Error(
              "Invalid credentials"
            );
          }

          logPlatformActivity({
            category: "AUTH",
            severity: "INFO",
            eventType: "USER_LOGIN_SUCCESS",
            actor: { userId: user._id, email: user.email, username: user.username || "", ...clientInfo },
            details: { route: "/api/auth/callback/credentials" },
          }).catch(() => {});

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

    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
        token.usernameSetupRequired =
          !!user.usernameSetupRequired;
        token.loginProvider =
          account?.provider ===
          "credentials"
            ? "email"
            : account?.provider ||
              token.loginProvider ||
              "email";
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

        session.user.loginProvider =
          token.loginProvider as
            | string
            | undefined;
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  events: {
    async signIn({ user, account, isNewUser }) {
      if (account?.provider === "google") {
        logPlatformActivity({
          category: "AUTH",
          severity: "INFO",
          eventType: isNewUser ? "USER_REGISTERED_GOOGLE" : "USER_LOGIN_GOOGLE",
          actor: {
            userId: user.id,
            email: user.email || "",
            username: user.username || "",
          },
          details: {
            route: "/api/auth/callback/google",
            metadata: { provider: "google" },
          },
        }).catch(() => {});
      }
    },
    async signOut({ token }) {
      if (token?.id) {
        logPlatformActivity({
          category: "AUTH",
          severity: "INFO",
          eventType: "USER_LOGOUT",
          actor: {
            userId: token.id as string,
            email: (token.email as string) || "",
            username: (token.username as string) || "",
          },
          details: {
            route: "/api/auth/signout",
          },
        }).catch(() => {});
      }
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
