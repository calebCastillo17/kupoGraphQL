import { Schema, model } from "mongoose";
const ImperiotsSchema = new Schema({
    nombre: {
        type: String,
        require: true,
        trim: true,
    },
    apellido: {
        type: String,
        require: true,
        trim: true,
    },
    email: {
        type: String,
        require: true,
        trim: true,
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        require: true,
        trim: true,
    },
    registro: {
        type: Date,
        default: Date.now()
    }
});
export default model('Imperiot', ImperiotsSchema);
