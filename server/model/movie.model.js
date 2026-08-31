import { model, Schema } from "mongoose";

const movieSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minLength: [10, "Min 10 characters are required"],
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    genre: {
      type: [String],
      enum: ["Action", "Comedy", "Drama", "Horror", "Romance", "Sci-Fi","Adventure", "Animation", "Crime", "Documentary", "Fantasy", "Mystery", "Thriller", "Western", "Family", "Musical", "War", "Biography", "History", "Sport"],
      required: true,
    },
    language: {
      type: [String],
      enum: ["English", "Hindi", "Spanish", "French", "German", "Chinese", "Japanese", "Korean", "Italian", "Portuguese", "Russian", "Arabic", "Turkish", "Dutch", "Swedish", "Norwegian", "Danish", "Finnish", "Polish", "Czech", "Greek","Telugu", "Tamil", "Bengali", "Punjabi", "Marathi", "Gujarati", "Urdu", "Malayalam", "Kannada", "Sinhala", "Thai", "Vietnamese", "Indonesian"],
      required: true,
    },
    releaseDate: {
      type: Date,
      required: true,
    },
    poster: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Movie = model("movie", movieSchema);

export default Movie;