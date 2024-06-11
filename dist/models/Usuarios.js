import { model, Schema } from "mongoose";
// Esquema de Usuario
const UsuarioSchema = new Schema({
    nombre: {
        type: String,
        required: true,
        trim: true,
    },
    apellido: {
        type: String,
        required: true,
        trim: true,
    },
    nombreUsuario: {
        type: String,
        required: true,
        trim: true,
    },
    foto: {
        type: String,
        trim: true,
        required: false,
    },
    sexo: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    telefono: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    code_verificacion: {
        type: Number,
        trim: true,
    },
    estado: {
        type: String,
        required: true,
        trim: true,
        default: 'no_verificado',
    },
    notificaciones_token: {
        type: String,
        trim: true,
    },
    password: {
        type: String,
        required: true,
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
    registro: {
        type: Date,
        default: Date.now,
    },
    esCliente: {
        type: Boolean,
        required: true,
    },
    esAdmin: {
        type: Boolean,
        required: true,
    },
    pelotero: {
        edad: { type: String, required: true },
        posicion: { type: String, required: true },
        club: { type: String, required: true },
        numero_camiseta: { type: String, required: true },
        tallas: {
            camiseta: { type: String, required: true },
            short: { type: String, required: true },
            calzado: { type: String, required: true },
        },
        lesiones: { type: [String], required: true },
        pierna_habil: { type: String, required: true },
        peso: { type: String, required: true },
        estatura: { type: String, required: true },
    },
});
const UsuarioModel = model('Usuario', UsuarioSchema);
export default UsuarioModel;
