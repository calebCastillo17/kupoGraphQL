import { model, Schema } from "mongoose";
const ClientesSchema = new Schema({
    nombreUsuario: {
        type: String,
        require: true,
        trim: true,
    },
    edad: {},
    posicion: {},
    club: {},
    numero_camiseta: {},
    tallas: {
        camiseta: {},
        short: {},
        calzado: {}
    },
    lesiones: {},
    pierna_habil: {},
    peso: {},
    estatura: {},
    cliente: {
        type: Schema.Types.ObjectId,
        ref: 'Cliente',
        require: true,
    },
    registro: {
        type: Date,
        default: Date.now()
    }
});
const ClienteModel = model('Cliente', ClientesSchema);
export default ClienteModel;
