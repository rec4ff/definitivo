const { MongoClient } = require('mongodb');
const config = require('./config.js');

let client = null;
let db = null;

async function connectDB() {
    if (db) return db;
    
    try {
        client = await MongoClient.connect(config.mongodb.uri);
        db = client.db(config.mongodb.dbName);
        console.log('Conectado a MongoDB');
        return db;
    } catch (error) {
        console.error('Error al conectar a MongoDB:', error);
        throw error;
    }
}

async function closeDB() {
    if (client) {
        await client.close();
        client = null;
        db = null;
    }
}

async function getUser(email) {
    const db = await connectDB();
    return await db.collection('users').findOne({ email });
}

async function updateUser(email, update) {
    const db = await connectDB();
    return await db.collection('users').updateOne(
        { email },
        { $set: update }
    );
}

async function createActivation(userId, type, startDate, endDate) {
    const db = await connectDB();
    return await db.collection('activations').insertOne({
        userId,
        type,
        startDate,
        endDate,
        activatedBy: 'admin',
        paymentInfo: {
            amount: type === 'lifetime' ? 12000 : 
                   type === '30d' ? 6500 : 3000,
            method: 'transfer',
            date: new Date()
        }
    });
}

async function updateStats(amount, type) {
    const db = await connectDB();
    return await db.collection('stats').updateOne(
        { _id: 'ingresos' },
        { 
            $inc: { 
                total: amount,
                [`activaciones.${type}`]: 1
            }
        }
    );
}

async function getStats() {
    const db = await connectDB();
    return await db.collection('stats').findOne({ _id: 'ingresos' });
}

module.exports = {
    connectDB,
    closeDB,
    getUser,
    updateUser,
    createActivation,
    updateStats,
    getStats
}; 