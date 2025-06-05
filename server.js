const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// Configuración de MongoDB
const MONGODB_URI = 'mongodb+srv://tomasbertello2006:DijUOXm0jmF68Qa3@cluster2.rhbfdjk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster2';
const DB_NAME = 'miarg';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Conexión a MongoDB
let db;
async function connectDB() {
    try {
        const client = await MongoClient.connect(MONGODB_URI);
        db = client.db(DB_NAME);
        console.log('Conectado a MongoDB');
    } catch (error) {
        console.error('Error al conectar a MongoDB:', error);
    }
}
connectDB();

// Rutas
app.get('/api/stats', async (req, res) => {
    try {
        const stats = await db.collection('stats').findOne({ _id: 'ingresos' });
        res.json(stats || { total: 0, activaciones: { '24h': 0, '30d': 0, 'lifetime': 0 } });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

app.post('/api/activate', async (req, res) => {
    try {
        const { email, type } = req.body;
        
        const user = await db.collection('users').findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const startDate = new Date();
        let endDate = null;
        
        if (type === '24h') {
            endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
        } else if (type === '30d') {
            endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        }

        // Actualizar usuario
        await db.collection('users').updateOne(
            { email },
            {
                $set: {
                    'subscription.type': type,
                    'subscription.startDate': startDate,
                    'subscription.endDate': endDate,
                    'subscription.isActive': true
                }
            }
        );

        // Registrar activación
        await db.collection('activations').insertOne({
            userId: user._id,
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

        // Actualizar estadísticas
        const amount = type === 'lifetime' ? 12000 : 
                      type === '30d' ? 6500 : 3000;
                      
        await db.collection('stats').updateOne(
            { _id: 'ingresos' },
            { 
                $inc: { 
                    total: amount,
                    [`activaciones.${type}`]: 1
                }
            }
        );

        res.json({ success: true, message: 'Usuario activado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al activar usuario' });
    }
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
}); 