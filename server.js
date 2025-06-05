const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// Configuración de MongoDB
const MONGODB_URI = 'mongodb+srv://tomasbertello2006:DijUOXm0jmF68Qa3@cluster2.rhbfdjk.mongodb.net/miarg?retryWrites=true&w=majority&appName=Cluster2';
const DB_NAME = 'miarg';

// Middleware
app.use(cors());
app.use(express.json());

// Configurar headers de seguridad
app.use((req, res, next) => {
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https://miargpanel.vercel.app"
    );
    next();
});

app.use(express.static('public'));

// Conexión a MongoDB
let db;
async function connectDB() {
    try {
        const client = await MongoClient.connect(MONGODB_URI);
        db = client.db(DB_NAME);
        console.log('Conectado a MongoDB');
        
        // Inicializar stats si no existe
        const stats = await db.collection('stats').findOne({ _id: 'ingresos' });
        if (!stats) {
            await db.collection('stats').insertOne({
                _id: 'ingresos',
                total: 0,
                activaciones: {
                    '24h': 0,
                    '30d': 0,
                    'lifetime': 0
                }
            });
            console.log('Estadísticas inicializadas');
        }
    } catch (error) {
        console.error('Error al conectar a MongoDB:', error);
    }
}
connectDB();

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('Servidor funcionando correctamente');
});

// Rutas
app.get('/api/stats', async (req, res) => {
    try {
        if (!db) {
            console.error('No hay conexión a la base de datos');
            return res.status(500).json({ error: 'Error de conexión a la base de datos' });
        }

        const stats = await db.collection('stats').findOne({ _id: 'ingresos' });
        console.log('Estadísticas obtenidas:', stats);
        
        if (!stats) {
            // Si no hay estadísticas, crear un documento inicial
            const initialStats = {
                _id: 'ingresos',
                total: 0,
                activaciones: {
                    '24h': 0,
                    '30d': 0,
                    'lifetime': 0
                }
            };
            await db.collection('stats').insertOne(initialStats);
            return res.json(initialStats);
        }
        
        res.json(stats);
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

app.post('/api/activate', async (req, res) => {
    try {
        if (!db) {
            console.error('No hay conexión a la base de datos');
            return res.status(500).json({ error: 'Error de conexión a la base de datos' });
        }

        const { email, type } = req.body;
        console.log('Activando usuario:', { email, type });
        
        const user = await db.collection('users').findOne({ email });
        if (!user) {
            console.log('Usuario no encontrado:', email);
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

        console.log('Usuario activado correctamente:', email);
        res.json({ success: true, message: 'Usuario activado correctamente' });
    } catch (error) {
        console.error('Error al activar usuario:', error);
        res.status(500).json({ error: 'Error al activar usuario' });
    }
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
}); 