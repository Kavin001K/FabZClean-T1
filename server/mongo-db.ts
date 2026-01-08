import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fabzclean_local';

let isConnected = false;

export const connectToMongo = async (): Promise<boolean> => {
    if (isConnected) {
        return true;
    }

    try {
        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 5000, // Fail fast if local DB isn't running
        });
        isConnected = true;
        console.log('🍃 MongoDB Connected Successfully (Local)');
        return true;
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        console.warn('⚠️ App will continue with SQL only. Analytics/Logs may be disabled.');
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
