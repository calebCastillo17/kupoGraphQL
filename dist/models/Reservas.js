import { Schema, model } from "mongoose";
const ReservasSchema = new Schema({
    fecha: {
        type: Date,
        required: true,
    },
    abono: {
        type: Number,
        require: true,
    },
    precio: {
        type: Number,
        require: true,
    },
    cliente: {
        type: Schema.Types.ObjectId,
        ref: 'Cliente',
        require: true,
    },
    espacioAlquilado: {
        type: String,
        require: true,
    },
    establecimiento: {
        type: Schema.Types.ObjectId,
        ref: 'Establecimiento',
        require: true,
    },
    nombreUsuario: {
        type: String,
        require: true,
        trim: true
    },
    registro: {
        type: Date,
        default: new Date()
    },
    actualizacion: {
        type: Date,
        default: new Date(),
        index: true,
    },
    estado: {
        type: String,
        require: true,
        trim: true
    }
});
ReservasSchema.index({ fecha: 1 });
// Definición del modelo de Reserva (usando model)
const ReservaModel = model('Reserva', ReservasSchema);
export default ReservaModel;
