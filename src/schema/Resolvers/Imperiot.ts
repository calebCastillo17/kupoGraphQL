import Establecimiento from "../../models/Establecimientos.js";
import Cliente from "../../models/Clientes.js";
import Admin from "../../models/Admins.js";
import Cancha from "../../models/Canchas.js";
import Reserva from "../../models/Reservas.js";
import Imperiot from "../../models/Imperiots.js";

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import NotificacionesPush from "../../services/NotificacionesExpo.js";
import { createWriteStream } from "fs";
import cron from 'node-cron';



// Programa el envío de notificaciones cada hora
cron.schedule('23 * * * *', async() => {
  // Lógica para enviar las notificaciones push aquí
  const obtenerMisReservasNot = async () => {
    const now = new Date();
    const oneHourLater = new Date(now);
    oneHourLater.setHours(now.getHours() + 2);
  
   
    const reservas:any = await Reserva.find({
        fecha: { $gte: now, $lt: oneHourLater },
        estado: { $ne: 'denegado' },
      })
      .populate('cliente', 'notificaciones_token') // Realiza la operación de populate para cargar el campo "tokenNotificacion" del cliente
      .sort({ fecha: 1 })
      .exec();
      const clientesAEniar = reservas.map(reserva => reserva.cliente.notificaciones_token);
    return clientesAEniar;
    }
    const somePushTokens = await obtenerMisReservasNot()
    console.log(somePushTokens)

    console.log('Notificaciones enviadas cada hora');
//   const somePushTokens = ['ExponentPushToken[S9WqnpOG-B2t0oobHwB4ag]']
    console.log(new Date())
    NotificacionesPush(somePushTokens)
});


dotenv.config();
const crearTokenImperiot = (imperiot, secreta, expiresIn) => {
    const {id, email, nombre} = imperiot
    return jwt.sign({id,email, nombre}, secreta, { expiresIn})
}   

const saveImagesWithStream = ({ filename, mimetype, stream }) => {
    const path = `imagenes/${filename}`;
    return new Promise((resolve, reject) =>
      stream
        .pipe(createWriteStream(path))
        .on("finish", () => resolve({ path, filename, mimetype }))
        .on("error", reject)
    );
  };
export const ImperiotResolvers = {
    
    Query: {
        obtenerClientes: async (_, {input, limit, offset}, ctx) => {
            const filter: any = {};
             if (input.nombre) {
            filter.$or = [
                { nombre: { $regex: new RegExp(`.*${input.nombre}`, 'i') } },
                { apellido: { $regex: new RegExp(`.*${input.nombre}`, 'i') } },
                { nombreUsuario: { $regex: new RegExp(`.*${input.nombre}`, 'i') } }
            ];
        }
            let aggregationPipeline = [];
            aggregationPipeline = [
                ...aggregationPipeline,
                { $match: filter },
                { $skip: offset },
                { $limit: limit },
            ];

            const clientes = await Cliente.aggregate([
                ...aggregationPipeline,
            ]);
            console.log('estos son los clientes :' , clientes)
            return clientes;
        },
        obtenerAdmins: async (_, {}, ctx) => {
            const admins =  await Admin.find()
            return admins;
        },

        
        // obtenerEstablecimientosFilter: async (_, { nombre, ubicacion, metros, limit, offset }, ctx) => {
        //     console.log('obten', nombre, ubicacion, metros, limit, offset);

        //     const filter: any = {};

        //     if (nombre) {
        //         filter.nombre = { $regex: new RegExp(`.*${nombre}`, 'i') };
        //     }

        //     let aggregationPipeline = [];

        //     if (ubicacion) {
        //         aggregationPipeline.push({
        //             $geoNear: {
        //                 near: {
        //                     type: 'Point',
        //                     coordinates: [ubicacion.latitude, ubicacion.longitude],
        //                 },
        //                 distanceField: 'distancia',
        //                 maxDistance: metros,
        //                 spherical: true,
        //             },
        //         });
        //     }

        //     aggregationPipeline = [
        //         ...aggregationPipeline,
        //         { $sort: {
        //             valoracion: -1,
        //             },},
        //         { $skip: offset },
        //         { $limit: limit },
        //     ];

        //     const establecimientos = await Establecimiento.aggregate([
        //         { $match: filter },
        //         ...aggregationPipeline,
        //     ]);

        //     establecimientos.forEach((estab) => {
        //         console.log(estab.nombre, estab.distancia);
        //     });

        //     return establecimientos;
        // },
    },
    Mutation:{ 

       crearImperiot: async (_, {input}, ctx) => {
            const {email, password} = input;
            const existeImperiot = await Imperiot.findOne({email})
            if(existeImperiot) {
                throw new Error('El imperiot ya esta registrado');
            }
            try {
                //Hashear Password

                const salt = await bcrypt.genSalt(10);
                input.password = await bcrypt.hash(password, salt)
                // registrar nuevo ususario
                const NuevoImperiot = new Imperiot(input);
                console.log(NuevoImperiot)
                NuevoImperiot.save()
                return "Imperiot creado correctamente"
            } catch (error) {
                console.log(error)
            }
        },
        autenticarImperiot: async (_, {input}, ctx) => {
            const {email, password} = input;

            //revisar si el usuario existe
            const existeImperiot = await Imperiot.findOne({email})

            if(!existeImperiot) {
                throw new Error('El Imperiot no esta registrado');
            }
            
            //revisar si el password es correcto
            const passwordCorrecto = await bcrypt.compare(password, existeImperiot.password)


            if(!passwordCorrecto) {
                throw new Error('password Incorrecto');
            }

            return {
                token: crearTokenImperiot(existeImperiot, process.env.PALABRATOKEN, '1hr')
            }
        },
        // notificarUnaHoraNtesReserva: async (_, {input}, ctx) => {
        //     const {email, password} = input;

        //     //revisar si el usuario existe
        //     const existeImperiot = await Imperiot.findOne({email})

        //     if(!existeImperiot) {
        //         throw new Error('El Imperiot no esta registrado');
        //     }
            
        //     //revisar si el password es correcto
        //     const passwordCorrecto = await bcrypt.compare(password, existeImperiot.password)


        //     if(!passwordCorrecto) {
        //         throw new Error('password Incorrecto');
        //     }

        //     return {
        //         token: crearTokenImperiot(existeImperiot, process.env.PALABRATOKEN, '1hr')
        //     }
        // },

        singleUpload: async (_, args) => {
            // const { filename, mimetype, createReadStream } = await file;
            console.log('esta imagen es la que se ha subido', args)
            // const stream = createReadStream();
            // await saveImagesWithStream({ filename, mimetype, stream });
            return "singleUpload";
        },
       
    }
}