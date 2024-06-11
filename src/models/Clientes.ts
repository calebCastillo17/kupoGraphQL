import { model, Schema, Document } from "mongoose";



// Definición del modelo de Cliente
interface Cliente {
    nombre: string;
    apellido: string;
    nombreUsuario: string;
    foto: string;
    sexo: string;
    email: string;
    telefono: string;
    lugar: Lugar;
    code_verificacion: number;
    estado: string;
    pelotero: Pelotero;
    notificaciones_token?: string; // El campo notificaciones_token es opcional
    password: string;
    registro: Date;
    fecha_nacimiento: Date;
  }
  interface Pelotero {
    edad: string; 
    posicion: string;  
    apodo: string;  
    club: string;  
    numero_camiseta: string;
    tallas: Tallas
    lesiones: [string]; 
    pierna_habil:string; 
    peso: string; 
    estatura:string; 
}

interface Tallas {
    camiseta:string ;
    short: string ;
    calzado:string ;
}
  interface Lugar {
    pais: string;
    nivel_1: string;
    nivel_2: string;
    nivel_3: string;
  }
  // Definición del documento de Cliente (usando Document)
  interface ClienteDocument extends Cliente, Document {}

  
const ClientesSchema = new Schema<Cliente>({
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
    foto: {
        type: String,
        trim: true,
        required: false,
      },
    sexo:{
        type: String,
        require: true,
        trim: true,
        default:'Masculino',
    },
    email:{
        type: String,
        require: true,
        trim: true,
        lowercase:true,
    },
    telefono:{
        type: String,
        require: true,
        trim: true,
        unique: true,
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
    pelotero:{
        edad: {type:String  },
        posicion: {type:String  },
        club: {type:String  },
        apodo: {type:String  },
        numero_camiseta: {type:String},
        tallas: {
            camiseta:{type:String },
            short: {type:String },
            calzado: {type:String }
        },
        lesiones:{type:[String] },
        pierna_habil:{type:String  },
        peso:{  type:String },
        estatura:{type:String },
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
        required: true,
      },
    lugar: {
            pais: { type: String },
            nivel_1: { type: String },
            nivel_2: { type: String },
            nivel_3: { type: String },
          
    },
    registro:{
        type: Date,
        default: Date.now()
    }
});
const ClienteModel = model<ClienteDocument>('Cliente', ClientesSchema);

export default ClienteModel;