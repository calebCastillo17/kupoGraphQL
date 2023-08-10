import { model, Schema } from "mongoose";

const ClientesSchema = new Schema({
    nombre:{
         type: String,
         require: true,
         trim: true,
    },
    apellido:{
        type: String,
        require: true,
        trim: true,
   },
    nombreUsuario:{
        type: String,
        require: true,
        trim: true,
    },
    sexo:{
        type: String,
        require: true,
        trim: true,
    },
    email:{
        type: String,
        require: true,
        trim: true,
        unique: true,
        lowercase:true,
    },
    telefono:{
        type: String,
        require: true,
        trim: true,
    },

    password: {
        type: String,
        require: true,
        trim: true,
        
    },
    registro:{
        type: Date,
        default: Date.now()
    }
});
export default model('Cliente',ClientesSchema)