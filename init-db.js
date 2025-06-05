const { MongoClient } = require('mongodb');
const config = require('./config.js');

async function initializeDatabase() {
    const client = new MongoClient(config.mongodb.uri);
    
    try {
        await client.connect();
        console.log('Conectado a MongoDB');
        
        const db = client.db(config.mongodb.dbName);
        
        // Crear colección de usuarios
        await db.createCollection('users');
        await db.collection('users').createIndex({ email: 1 }, { unique: true });
        
        // Crear colección de activaciones
        await db.createCollection('activations');
        await db.collection('activations').createIndex({ userId: 1 });
        await db.collection('activations').createIndex({ startDate: 1 });
        
        // Crear colección de estadísticas
        await db.createCollection('stats');
        await db.collection('stats').insertOne({
            _id: 'ingresos',
            total: 0,
            activaciones: {
                '24h': 0,
                '30d': 0,
                'lifetime': 0
            }
        });
        
        console.log('Base de datos inicializada correctamente');
    } catch (error) {
        console.error('Error al inicializar la base de datos:', error);
    } finally {
        await client.close();
    }
}

initializeDatabase(); 