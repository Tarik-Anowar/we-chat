'use server'
import mongoose from 'mongoose';

const mongoUri = process.env.DATABASE_URL || "mongodb://mongo:27017/app_data";

if (!mongoUri) {
    throw new Error('Please define the DATABASE_URL environment variable inside .env.local');
}

type ConnectionObject = {
    isConnected?: number;
};

const connection: ConnectionObject = {};

const connectToDatabase = async () => {
    if (connection.isConnected) {
        return;
    }

    try {
        const db = await mongoose.connect(mongoUri);
        connection.isConnected = db.connections[0]?.readyState;

        if (connection.isConnected === 1) { 
            console.log('Connected to MongoDB');
        } else {
            console.error('MongoDB connection state is not connected');
        }
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        throw new Error('Failed to connect to MongoDB');
    }
};

export default connectToDatabase;
