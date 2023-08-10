import {Schema, model} from "mongoose";


const AdminsSchema =  new Schema({
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
        default: null
    },
    sexo:{
        type: String,
        require: true,
        trim: true,
        default: null
    },
    email:{
        type: String,
        require: true,
        trim: true,
        unique: true,
        lowercase:true,
    },
    password: {
        type: String,
        require: true,
        trim: true,
        
    },
    estado: {
        type: String,
        require: true,
        trim: true,
        default: 'noVerificado'
        
    },
    registro:{
        type: Date,
        default: Date.now()
    }
});
export default model('Admin',AdminsSchema)