import { model, Schema } from "mongoose";
const ClientesSchema = new Schema({
    nombre: {
        type: String,
        require: true,
        trim: true,
    },
    apellido: {
        type: String,
        require: false,
        trim: true,
    },
    nombreUsuario: {
        type: String,
        require: true,
        trim: true,
    },
    foto: {
        type: String,
        trim: true,
        required: false,
    },
    sexo: {
        type: String,
        require: true,
        trim: true,
        default: 'Masculino',
    },
    email: {
        type: String,
        require: true,
        trim: true,
        lowercase: true,
    },
    telefono: {
        type: String,
        require: true,
        trim: true,
        unique: false,
    },
    code_verificacion: {
        type: Number,
        trim: true,
    },
    estado: {
        type: String,
        require: true,
        trim: true,
        default: 'no_verificado'
    },
    pelotero: {
        edad: { type: String },
        posicion: { type: String },
        club: { type: String },
        apodo: { type: String },
        numero_camiseta: { type: String },
        tallas: {
            camiseta: { type: String },
            short: { type: String },
            calzado: { type: String }
        },
        lesiones: { type: [String] },
        pierna_habil: { type: String },
        peso: { type: String },
        estatura: { type: String },
    },
    notificaciones_token: {
        type: String,
        trim: true,
    },
    password: {
        type: String,
        require: true,
        trim: true,
    },
    fecha_nacimiento: {
        type: Date,
        required: false,
    },
    lugar: {
        pais: { type: String },
        nivel_1: { type: String },
        nivel_2: { type: String },
        nivel_3: { type: String },
    },
    registro: {
        type: Date,
        default: Date.now()
    }
});
const ClienteModel = model('Cliente', ClientesSchema);
export default ClienteModel;
