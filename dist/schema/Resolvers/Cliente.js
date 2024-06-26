import Establecimiento from "../../models/Establecimientos.js";
import Admin from "../../models/Admins.js";
import Cancha from "../../models/Canchas.js";
import Reserva from "../../models/Reservas.js";
import { GraphQLError } from "graphql";
import dotenv from 'dotenv';
import { PubSub } from "graphql-subscriptions";
import mercadopago from "mercadopago";
import { toZonedTime } from 'date-fns-tz';
import enviarNotificacion from "../../services/EnviarNotificacionExpo.js";
// Función para normalizar una fecha a una zona horaria específica
dotenv.config();
const pubsub = new PubSub();
mercadopago.configure({
    sandbox: true,
    access_token: 'TEST-1189115791143583-082513-4cc22a46e65a7425d209dd9c24b4a161-1460216965', // Reemplaza con tu clave secreta de Mercado Pago
});
export const ClienteResolvers = {
    Query: {
        obtenerEstablecimientoPorId: async (_, { establecimientoId }, ctx) => {
            console.log('obtenerrrrrrrrrrrrrr', establecimientoId);
            const establecimiento = await Establecimiento.findById(establecimientoId);
            return establecimiento;
        },
        obtenerEstablecimientos: async (_, { nombre, ubicacion, metros, limit, offset, fecha }) => {
            console.log('Parametros de entrada:', nombre, ubicacion, metros, limit, offset, fecha);
            const filter = {};
            const pipeline = [];
            if (nombre) {
                filter.nombre = { $regex: new RegExp(`.*${nombre}`, 'i') };
            }
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
        obtenerCanchasPorEstablecimiento: async (_, { establecimientoId }, ctx) => {
            console.log('establecimiento oid---------', establecimientoId);
            const canchas = await Cancha.find({ establecimiento: establecimientoId });
            console.log(canchas);
            return canchas;
        },
        obtenerReservasPorEstab: async (_, { establecimientoId, cancha, fechaMin, fechaMax }, ctx) => {
            console.log('mis reservas id', establecimientoId);
            const now = new Date();
            if (!fechaMin) {
                fechaMin = now;
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
                const query = { cliente: clienteId };
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
            }
            catch (error) {
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
                console.log('historialReservas', reservas);
                return reservas;
            }
            catch (error) {
                console.error('Error al obtener el historial de reservas:', error);
                throw error;
            }
        },
    },
    Mutation: {
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
                    console.log('ya existe esta reserva');
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
                if (pushToken) {
                    let reserva = resultado.toObject();
                    reserva.id = reserva._id;
                    reserva.__typename = "Reserva",
                        delete reserva._id;
                    delete reserva.__v;
                    delete reserva.establecimiento;
                    const body = 'Nueva reserva realizada';
                    const data = {
                        reserva: reserva,
                        estado: reserva.estado,
                        mensaje: 'Nueva reserva realizada',
                        url: 'reservas'
                    };
                    await enviarNotificacion(pushToken, body, data);
                }
                // Publicar evento de nueva reserva
                pubsub.publish(`RESERVAS_DE_${input.establecimiento}`, { nuevaReservacion: resultado });
                // console.log('Reserva realizada:', resultado);
                return resultado;
            }
            catch (error) {
                console.log(error);
                throw error; // Relanzar el error para que sea manejado por GraphQL
            }
        },
        eliminarReserva: async (_, { id, clienteId }, ctx) => {
            let reserva = await Reserva.findById(id);
            if (!reserva) {
                throw new Error('reserva no encontrada');
            }
            // Si la persona que edita es o no
            if (reserva.cliente.toString() !== clienteId) {
                throw new Error('No tienes las credenciales');
            }
            console.log("nuevoooooooo", id, clienteId);
            await Reserva.findOneAndDelete({ _id: id });
            return "reserva eliminada";
        },
        actualizarReservaEstadoCliente: async (_, { id, clienteId, estado }, ctx) => {
            //si la tarea existe o no
            console.log(id, clienteId, estado);
            let reserva = await Reserva.findById(id);
            // console.log(reserva)
            if (!reserva) {
                throw new Error('reserva no encontrada');
            }
            // Si la persona que edita es o no
            if (reserva.cliente.toString() !== clienteId) {
                throw new Error('No tienes las credenciales');
            }
            reserva = await Reserva.findOneAndUpdate({ _id: id }, { estado }, { new: true });
            console.log('verificacion', reserva);
            return reserva;
            // Guardar y retornar la tarea
        },
        realizarPagoTarjeta: async (_, { input }) => {
            try {
                // Obtén los datos de la tarjeta y el monto del input
                console.log(input);
                const { token, issuer_id, payment_method_id, installments, email, amount } = input;
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
                };
                // Crea la preferencia en Mercado Pago
                const data = await mercadopago.payment.create(payment_data);
                if (data) {
                    console.log('generar respuesta', data);
                    console.log('generar respuesta', data.body.fee_details);
                }
                const response = {
                    success: true,
                    message: 'Solicitud de pago exitosa',
                    // paymentUrl: data.body.init_point,
                };
                console.log(response);
                //   console.log(data.body.init_point)
                return response;
            }
            catch (error) {
                console.error('Error al solicitar el pago:', error);
                return {
                    success: false,
                    message: 'Error al solicitar el pago',
                    paymentUrl: null,
                };
            }
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
    Subscription: {
        nuevaReservacion: {
            subscribe: (_, { establecimientoId }) => {
                console.log('subsribiendo a', establecimientoId);
                return pubsub.asyncIterator(`RESERVAS_DE_${establecimientoId}`);
            }
            //    return context.pubsub.asyncIterator(`NUEVA_NOTIFICACION_${hotelId}`);
        },
    },
};
