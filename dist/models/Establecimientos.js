import { Schema, model } from 'mongoose';
const EstablecimientosSchema = new Schema({
    nombre: {
        type: String,
        required: true,
        trim: true,
    },
    direccion: {
        type: String,
        required: true,
        trim: true,
    },
    telefonos: {
        type: [String],
        required: true,
        trim: false,
    },
    numeroCanchas: {
        type: Number,
    },
    horarioApertura: {
        type: Number,
        required: true,
        trim: true,
    },
    horarioCierre: {
        type: Number,
        required: true,
        trim: true,
    },
    servicios: {
        type: [String],
        trim: true,
        required: false,
    },
    imagen: {
        type: String,
        trim: true,
        required: false,
    },
    ubicacion: {
        type: {
            type: String,
            enum: ["Point"],
            required: true,
            default: 'Point',
        },
        coordinates: { type: [Number], default: [0, 0] },
    },
    disponible: {
        type: Boolean,
        default: true,
        required: true,
    },
    validado: {
        type: Boolean,
        default: false,
        required: true,
    },
    reservable: {
        type: Boolean,
        default: true,
        required: true,
    },
    notificaciones_token: {
        type: String,
        trim: true,
    },
    valoracion: {
        type: Number,
        required: true,
        default: 0.1,
    },
    premium: {
        type: Boolean,
        default: false,
    },
    creador: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: 'creadorTipo', // Referencia dinámica al tipo de creador
    },
    creadorTipo: {
        type: String,
        default: 'Admin',
        required: true,
        enum: ['Admin', 'Imperiot'] // Enumera los tipos de usuarios permitidos
    },
    creado: {
        type: Date,
        default: Date.now,
    },
});
EstablecimientosSchema.index({ ubicacion: "2dsphere" });
EstablecimientosSchema.index({ valoracion: -1 });
export default model('Establecimiento', EstablecimientosSchema);
