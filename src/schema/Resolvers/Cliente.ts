import Establecimiento from "../../models/Establecimientos.js";
import Cliente from "../../models/Clientes.js";
import Admin from "../../models/Admins.js";
import Cancha from "../../models/Canchas.js";
import Reserva from "../../models/Reservas.js";
import Invitacion from "../../models/Invitaciones.js";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { GraphQLError } from "graphql";
import dotenv from 'dotenv';
import { PubSub } from "graphql-subscriptions";
import mercadopago from "mercadopago";
import mailer from "../../config/mailer.js";
import SmsTwilioSend from "../../services/SmsTwilio.js";
import { format, toZonedTime } from 'date-fns-tz'
import enviarNotificacion from "../../services/EnviarNotificacionExpo.js";
import NotificacionesPush from "../../services/NotificacionesExpo.js";

// Función para normalizar una fecha a una zona horaria específica

dotenv.config();

const pubsub = new PubSub()

mercadopago.configure({
    sandbox: true,
    access_token: 'TEST-1189115791143583-082513-4cc22a46e65a7425d209dd9c24b4a161-1460216965', // Reemplaza con tu clave secreta de Mercado Pago
  });



export const  ClienteResolvers = {
    Query: {
        obtenerEstablecimientoPorId: async (_, {establecimientoId}, ctx) => {
            console.log('obtenerrrrrrrrrrrrrr', establecimientoId)
            const establecimiento =  await Establecimiento.findById(establecimientoId)
            return establecimiento;
        },

        obtenerEstablecimientos: async (_, { nombre, ubicacion, metros, limit, offset, fecha }) => {
            console.log('Parametros de entrada:', nombre, ubicacion, metros, limit, offset, fecha);
            const filter:any  = { validado: true }; // Filtro inicial para establecimientos validados
            const pipeline = [];
        
            if (nombre) {
                filter.nombre = { $regex: new RegExp(`.*${nombre}`, 'i') };
            }
        
            pipeline.push({ $match: filter });
            if (ubicacion) {
                pipeline.push({
                    $geoNear: {
                        near: {
                            type: 'Point',
                            coordinates: [ubicacion.latitude, ubicacion.longitude],
                        },
                        distanceField: 'distancia',
                        maxDistance: metros,
                        spherical: true,
                    },
                });
            }

            if (fecha) {
                const peruDate = toZonedTime(new Date(fecha), 'America/Lima');
                const hora = new Date(peruDate).getHours();

                pipeline.push({
                    $lookup: {
                        from: 'reservas',
                        let: { establecimientoId: '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$establecimiento', '$$establecimientoId'] },
                                            { $eq: ['$fecha', new Date(fecha)] },
                                            { $in: ['$estado', ['aceptado', 'solicitud']] },
                                        ],
                                    },
                                },
                            },
                        ],
                        as: 'reservas',
                    },
                });

                pipeline.push({
                    $match: {
                        $expr: {
                            $gt: [
                                '$numeroCanchas',
                                { $size: '$reservas' },
                            ],
                        },
                    },
                });

                pipeline.push({
                    $match: {
                        $expr: {
                            $cond: {
                                if: { $gte: ['$horarioCierre', '$horarioApertura'] },
                                then: {
                                    $and: [
                                        { $lte: ['$horarioApertura', hora * 60] },
                                        { $gte: ['$horarioCierre', (hora + 1) * 60] },
                                    ],
                                },
                                else: {
                                    $or: [
                                        { $lte: ['$horarioApertura', hora * 60] },
                                        { $gte: ['$horarioCierre', (hora + 1) * 60] },
                                    ],
                                },
                            },
                        },
                    },
                });
            }
            pipeline.push({ $match: filter });
            if (!ubicacion) {
                pipeline.push({ $sort: { nombre: 1 } }); // Ordenar alfabéticamente por nombre
            }
            pipeline.push({ $skip: offset });
            pipeline.push({ $limit: limit });
            const establecimientos = await Establecimiento.aggregate(pipeline);
            establecimientos.forEach((estab) => {
                console.log(estab.nombre, estab.distancia, 'valoracion:', estab.reservas);
                if (estab.reservas) {
                    estab.reservas.forEach((reserva) => {
                        console.log('Reserva:', reserva);
                    });
                }
            });
            return establecimientos;
        },


        obtenerCanchasPorEstablecimiento : async (_, {establecimientoId}, ctx) => {
            console.log('establecimiento oid---------',establecimientoId)
            const canchas = await Cancha.find({establecimiento: establecimientoId})
            console.log(canchas)
            return canchas;
        },


        obtenerReservasPorEstab: async (_, { establecimientoId, cancha, fechaMin, fechaMax }, ctx) => {
            console.log('mis reservas id', establecimientoId)
            const now = new Date();
            if (!fechaMin) {
                fechaMin = now
            }
            const filtroFecha = fechaMax ? { $gte: fechaMin, $lte: fechaMax } : { $gte: fechaMin };
            const reservas = await Reserva.find({
                establecimiento: establecimientoId,
                fecha: filtroFecha,
                espacioAlquilado: cancha,
                estado: { $ne: 'denegado' } // Filtra las reservas donde el estado no sea 'denegado'
            }).sort({ fecha: 1 }).exec();
            return reservas;
        },

        obtenerReservasRealizadas: async (_, { clienteId, fecha, limite, page }, ctx) => {
            try {
                const skip = (page - 1) * limite;
                const query:any = { cliente: clienteId };

                // Añadir fecha a la consulta solo si no es null
                if (fecha !== null) {
                    query.fecha = fecha;
                }

                const reservas = await Reserva.find(query)
                                              .sort({ registro: -1 }) // Ordenar por campo 'registro' en orden descendente
                                              .populate('establecimiento') // Poblar el campo 'establecimiento'
                                              .limit(limite) // Limitar la cantidad de resultados
                                              .skip(skip) // Omitir una cantidad de resultados según la paginación
                                              .exec(); // Ejecutar la consulta

                return reservas;
            } catch (error) {
                console.error('Error al obtener las reservas realizadas:', error);
                throw error;
            }
        },


        obtenerHistorialReservas: async (_, { clienteId, limite, page }, ctx) => {
            try {
                const now = new Date();
                const skip = (page - 1) * limite;
                const filtroFecha = { $lt: now };

                const reservas = await Reserva.find({ cliente: clienteId, fecha: filtroFecha })
                    .sort({ registro: -1 })
                    .limit(limite)
                    .skip(skip)
                    .populate('establecimiento')
                    .exec();
                console.log('historialReservas', reservas)
                return reservas;
            } catch (error) {
                console.error('Error al obtener el historial de reservas:', error);
                throw error;
            }
        },

        obtenerInvitacionesPorReserva: async(_, { reservaId }) => {
            const invitaciones = await Invitacion.find({ reserva: reservaId })
                .populate('creador')
                .populate('reserva');
            return invitaciones
        },

        obtenerInvitaciones: async(_, { invitadoId , fechaMin ,FechaMax, page, limite }) => {
            console.log('inviato', invitadoId)
            const skip = (page - 1) * limite;
            const query:any = { cliente: invitadoId };

            // Añadir fecha a la consulta solo si no es null
            if (fechaMin !== null) {
                query.fecha = fechaMin;
            }
            const invitaciones = await Invitacion.find({ invitado: invitadoId })
                .sort({ registro: -1 }) 
                .populate('creador')
                .populate('reserva')
                .limit(limite) // Limitar la cantidad de resultados
                .skip(skip) // Omitir una cantidad de resultados según la paginación
                .exec(); // Ejecutar la consulta

            return invitaciones
        },
    },




    Mutation:{
        nuevaReserva: async (_, { userId, input }, ctx) => {
            console.log('desde nueva reserva', input);
            try {
                // Verificar si ya existe una reserva para la misma hora en el mismo establecimiento y espacio alquilado
                const reservaExistente = await Reserva.findOne({
                    establecimiento: input.establecimiento,
                    espacioAlquilado: input.espacioAlquilado,
                    fecha: input.fecha,
                    estado: { $nin: ['denegado', 'anulado'] } // Excluir reservas con estado 'denegado' y 'anulado'
                });

                if (reservaExistente) {
                    // Si ya existe una reserva para la misma hora y espacio, lanzar un error
                    console.log('ya existe esta reserva')
                    throw new GraphQLError('Ya existe una reserva para este establecimiento y cancha en esta hora.');
                }
                            // Verificar si el usuario ya tiene más de dos reservas activas
                const reservasActivas = await Reserva.find({
                    cliente: userId,
                    fecha: { $gt: new Date() } // Fecha mayor que la actual
                });

                if (reservasActivas.length >= 5) {
                    // Si el usuario ya tiene más de dos reservas activas, lanzar un error
                    throw new GraphQLError('Ya tienes demasiadas reservas activas.');
                }
                // Crear la nueva reserva
                const nuevaReserva = new Reserva(input);
                nuevaReserva.cliente = userId;
                const resultado = await nuevaReserva.save();
                // Buscar el establecimiento asociado a la reserva
                const establecimiento = await Establecimiento.findById(input.establecimiento);

                const nuevaInvitacion = new Invitacion({
                    creador: nuevaReserva.cliente,
                    invitado: nuevaReserva.cliente,
                    nombreUsuarioCreador: nuevaReserva.nombreUsuario,
                    nombreUsuarioInvitado: nuevaReserva.nombreUsuario,
                    reserva: nuevaReserva.id,
                    fechaReserva: nuevaReserva.fecha,
                    estado: 'aceptado',
                    registro:nuevaReserva.registro,
                    actualizacion:nuevaReserva.actualizacion,
                });

                const invitacion = await nuevaInvitacion.save();
                console.log('esta es la invitacion', invitacion)
                if (!establecimiento) {
                    throw new GraphQLError('Establecimiento no encontrado.');
                }

                // Buscar el administrador asociado al establecimiento
                const administrador = await Admin.findOne({ _id: establecimiento.creador });

                if (!administrador) {
                    throw new GraphQLError('Administrador del establecimiento no encontrado.');
                }
                const pushToken = administrador.notificaciones_token;
                 // Convertir resultado en un objeto que incluye id en lugar de _id
                console.log('estos son los token al crear una reserva,', pushToken)

                if (pushToken.length > 0) {
                    let reserva:any = resultado.toObject();
                    console.log('esta es la reservaaa', resultado)
                    reserva.id = reserva._id;
                    reserva.__typename=  "Reserva",
                    delete reserva._id
                    delete reserva.__v;
                    delete reserva.establecimiento;
                    const message = {
                        body:'Nueva reserva realizada' ,
                        data: {
                            reserva: reserva,
                            estado: reserva.estado,
                            mensaje: 'Nueva reserva realizada',
                            url: 'reservas'
                        }
                    }
                    await NotificacionesPush(pushToken, message);
                }
                // Publicar evento de nueva reserva
                pubsub.publish(`RESERVAS_DE_${input.establecimiento}`, { nuevaReservacion: resultado });
                // console.log('Reserva realizada:', resultado);
                return resultado;
            } catch (error) {
                console.log(error);
                throw error; // Relanzar el error para que sea manejado por GraphQL
            }
        },

        eliminarReserva:async (_,{id, clienteId}, ctx) => {
            let reserva = await Reserva.findById(id);
            if (!reserva){
                throw new Error('reserva no encontrada');
            }
            // Si la persona que edita es o no

            if(reserva.cliente.toString() !== clienteId){
                throw new Error('No tienes las credenciales');
            }
            let invitacion = await Invitacion.findOne({ reserva: id });
            if (invitacion) {
                await Invitacion.findByIdAndDelete(invitacion._id);
            }

            console.log("nuevoooooooo", id, clienteId)

            await Reserva.findOneAndDelete({_id: id})
            return "reserva eliminada"
        },

    actualizarReservaEstadoCliente: async (_,{id, clienteId, estado}, ctx) => {
        //si la tarea existe o no
        console.log(id, clienteId, estado)
        let reserva = await Reserva.findById(id);

        // console.log(reserva)

        if (!reserva){
            throw new Error('reserva no encontrada');
        }
        // Si la persona que edita es o no
        if(reserva.cliente.toString() !== clienteId){
            throw new Error('No tienes las credenciales');
        }

        reserva = await Reserva.findOneAndUpdate({_id:id}, {estado}, {new:true})
         console.log('verificacion', reserva)
        return reserva

        // Guardar y retornar la tarea
    },

    realizarPagoTarjeta : async (_, { input }) => {
        try {
          // Obtén los datos de la tarjeta y el monto del input
          console.log(input)
          const { token, issuer_id, payment_method_id,installments, email, amount } = input;

        //   Crea un objeto de preferencia de Mercado Pago con los datos del pago
         const payment_data = {
            token,
            issuer_id,
            payment_method_id,
            transaction_amount: Number(amount),
            installments: Number(installments),
            description: "Descripción del producto",
            payer: {
              email,
            //   identification: {
            //     type: identificationType,
            //     number: identificationNumber,
            //   },
            },
         }
          // Crea la preferencia en Mercado Pago
          const data = await mercadopago.payment.create(payment_data)
          if(data){
            console.log('generar respuesta', data)
            console.log('generar respuesta', data.body.fee_details)
          }


          const response = {
            success: true,
            message: 'Solicitud de pago exitosa',
            // paymentUrl: data.body.init_point,
          }

          console.log(response)
        //   console.log(data.body.init_point)
          return response
        } catch (error) {
          console.error('Error al solicitar el pago:', error);
          return {
            success: false,
            message: 'Error al solicitar el pago',
            paymentUrl: null,
          };
        }
      },

        crearInvitacion: async(_, { input }) => {
            // console.log(input)

            try {
                const nuevaInvitacion = new Invitacion({
                    ...input,
                    // registro: new Date(),
                    // actualizacion: new Date(),
                });

            const savedInvitacion = await nuevaInvitacion.save();
            const invitacion = await Invitacion.findById(savedInvitacion._id)
            .populate('reserva');
            console.log('esta es la invitacion', invitacion)

              // Buscar el administrador asociado al establecimiento
              const cliente = await Cliente.findOne({ _id: invitacion.invitado });

              if (!cliente) {
                  throw new GraphQLError('Usuariono encontrado.');
              }
              const pushToken = cliente.notificaciones_token;
              console.log('estos son los token', pushToken)
            //    // Convertir resultado en un objeto que incluye id en lugar de _id

              if (pushToken.length > 0) {
                const message = {
                    body:'Te han invitado a un partido' ,
                    data: {
                        invitacion: invitacion,
                        mensaje: 'Nueva Invitacion realizada',
                        url: 'invitaciones_hechas'
                    },
                }
                await NotificacionesPush(pushToken, message);
              }
              // Publicar evento de nueva reserva
              // console.log('Reserva realizada:', resultado);
            return invitacion

            } catch (error) {
                console.log(error)
            }
        },

         editarInvitacion: async(_, { id, input }) =>  {
            console.log(input, id)
            const invitacion = await Invitacion.findByIdAndUpdate(
                id,
                { ...input },
                { new: true }
            ).populate('creador').populate('reserva');

            if (input.estado === 'denegado' || input.estado === 'aceptado') {
                try {
                  // Obtener el token de notificación del cliente desde la reserva
                  const cliente = await Cliente.findById(invitacion.creador);
    
                  const pushToken = cliente.notificaciones_token;
                  console.log('es la segunda reserva',pushToken)
    
                  if (pushToken.length > 0) {
                    const message = {
                        body:input.estado === 'aceptado'? 'Una invitación ha sido aceptada':  'Una invitación ha sido rechazada' ,
                        data: {
                            estado: invitacion.estado,
                            invitacionId: invitacion.id,
                            url: 'reservas_hechas',
                        }
                    }
                    await NotificacionesPush(pushToken, message);
                  }
                  // Enviar la notificación al cliente
                  
                } catch (error) {
                  console.error('Error al enviar la notificación al cliente:', error);
                }
              }
            return invitacion
        },
         eliminarInvitacion :async(_, { id }) => {
            const invitacion = await Invitacion.findByIdAndDelete(id)
                .populate('creador')
                .populate('reserva');
            return invitacion;
        },
    },

    Reserva: {
        // establecimiento: async (reserva) => {
        //     console.log('pasa por resolver reserva')
        //   const establecimiento = await Establecimiento.findById(reserva.establecimiento);
        //   return establecimiento;
        // },
    },
    Establecimiento: {
        id: (establecimiento) => establecimiento._id.toString(),
    },
    Invitacion: {
        creador: async (invitacion) => {
            return await Cliente.findById(invitacion.creador);
        },

        reserva: async (invitacion) => {
            console.log('buscando reserva')
            return await Reserva.findById(invitacion.reserva).populate('establecimiento') ;
        },
    },

    Subscription: {
        nuevaReservacion: {
          subscribe: (_, {establecimientoId}) => {
            console.log('subsribiendo a', establecimientoId)
            return pubsub.asyncIterator(`RESERVAS_DE_${establecimientoId}`)
        }
        //    return context.pubsub.asyncIterator(`NUEVA_NOTIFICACION_${hotelId}`);
        },


      },
  };
