import Establecimiento from "../../models/Establecimientos.js";
import Cliente from "../../models/Clientes.js";
import Cancha from "../../models/Canchas.js";
import Admin from "../../models/Admins.js";
import Reserva from "../../models/Reservas.js";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { GraphQLError } from "graphql";
import mailer from "../../config/mailer.js";
import NotificacionesPush from "../../services/NotificacionesExpo.js";
import SmsTwilioSend from "../../services/SmsTwilio.js";
import { PubSub } from "graphql-subscriptions";
import enviarNotificacion from "../../services/EnviarNotificacionExpo.js";
const pubsub = new PubSub()


const horaActual = new Date()
console.log(horaActual.getHours())
console.log(Date.now())


export const AdminResolvers = {

    Query: {

        obtenerMiEstablecimiento: async (_,{}, ctx) => {
            console.log('esta obteniendo establecimiento')
            if(!ctx.usuario){
                throw new GraphQLError('no Autenticado 2', {
                    extensions: { code: 'UNAUTHENTICATED'},
                });
            }

                const establecimiento =  await Establecimiento.findOne({creador: ctx.usuario.id})
                if(!establecimiento) {
                    throw new Error('No tienes establecimiento');
                }
                return establecimiento;
        },


        obtenerMisCanchasPorEstablecimientoFuera: async (_, {establecimientoId}, ctx) => {

            // if(!ctx.usuario){
            //     throw new GraphQLError('Cancha No autenticada', {
            //         extensions: { code: 'UNAUTHENTICATED'},
            //     });
            // }
            console.log('establecimiento  id---------',establecimientoId)

            const canchas = await Cancha.find({ establecimiento: establecimientoId });
            console.log(canchas);
            return canchas;
        },


        obtenerMisReservas: async (_, {establecimientoId, cancha, fechaMin, fechaMax }, ctx) => {
            console.log('mis reservas fechas', fechaMin, fechaMax);
            const now = new Date();
            if (!fechaMin) {
                fechaMin = now;
            }
            const filtroFecha = fechaMax ? { $gte: fechaMin, $lte: fechaMax } : { $gte: fechaMin };
            
            // Construir el filtro dinámicamente
            const filtro: any = {
                establecimiento: establecimientoId,
                fecha: filtroFecha,
                estado: { $ne: 'denegado' } // Filtra las reservas donde el estado no sea 'denegado'
            };
            
            if (cancha) {
                filtro.espacioAlquilado = cancha;
            }

            const reservas = await Reserva.find(filtro).sort({ fecha: 1 }).exec();
            console.log('estas son mis reservas ', reservas);
            return reservas;
        },

        obtenerRegistroReservas: async (_, {establecimientoId, cancha, fechaMin, fechaMax , estados}, ctx) => {
            console.log('mis reservas fechas', fechaMin, fechaMax);
            const now = new Date();
            if (!fechaMin) {
                fechaMin = now;
            }
            const filtroFecha = fechaMax ? { $gte: fechaMin, $lte: fechaMax } : { $gte: fechaMin };
            
            // Construir el filtro dinámicamente
            const filtro: any = {
                establecimiento: establecimientoId,
                fecha: filtroFecha,
                estado: estados[0] // Filtra las reservas donde el estado no sea 'denegado'
            };
            
            if (cancha) {
                filtro.espacioAlquilado = cancha;
            }

            const reservas = await Reserva.find(filtro).sort({ fecha: 1 }).exec();
            console.log('estas son mis reservas registros', reservas);
            return reservas;
        },
        
        obtenerMisNuevasReservas: async (_, {establecimientoId}, ctx) => {
            console.log('mis reservas id', establecimientoId)
            const now = new Date();
           

            // const reservas =  await Reserva.find({establecimiento:establecimientoId, fecha: { $gte: now }, estado: { $ne: 'denegado' }}).sort({ fecha: 1 }).exec();
            const reservas =  await Reserva.find({establecimiento:establecimientoId, estado: 'solicitud', fecha: { $gte: now }}).sort({ fecha: 1 }).exec();
            console.log('estas son mis reservas ' ,reservas)
            return reservas;
        },


        obtenerMiHistorialReservas: async (_, { establecimientoId, estado, fechaMax, fechaMin, limite, page , nombreUsuario}, ctx) => {
            console.log('mis reservas id', estado, fechaMax, fechaMin, limite, page , nombreUsuario);
            const skip = (page - 1) * limite;
            let filtroEstado = {};
            let filtroFecha = {};
            let filtroNombreUsuario = {};
        
            // Verifica si se especifica un estado
            if (estado ) {
                filtroEstado = { estado };
            }
            // const filtroFecha = fechaMax ? { $gte: fechaMin, $lte: fechaMax } : { $gte: fechaMin };
            try {
                if (fechaMax && fechaMin) {
                    filtroFecha ={ actualizacion: { $gte: fechaMin, $lte: fechaMax }}
                }
                if (nombreUsuario) {
                    filtroNombreUsuario ={nombreUsuario: new RegExp(`^${nombreUsuario}$`, 'i')}
                }
                // const filtroFecha = fechaMax && fechaMin? { $gte: fechaMin, $lte: fechaMax } : null;
            
                const reservas = await Reserva.find({ establecimiento: establecimientoId, ...filtroEstado, ...filtroFecha, ...filtroNombreUsuario })
                    .sort({ actualizacion: -1 }) // Ordenar por el campo de actualizacion de manera descendente (de la más nueva a la más antigua)
                    .limit(limite)
                    .skip(skip)
                    .exec();
            
                return reservas;
            } catch (error) {
                console.log(error)
            }
            // Verifica si se especifica una fecha

        },

    },
    Mutation:{
        nuevoEstablecimiento: async (_,{input, ubicacion}, ctx) => {
            if (!ctx.usuario) {
                throw new GraphQLError('Admin No autenticado', {
                    extensions: { code: 'UNAUTHENTICATED'},
                }); // Error de autenticación con código 401
            }
            try {
                const establecimiento = new Establecimiento (input)
            // Asociar al creador
                establecimiento.creador = ctx.usuario.id

                if(ubicacion){
                    establecimiento.ubicacion = {
                        type: "Point",
                        coordinates: [ubicacion.latitude, ubicacion.longitude]
                    }
                }
                const resultado = await establecimiento.save();
                ////////////CREAR CANCHAS DEACUERDO AL NUMER /////////////
            console.log('nuevo establecimieno', input)

                if (input.numeroCanchas) {
                    for (let i = 1; i <= input.numeroCanchas; i++) {
                        const nuevaCancha = new Cancha({
                            nombre: `Cancha ${i}`,
                            establecimiento: resultado._id, // ID del nuevo establecimiento
                            creador: ctx.usuario.id
                        });
                        console.log('nueva cancha',nuevaCancha.nombre)

                        await nuevaCancha.save();
                    }
                }
                return resultado
            } catch (error) {
                console.log(error)
            }
        },

        actualizarEstablecimiento: async (_,{id,  input, disponible, ubicacion}, ctx) => {
            if(!ctx.usuario){
                throw new GraphQLError('Admin No autenticado', {
                    extensions: { code: 'UNAUTHENTICATED'},
                });
            }
            let establecimiento = await Establecimiento.findById(id);
            if (!establecimiento){
                throw new Error('establecimiento no encontrada');
            }
            if(ubicacion){
                input.ubicacion = {
                    type: "Point",
                    coordinates: [ubicacion.latitude, ubicacion.longitude]
                }
            }
            input.disponible = disponible
            establecimiento = await Establecimiento.findOneAndUpdate({_id:id}, input, {new:true})
            return establecimiento
        },

        eliminarEstablecimiento: async (_, { id }, ctx) => {
            if (!ctx.usuario) {
              throw new GraphQLError('Admin No autenticado', {
                extensions: { code: 'UNAUTHENTICATED' },
              });
            }
            try {
              // Verificar si el usuario tiene permiso para eliminar el establecimiento
              const establecimiento = await Establecimiento.findById(id);
              if (!establecimiento) {
                throw new Error('Establecimiento no encontrado');
              }
              if (establecimiento.creador.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales');
              }
      
              // Eliminar todas las canchas asociadas al establecimiento
              await Cancha.deleteMany({ establecimiento: id });
      
              // Eliminar el establecimiento
              await Establecimiento.findByIdAndDelete(id);
      
              return "Establecimiento eliminado correctamente";
            } catch (error) {
              console.error(error);
              throw new Error('Error al eliminar el establecimiento');
            }
          },


      actualizarTokenNotificacionesEstablecimiento: async (_,{token, establecimientoId}, ctx) => {
        let establecimiento = await Establecimiento.findById(establecimientoId);

        console.log('ESTABLECIMIENTO' ,establecimiento)

        if (!establecimiento){
            throw new Error('usuario no encontrado');
        }
        // Si la persona que edita es o no!!
        establecimiento = await Establecimiento.findOneAndUpdate({_id:establecimientoId},{notificaciones_token:token}, {new:true})
        return establecimiento
    },

    nuevaCancha: async (_, { establecimientoId, input }, ctx) => {
        console.log('el id del establecimientoooooooooooo',establecimientoId)   // Actualizar el número de canchas en el establecimiento

        if (!ctx.usuario) {
            throw new GraphQLError('Cancha no autenticada', {
                extensions: { code: 'UNAUTHENTICATED' },
            });
        }
        try {
            const numeroCanchas = await Cancha.countDocuments({ establecimiento: establecimientoId });
            input.nombre = `Cancha ${numeroCanchas + 1}`;
            input.establecimiento = establecimientoId
            input.creador =  ctx.usuario.id
            const nuevaCancha = new Cancha(input);
            const resultado = await nuevaCancha.save();
    
            console.log('el id del establecimiento',establecimientoId)   // Actualizar el número de canchas en el establecimiento
            await Establecimiento.findByIdAndUpdate(establecimientoId, { numeroCanchas: numeroCanchas +  1});
    
            return resultado;
        } catch (error) {
            console.log(error);
            throw new GraphQLError('Error al crear la cancha', {
                extensions: { code: 'INTERNAL_SERVER_ERROR' },
            });
        }
    },
    

    actualizarCancha: async (_,{id,  input, disponible}, ctx) => {
            let cancha = await Cancha.findById(id);
            if(!ctx.usuario){
                throw new GraphQLError('Cancha No autenticada', {
                    extensions: { code: 'UNAUTHENTICATED'},
                });
            }
            console.log(input)
            if (!cancha){
                throw new GraphQLError('Cancha No autenticada', {
                    extensions: { code: 'UNAUTHENTICATED'},
                });
            }
            // Si la persona que edita es o no
            if(cancha.creador.toString() !== ctx.usuario.id){
                throw new Error('No tienes las credenciales ');
            }
            input.disponible = disponible
            cancha = await Cancha.findOneAndUpdate({_id:id}, input, {new:true})
             console.log('verificacion',cancha)
            return cancha
            // Guardar y retornar la tarea
    },
    eliminarCancha: async (_,{id}, ctx) => {
            if(!ctx.usuario){
                throw new GraphQLError('Cancha No autenticada', {
                    extensions: { code: 'UNAUTHENTICATED'},
                });
            }
            let cancha = await Cancha.findById(id);
            if (!cancha){
                throw new Error('Cancha no encontrada');
            }
            if(cancha.creador.toString() !== ctx.usuario.id){
                throw new Error('No tienes las credenciales ');
            }
            await Cancha.findOneAndDelete({_id: id})
            await Establecimiento.findByIdAndUpdate(cancha.establecimiento, { $inc: { numeroCanchas: -1 } });
            return "Cancha eliminada"
    },

    eliminarMiReserva:async (_,{id, establecimiento}, ctx) => {
            console.log("nuevoooooooo", id, establecimiento)
            let reserva = await Reserva.findById(id);

            if (!reserva){
                throw new Error('reserva no encontrada');
            }
            // Si la persona que edita es o no

            if(reserva.establecimiento.toString() !== establecimiento){
                throw new Error('No tienes las credenciales');
            }

            await Reserva.findOneAndDelete({_id: id})
            return "reserva eliminada"
    },

    actualizarReservaEstado: async (_,{id,  establecimiento, estado, actualizacion}, ctx) => {
        //si la tarea existe o no
        let reserva = await Reserva.findById(id);
        if (!reserva){
            throw new Error('reserva no encontrada');
        }
        // Si la persona que edita es o no
        if(reserva.establecimiento.toString() !== establecimiento){
            throw new Error('No tienes las credenciales');
        }

        reserva = await Reserva.findOneAndUpdate({_id:id},{estado, actualizacion}, {new:true}).populate('establecimiento')
        //  console.log('verificacion', reserva)

        if (estado === 'denegado' || estado === 'aceptado') {
            try {
              // Obtener el token de notificación del cliente desde la reserva
              const cliente = await Cliente.findById(reserva.cliente);

              const pushToken = cliente.notificaciones_token;
              console.log('es la segunda reserva',pushToken)

              if (pushToken) {
                const body = estado === 'aceptado'? 'Tu reserva ha sido aceptada':  'Tu reserva ha sido rechazada' ;
                const data = {
                    estado: estado,
                    reservaId: reserva.id,
                    url: 'reservas_hechas'
                };
                await enviarNotificacion(pushToken, body, data);
            }
              // Enviar la notificación al cliente
              
            } catch (error) {
              console.error('Error al enviar la notificación al cliente:', error);
            }
          }
              console.log('enviando a', `RESERVAS_DE_${reserva.cliente}`)
              console.log('reserva', `RESERVAS_DE_${reserva.cliente}`)
        pubsub.publish(`RESERVAS_DE_${reserva.cliente}`, { cambioEstadoMiReservacion: reserva });

        return reserva

        // Guardar y retornar la tarea
    },
    actualizarReserva: async (_,{id, input}, ctx) => {
        //si la tarea existe o no
        console.log('esta llegando el input', input)
        let reserva = await Reserva.findById(id);

        if (!reserva){
            throw new Error('reserva no encontrada');
        }
        reserva = await Reserva.findOneAndUpdate({_id:id}, input, {new:true})
        return reserva
        // Guardar y retornar la tarea
    },

    nuevaAutoReserva: async (_,{ userId, input}, ctx) => {
        console.log('desde relverexdxs', input)
            try {
            const reservaExistente = await Reserva.findOne({
                    establecimiento: input.establecimiento,
                    espacioAlquilado: input.espacioAlquilado,
                    fecha: input.fecha,
                    estado: { $nin: ['denegado', 'anulado'] } // Excluir reservas con estado 'denegado' y 'anulado'
            });
            if (reservaExistente) {
                    // Si ya existe una reserva para la misma hora y espacio, lanzar un error
                    console.log('ya existe esta reserva')
                    throw new GraphQLError('Ya existe una reserva para tu establecimiento y cancha en esta hora.');
                }
            const reserva = new Reserva (input)
        // // Asociar al creador
            reserva.cliente = userId

            
        
            //almacenarlo en DB.
            const resultado = await reserva.save();
            // pubsub.publish('RESERVA', {nuevaReservacion: resultado})
            return resultado
        } catch (error) {
            console.log(error)
            throw error; // Relanzar el error para que sea manejado por GraphQL

        }
},

 },
    MiEstablecimiento: {
        nuevo: (root) => {
            return 
        }

    },

    Ubicacion: {
        latitude: (root) => {
            return root.coordinates[0]
        },
        longitude: (root) => {
            return root.coordinates[1]
        }
    },


    Subscription: {
        cambioEstadoMiReservacion: {
            subscribe: (_, {ClienteId}) => { 
              console.log('subsribiendo00 a', `RESERVAS_DE_${ClienteId}`)
              return pubsub.asyncIterator(`RESERVAS_DE_${ClienteId}`)
          }
          //    return context.pubsub.asyncIterator(`NUEVA_NOTIFICACION_${hotelId}`);
          }
      },
}