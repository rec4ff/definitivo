// Configuración de MongoDB
const config = {
    mongodb: {
        uri: 'mongodb+srv://tomasbertello2006:DijUOXm0jmF68Qa3@cluster2.rhbfdjk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster2', // Reemplazar con tu URI de MongoDB Atlas
        dbName: 'miarg',
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }
    }
};

export default config; 