import { Schema, model } from "mongoose";
// Define el esquema para Invitacion
const InvitacionesSchema = new Schema({
    creador: {
        type: Schema.Types.ObjectId,
        ref: 'Cliente',
        required: true,
    },
    invitado: {
        type: Schema.Types.ObjectId,
        ref: 'Cliente',
        required: true,
    },
    nombreUsuarioCreador: {
        type: String,
        ref: 'Cliente',
        trim: true,
    },
    nombreUsuarioInvitado: {
        type: String,
        ref: 'Cliente',
        trim: true,
    },
    reserva: {
        type: Schema.Types.ObjectId,
        ref: 'Reserva',
        required: true,
    },
    fechaReserva: {
        type: Date,
    },
    registro: {
        type: Date,
        default: new Date(),
    },
    estado: {
        type: String,
        required: true,
        trim: true,
    },
    actualizacion: {
        type: Date,
        default: new Date(),
        index: true,
    }
});
// Define el índice para el campo de fechaReserva si es necesario
InvitacionesSchema.index({ fechaReserva: 1 });
// Define el modelo de Invitacion (usando model)
const InvitacionModel = model('Invitacion', InvitacionesSchema);
export default InvitacionModel;
