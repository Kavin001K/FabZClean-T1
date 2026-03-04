import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || '';
// If no MONGO_URI is provided, we skip MongoDB initialization and fall back to SQLite analytics.

let isConnected = false;

export const connectToMongo = async (): Promise<boolean> => {
    if (isConnected) {
        return true;
    }

    try {
        // Only attempt connection if a valid URI is supplied
        if (!MONGO_URI) {
            console.log('⚠️ No MONGO_URI provided – skipping MongoDB connection.');
            return false;
        }
        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 5000, // Fail fast if DB isn't reachable
        });
        isConnected = true;
        console.log('🍃 MongoDB Connected Successfully');
        return true;
    } catch (error) {
        // Log a generic message to avoid leaking internal details
        console.error('❌ MongoDB Connection Error: unable to connect to the configured database.');
        console.log('✅ App will continue with SQLite analytics. All features remain available.');
        return false;
    }
};

export const disconnectMongo = async (): Promise<void> => {
    if (isConnected) {
        await mongoose.disconnect();
        isConnected = false;
        console.log('🍃 MongoDB Disconnected');
    }
};

export const isMongoConnected = (): boolean => {
    return mongoose.connection.readyState === 1;
};
