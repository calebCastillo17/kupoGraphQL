import mongoose from "mongoose"
import dotenv from 'dotenv';


dotenv.config();
const uridot = process.env.DB_MONGO;
const uri = `mongodb+srv://Caleb17:Domiotica17@cluster0.h05bhwy.mongodb.net/kupo12`

export const conectarDB  =  async () => {

    mongoose.set('strictQuery', false)
    try {
        await mongoose.connect(uridot);
        console.log('base de datos conectada')
    } catch (error) {
        console.log('hubo un error con la conexion de la base dedatos')
        console.log(error)
        process.exit(1) // detener la app
    }
}
