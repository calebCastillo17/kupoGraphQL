import { model, Schema, Document } from "mongoose";

// Interfaces para subdocumentos
interface Pelotero {
  edad: string;
  posicion: string;
  club: string;
  numero_camiseta: string;
  tallas: Tallas;
  lesiones: string[];
  pierna_habil: string;
  peso: string;
  estatura: string;
}

interface Tallas {
  camiseta: string;
  short: string;
  calzado: string;
}

interface Lugar {
  pais: string;
  nivel_1: string;
  nivel_2: string;
  nivel_3: string;
}

// Interface para el documento de Usuario
interface Usuario {
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
  notificaciones_token?: string; // El campo notificaciones_token es opcional
  password: string;
  registro: Date;
  fecha_nacimiento: Date;
  esCliente: boolean;
  esAdmin: boolean;
  pelotero: Pelotero;
}

// Definición del documento de Usuario (usando Document)
interface UsuarioDocument extends Usuario, Document {}

// Esquema de Usuario
const UsuarioSchema = new Schema<Usuario>({
  nombre: {
    type: String,
    required: true,
    trim: true,
  },
  apellido: {
    type: String,
    required: true,
    trim: true,
  },
  nombreUsuario: {
    type: String,
    required: true,
    trim: true,
  },
  foto: {
    type: String,
    trim: true,
    required: false,
  },
  sexo: {
    type: String,
    required: false,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  telefono: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  code_verificacion: {
    type: Number,
    trim: true,
  },
  estado: {
    type: String,
    required: true,
    trim: true,
    default: 'no_verificado',
  },
  notificaciones_token: {
    type: String,
    trim: true,
  },
  password: {
    type: String,
    required: true,
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
  registro: {
    type: Date,
    default: Date.now,
  },
  esCliente: {
    type: Boolean,
    required: true,
    default:true
  },
  esAdmin: {
    type: Boolean,
    required: true,
    default:false
  },
  pelotero: {
    edad: { type: String, required: false },
    posicion: { type: String, required: false },
    club: { type: String, required: false },
    numero_camiseta: { type: String, required: false },
    tallas: {
      camiseta: { type: String, required: false },
      short: { type: String, required: false },
      calzado: { type: String, required: false },
    },
    lesiones: { type: [String], required: false },
    pierna_habil: { type: String, required: false },
    peso: { type: String, required: false },
    estatura: { type: String, required: false },
  },
});

const UsuarioModel = model<UsuarioDocument>('Usuario', UsuarioSchema);

export default UsuarioModel;
