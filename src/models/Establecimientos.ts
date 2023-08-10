import { Schema, model, Document } from 'mongoose';

interface IEstablecimiento extends Document {
  nombre: string;
  descripcion: string;
  direccion: string;
  telefono: string;
  numeroCanchas?: number;
  horarioApertura: number;
  horarioCierre: number;
  servicios?: string[];
  imagen?: string;
  ubicacion: {
    type: string;
    coordinates: number[];
  };
  disponible: boolean;
  creador: Schema.Types.ObjectId;
  creado: Date;
}

const EstablecimientosSchema = new Schema<IEstablecimiento>({
  nombre: {
    type: String,
    required: true,
    trim: true,
  },
  descripcion: {
    type: String,
    required: true,
    trim: true,
  },
  direccion: {
    type: String,
    required: true,
    trim: true,
  },
  telefono: {
    type: String,
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
  creador: {
    type: Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
  },
  creado: {
    type: Date,
    default: Date.now,
  },
});

EstablecimientosSchema.index({ ubicacion: "2dsphere" });

export default model<IEstablecimiento>('Establecimiento', EstablecimientosSchema)