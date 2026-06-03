import mongoose, {
  Schema,
  Document,
  Model,
  Types,
} from "mongoose";

export interface ICollection
  extends Document {
  user: Types.ObjectId;
  name: string;
  description: string;
  artworks: Types.ObjectId[];
  coverArtwork?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const CollectionSchema =
  new Schema<ICollection>(
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 60,
      },

      description: {
        type: String,
        default: "",
        maxlength: 240,
      },

      artworks: [
        {
          type: Schema.Types.ObjectId,
          ref: "Artwork",
        },
      ],

      coverArtwork: {
        type: Schema.Types.ObjectId,
        ref: "Artwork",
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

CollectionSchema.index({
  user: 1,
  updatedAt: -1,
});

CollectionSchema.index(
  {
    user: 1,
    name: 1,
  },
  {
    unique: true,
  }
);

const Collection: Model<ICollection> =
  mongoose.models.Collection ||
  mongoose.model<ICollection>(
    "Collection",
    CollectionSchema
  );

export default Collection;
