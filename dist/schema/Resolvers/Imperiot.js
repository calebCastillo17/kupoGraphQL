import Cliente from "../../models/Clientes.js";
import Admin from "../../models/Admins.js";
import Imperiot from "../../models/Imperiots.js";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();
const crearTokenImperiot = (imperiot, secreta, expiresIn) => {
    const { id, email, nombre } = imperiot;
    return jwt.sign({ id, email, nombre }, secreta, { expiresIn });
};
export const ImperiotResolvers = {
    Query: {
        obtenerClientes: async (_, {}, ctx) => {
            const clientes = await Cliente.find();
            return clientes;
        },
        obtenerAdmins: async (_, {}, ctx) => {
            const admins = await Admin.find();
            return admins;
        },
        // obtenerEstablecimientos:  async (_, {}, ctx) => {
        //     const establecimientos =  await Establecimiento.find()
        //     return establecimientos;
        // }
    },
    Mutation: {
        crearImperiot: async (_, { input }, ctx) => {
            const { email, password } = input;
            const existeImperiot = await Imperiot.findOne({ email });
            if (existeImperiot) {
                throw new Error('El imperiot ya esta registrado');
            }
            try {
                //Hashear Password
                const salt = await bcrypt.genSalt(10);
                input.password = await bcrypt.hash(password, salt);
                // registrar nuevo ususario
                const NuevoImperiot = new Imperiot(input);
                console.log(NuevoImperiot);
                NuevoImperiot.save();
                return "Imperiot creado correctamente";
            }
            catch (error) {
                console.log(error);
            }
        },
        autenticarImperiot: async (_, { input }, ctx) => {
            const { email, password } = input;
            //revisar si el usuario existe
            const existeImperiot = await Imperiot.findOne({ email });
            if (!existeImperiot) {
                throw new Error('El Imperiot no esta registrado');
            }
            //revisar si el password es correcto
            const passwordCorrecto = await bcrypt.compare(password, existeImperiot.password);
            if (!passwordCorrecto) {
                throw new Error('password Incorrecto');
            }
            return {
                token: crearTokenImperiot(existeImperiot, process.env.PALABRATOKEN, '1hr')
            };
        }
    }
};
