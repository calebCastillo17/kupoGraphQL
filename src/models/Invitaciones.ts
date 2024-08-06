import { Schema, model, Document } from "mongoose";

// Define la interfaz para el modelo de Invitacion
interface Invitacion {
    creador: Schema.Types.ObjectId; // ID del cliente que hace la invitación
    invitado: Schema.Types.ObjectId; // ID del cliente que hace la invitación
    nombreUsuarioCreador: string;   // Nombre de usuario del creador (vinculado a clientes)
    nombreUsuarioInvitado: string;  // Nombre de usuario del invitado (vinculado a clientes)
    reserva: Schema.Types.ObjectId; // ID de la reserva asociada
    fechaReserva: Date;            // Fecha de la reserva
    registro: Date;                // Fecha de registro de la invitación
    estado: string;                // Estado de la invitación
    actualizacion: Date;           // Fecha de última actualización
}

// Define el documento de Invitacion (usando Document)
interface InvitacionDocument extends Invitacion, Document {}

// Define el esquema para Invitacion
const InvitacionesSchema = new Schema<Invitacion>({
    creador: {
        type: Schema.Types.ObjectId,
        ref: 'Cliente', // Referencia al modelo Cliente
        required: true,
    },
    invitado: {
        type: Schema.Types.ObjectId,
        ref: 'Cliente', // Referencia al modelo Cliente
        required: true,
    },
    nombreUsuarioCreador: {
        type: String,
        ref: 'Cliente', // Referencia al modelo Cliente
        trim: true,
    },
    nombreUsuarioInvitado: {
        type: String,
        ref: 'Cliente', // Referencia al modelo Cliente
        trim: true,
    },
    reserva: {
        type: Schema.Types.ObjectId,
        ref: 'Reserva', // Referencia al modelo Reserva
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
InvitacionesSchema.index({ registro: 1 });

// Define el modelo de Invitacion (usando model)
const InvitacionModel = model<InvitacionDocument>('Invitacion', InvitacionesSchema);

export default InvitacionModel;
