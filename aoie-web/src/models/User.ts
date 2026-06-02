import mongoose, { Schema, Document, Model } from "mongoose";

interface IArtistProfile {
  displayName: string;
  bio: string;
  website: string;
  location: string;

  avatar: string;
  banner: string;

  isArtistProfileComplete: boolean;
}

export interface IUser extends Document {
  username?: string | null;
  email: string;
  password?: string;

  role: "artist" | "user" | "admin" | "super-admin";

  isVerified: boolean;
  googleId?: string;
  authProviders: string[];
  usernameSetupRequired: boolean;

  artistProfile?: IArtistProfile;

  verificationToken?: string;
  verificationTokenExpiry?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      default: null,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
    },

    role: {
      type: String,
      enum: ["artist", "user", "admin", "super-admin"],
      default: "user",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    googleId: {
      type: String,
      default: "",
    },

    authProviders: {
      type: [String],
      default: ["credentials"],
    },

    usernameSetupRequired: {
      type: Boolean,
      default: false,
    },

    artistProfile: {
      displayName: {
        type: String,
        default: "",
      },

      bio: {
        type: String,
        default: "",
      },

      website: {
        type: String,
        default: "",
      },

      location: {
        type: String,
        default: "",
      },

      avatar: {
        type: String,
        default: "",
      },

      banner: {
        type: String,
        default: "",
      },

      isArtistProfileComplete: {
        type: Boolean,
        default: false,
      },
    },

    verificationToken: String,

    verificationTokenExpiry: Date,
  },
  {
    timestamps: true,
  }
);

UserSchema.index(
  {
    username: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      username: {
        $type: "string",
      },
    },
  }
);

UserSchema.index(
  {
    googleId: 1,
  },
  {
    sparse: true,
  }
);

if (
  process.env.NODE_ENV !== "production" &&
  mongoose.models.User
) {
  delete mongoose.models.User;
}

const User: Model<IUser> =
  mongoose.models.User ||
  mongoose.model<IUser>(
    "User",
    UserSchema
  );

export default User;
