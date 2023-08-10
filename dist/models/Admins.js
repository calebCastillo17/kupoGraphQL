import { Schema, model } from "mongoose";
const AdminsSchema = new Schema({
    nombre: {
        type: String,
        require: true,
        trim: true,
    },
    apellido: {
        type: String,
        require: true,
        trim: true,
    },
    foto: {
        type: String,
        trim: true,
        required: false,
    },
    nombreUsuario: {
        type: String,
        require: true,
        trim: true,
        default: null
    },
    sexo: {
        type: String,
        require: true,
        trim: true,
        default: null
    },
    telefono: {
        type: String,
        require: true,
        trim: true,
        unique: true,
    },
    email: {
        type: String,
        require: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        require: true,
        trim: true,
    },
    code_verificacion: {
        type: Number,
        trim: true,
    },
    fecha_nacimiento: {
        type: Date,
        required: true,
    },
    lugar: {
        pais: { type: String },
        nivel_1: { type: String },
        nivel_2: { type: String },
        nivel_3: { type: String },
    },
    estado: {
        type: String,
        require: true,
        trim: true,
        default: 'no_verificado'
    },
    notificaciones_token: {
        type: String,
        trim: true,
    },
    registro: {
        type: Date,
        default: Date.now()
    }
});
export default model('Admin', AdminsSchema);
