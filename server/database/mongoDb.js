import mongoose from "mongoose";

const connectToDB = async () => {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
        throw new Error(
            "MongoDB URI is missing. Configure MONGODB_URI in the deployment environment."
        );
    }

    try {
        const { connection } = await mongoose.connect(mongoUri);
        console.log(`Connected to database: ${connection.host}`);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const safeMessage = message.replace(
            /(mongodb(?:\+srv)?:\/\/)[^@/\s]+@/gi,
            "$1[REDACTED]@"
        );
        console.error("MongoDB connection failed:", safeMessage);
        throw new Error(`MongoDB connection failed: ${safeMessage}`, { cause: error });
    }
};

export default connectToDB;
