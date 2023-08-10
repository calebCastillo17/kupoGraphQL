import { Schema, model } from "mongoose";

const CanchaSchema = new Schema({ 
    nombre: {
        type:String,
        trim: true,

    },
    nombreOpcional:{
        type:String,
        default: null,
        trim: true,

    },
    
    precio:{
        type:Number,
        require:true,
        trim: true,
        default: 0

    },
    imagen:{
        type:String,
        require:true,
        trim: true,
        default: null

    },
    ocupado:{
        type:[Number],
        require:true
    },
    inhabilitado:{
        type:[Number],
        require:true
    },
    disponible:{
        type: Boolean,
        default: true,
        require:true,
    },
    establecimiento:{
        type: Schema.Types.ObjectId,
        ref: 'Establecimiento',
        require: true,
    },
    creador:{
        type: Schema.Types.ObjectId,
        ref: 'Admin',
        require: true,
    }
});
export default model('Cancha', CanchaSchema)