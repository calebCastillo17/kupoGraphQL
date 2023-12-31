import Establecimiento from "../../models/Establecimientos.js";
import Cliente from "../../models/Clientes.js";
import Cancha from "../../models/Canchas.js";
import Reserva from "../../models/Reservas.js";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { GraphQLError } from "graphql";
import dotenv from 'dotenv';
import { PubSub } from "graphql-subscriptions";
import mercadopago from "mercadopago";
import mailer from "../../config/mailer.js";
import SmsTwilioSend from "../../services/SmsTwilio.js";


dotenv.config();

const pubsub = new PubSub()

mercadopago.configure({
    sandbox: true,
    access_token: 'TEST-1189115791143583-082513-4cc22a46e65a7425d209dd9c24b4a161-1460216965', // Reemplaza con tu clave secreta de Mercado Pago
  });


const crearTokenCliente = (cliente, secreta, expiresIn) => {
    const {id, email, nombre} = cliente
    return jwt.sign({id,email, nombre}, secreta, { expiresIn})
}


export const  ClienteResolvers = {
    Query: {


        obtenerEstablecimientoPorId: async (_, {establecimientoId}, ctx) => {
            console.log('obtenerrrrrrrrrrrrrr', establecimientoId)
            const establecimiento =  await Establecimiento.findById(establecimientoId)
            return establecimiento;
        },
        obtenerEstablecimientosFilter: async (_, { nombre, ubicacion, metros, limit, offset }, ctx) => {
            console.log('obtenerrr', nombre, ubicacion, metros, limit, offset);

            const filter: any = {};

            if (nombre) {
                filter.nombre = { $regex: new RegExp(`.*${nombre}`, 'i') };
            }

            let aggregationPipeline = [];

            if (ubicacion) {
                aggregationPipeline.push({
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
            // Agregar paso de ordenación por valoración de mayor a menor
            // aggregationPipeline.push({
            //     $sort: {
            //     valoracion: -1,
            //     },
            // });
            aggregationPipeline = [
                ...aggregationPipeline,
                { $sort: {
                    valoracion: -1,
                    },},
                { $skip: offset },
                { $limit: limit },
            ];

            const establecimientos = await Establecimiento.aggregate([
                { $match: filter },
                ...aggregationPipeline,
            ]);
            console.log('probando sort')
            establecimientos.forEach((estab) => {
                console.log(estab.nombre, estab.distancia,'valoracion:', estab.valoracion);
            });

            return establecimientos;
        },
        // obtenerEstablecimientosFilter: async (_, {nombre,ubicacion, metros, limit, offset}, ctx) => {
        //     console.log('obtenerrrrrrrrrrrrrr', nombre,ubicacion, metros, limit, offset)
        //     const skip = (page - 1) * limit;

        //     const filter: any = {}
        //         if(nombre){
        //         filter.nombre ={ $regex: new RegExp(`.*${nombre}`, 'i') };
        //         otra opcion `\\b${nombre}\\w*`
        //     }
        //     if(ubicacion){
        //         filter.ubicacion =  {
        //             $nearSphere: {
        //               $geometry: {
        //                 type: 'Point',
        //                 coordinates: [ubicacion.latitude,ubicacion.longitude]
        //               },
        //               $maxDistance: metros
        //             }
        //           }
        //     }

        //     const establecimiento = await Establecimiento.find(filter).skip(offset).limit(limit);

        //     establecimiento.map((estab) => (
        //             console.log(estab.nombre)
        //     ))

        //       return establecimiento;
        // },


          obtenerEstablecimientosDisponibles: async (_, { fecha, offset, limit, filtroNombre, ubicacion, metros }) => {
            // Calcular el valor de salto (skip) en función de la paginación
            const skip = (offset - 1) * limit;
             console.log( fecha,  offset, limit, ubicacion, metros )

             const pipeline = [];

            if (ubicacion) {
                pipeline.push({
                    $geoNear: {
                        near: {
                          type: "Point",
                          coordinates: [ubicacion.latitude,ubicacion.longitude], // Proporciona las coordenadas del punto de referencia
                        },
                        distanceField: "distancia", // Agregará un campo "distancia" en los resultados
                      spherical: true, // Habilita cálculos esféricos para la búsqueda geoespacial
                        maxDistance: metros
                      },
                });
            }

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
                                        { $eq: ['$estado', 'solicitud'] }, // Agregar el filtro de estado 'aceptado'
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
                                '$numeroCanchas', // Cambiar al nombre del campo que almacena el número de canchas
                                {
                                    $size:  '$reservas'
                                },
                            ],
                        },
                    },

            })
            pipeline.push({$skip:offset})
            pipeline.push({$limit: limit})

            // Agregación para obtener establecimientos disponibles (no reservados)
            const establecimiento = await Establecimiento.aggregate(pipeline);


            establecimiento.map((estab) => {
                console.log(estab.nombre);
                estab.reservas.map((reserva) => {
                    console.log('Reserva:', reserva); // Imprime los detalles de la reserva
                });
            });
        

            return establecimiento;
        },





        obtenerCanchasPorEstablecimiento : async (_, {establecimientoId}, ctx) => {

            console.log(establecimientoId)

            console.log('establecimiento oid---------',establecimientoId)

            const canchas = await Cancha.find({establecimiento: establecimientoId})
            console.log(canchas)
            return canchas;
        },

        obtenerReservasPorEstab: async (_, {establecimientoId, fechaMin, fechaMax}, ctx) => {
            console.log('mis reservas id', establecimientoId)
            const now = new Date();
            if(!fechaMin){
                fechaMin = now
            }
            const filtroFecha = fechaMax ? { $gte: fechaMin, $lte: fechaMax } : { $gte: fechaMin };
            const reservas =  await Reserva.find({establecimiento:establecimientoId, fecha: filtroFecha, estado:'aceptado'}).sort({ fecha: 1 }).exec();
            return reservas;
        },

        obtenerReservasRealizadas: async (_, {clienteId}, ctx) => {
            console.log('mis reservas id', clienteId)
            const now = new Date();

            const filtroFecha =  { $gte: now };
            const reservas =  await Reserva.find({cliente: clienteId, fecha: filtroFecha}).sort({ registro: -1 }).exec();
            return reservas;
        },


        obtenerHistorialReservas: async (_, {clienteId, limite, page}, ctx) => {
            console.log('mis reservas id', clienteId)
            const now = new Date();
            const skip = (page - 1) * limite;

            const filtroFecha =  { $lt: now };
            const reservas =  await Reserva.find({cliente: clienteId, fecha: filtroFecha})
            .sort({ registro: -1 })
            .limit(limite)
            .skip(skip)
            .exec();
            return reservas;
        },


    },
    Mutation:{
        crearCliente: async (_, {input}, ctx) => {
            console.log(input)
                const {email, password, telefono} = input;
                const existeCliente = await Cliente.findOne({telefono})
                if(existeCliente) {
                    throw new Error('Ese numero ya esta registrado');
                }
                try {
                    //Hashear Password

                    const salt = await bcrypt.genSalt(10);
                    input.password = await bcrypt.hash(password, salt)
                    // registrar nuevo ususario
                    const NuevoCliente = new Cliente(input);
                    console.log(NuevoCliente)
                    NuevoCliente.save()
                    return "cliente creado correctamente"
                } catch (error) {
                    console.log(error)
                }
        },
        autenticarCliente: async (_, {input}, ctx) => {
                const { password, telefono} = input;

                //revisar si el usuario existe
                const existeCliente = await Cliente.findOne({telefono})

                if(!existeCliente) {
                    throw new Error('El cliente no esta registrado');
                }

                const user = existeCliente
                //revisar si el password es correcto
                const passwordCorrecto = await bcrypt.compare(password, existeCliente.password)


                if(!passwordCorrecto) {
                    throw new Error('password Incorrecto');
                }
                console.log('clienteee ' , user)
                return {
                user,
                accessToken:{ token: crearTokenCliente(existeCliente, process.env.PALABRATOKEN, '20m')},
                refreshToken: {token: crearTokenCliente(existeCliente, process.env.PALABRATOKEN, '7d' )}

                }
        },
        enviarCodeVerificacionCliente: async (_, {telefono}, ctx) => {
            let verificacionCode = Math.floor(10000 + Math.random()*90000)
            console.log('telefono,hhh', telefono)
            const existeClient = await Cliente.findOne({telefono})
            if(!existeClient) {
                throw new Error('El Usuario no está registrado');
            }
            try {
                const mensaje = await SmsTwilioSend(telefono, `${verificacionCode} es tu codigo de verificacion` )
                console.log('mensaje pe', mensaje.status)
                if(mensaje.status === "queued"){
                    const usuario = await Cliente.findOneAndUpdate({telefono}, {code_verificacion: verificacionCode}, {new:true})
                    if (usuario.code_verificacion === verificacionCode){
                        return 'codigo enviado'
                    }
                console.log('usuario ps',usuario)

                }
            } catch (error) {
                console.log('mensaje serio error', error)
                throw new Error(error);

            }
           
        },
    
        verificarCliente: async (_, {code, telefono}, ctx) => {
            console.log('telefono, y codigo', telefono, code)
            const existeAdmin = await Cliente.findOne({telefono})
            if(!existeAdmin) {
                throw new Error('El Usuario no está registrado');
            }

            if(existeAdmin.code_verificacion === code){
                await Cliente.findOneAndUpdate({telefono}, {estado: 'verificado'}, {new:true})
                return 'correcto'
            }else {
                return 'incorrecto'
            }
          
        },

        refreshAccessTokenCliente: (parent, { refreshToken }) => {
            // Verificar el token de actualización (refresh token)
            try {
              const usuario = jwt.verify(refreshToken, process.env.PALABRATOKEN);
                console.log(usuario)
              // Generar un nuevo token de acceso
              const accessToken = crearTokenCliente(usuario, process.env.PALABRATOKEN,'1h');

              return { token: accessToken};
            } catch (error) {
              throw new Error('Token de actualización inválido');
            }
          },


        verificarAutenticacion: (_,{input}, ctx) => {

            if(!ctx.usuario){
                throw new GraphQLError('Usuario No autenticado', {
                    extensions: { code: 'UNAUTHENTICATED'},
                });
            }
                return true
        },
         restaurarPassword: async (_,{input}, ctx) => {

                const {email, password, telefono} = input;
                console.log(password, telefono)


                const existeClient = await Cliente.findOne({telefono})
                if(!existeClient) {
                    throw new Error('El Usuario no está registrado');
                }
                try {
                    //Hashear Password
                    const salt = await bcrypt.genSalt(10);
                    const passwordNew= await bcrypt.hash(password, salt)
                     await Cliente.findOneAndUpdate({telefono}, {password: passwordNew}, {new:true})
            
                     return "Contraseña restablecida correctamente"
                } catch (error) {
                    console.log(error)
                }
        },


        editarUsuarioCliente: async (_,{ input}, ctx) => {
                if(!ctx.usuario){
                    throw new GraphQLError('Cliente No autenticado', {
                        extensions: { code: 'UNAUTHENTICATED'},
                    });

                }
                let usuario = await Cliente.findById(ctx.usuario.id);

                if (!usuario){
                    throw new Error('usuario no encontrado');
                }
                // Si la persona que edita es o no!!
                usuario = await Cliente.findOneAndUpdate({_id:ctx.usuario.id}, input, {new:true})
                console.log('editarrrr cliente', usuario)
                
                return usuario
        },
        editarPeloteroCliente: async (_,{ input}, ctx) => {
            if(!ctx.usuario){
                throw new GraphQLError('Cliente No autenticado', {
                    extensions: { code: 'UNAUTHENTICATED'},
                });

            }
            console.log('pelotero', input)
            let usuario = await Cliente.findById(ctx.usuario.id);

            if (!usuario){
                throw new Error('usuario no encontrado');
            }
            // Si la persona que edita es o no!!
            usuario = await Cliente.findOneAndUpdate({_id:ctx.usuario.id}, {pelotero: input}, {new:true})
            console.log('editarrrr cliente', usuario)
            
            return usuario
        },

        editarFotoCliente: async (_,{foto}, ctx) => {
         
            console.log('foto', foto)
            let usuario = await Cliente.findById(ctx.usuario.id);

            if (!usuario){
                throw new Error('usuario no encontrado');
            }
            // Si la persona que edita es o no!!
            usuario = await Cliente.findOneAndUpdate({_id:ctx.usuario.id}, {foto}, {new:true})
            console.log('editarrrr cliente', usuario)
            
            return usuario
        },


        actualizarTokenNotificacionesCliente: async (_,{token}, ctx) => {

                if(!ctx.usuario){
                    throw new GraphQLError('Cliente No autenticado', {
                        extensions: { code: 'UNAUTHENTICATED'},
                    });
                } 
                let usuario = await Cliente.findById(ctx.usuario.id);


                if (!usuario){
                    throw new Error('usuario cliente no encontrado');
                }


                // Si la persona que edita es o no!!
                usuario = await Cliente.findOneAndUpdate({_id:ctx.usuario.id},{notificaciones_token:token}, {new:true})
                return usuario
        },



        nuevaReserva: async (_,{ userId, input}, ctx) => {
                console.log('desde relverexdxs', input)
                try {
                    const reserva = new Reserva (input)
                // // Asociar al creador
                    reserva.cliente = userId


                    //almacenarlo en DB.
                    const resultado = await reserva.save();
                    pubsub.publish(`RESERVA_${input.establecimiento}`, {nuevaReservacion: resultado})
                    return resultado
                } catch (error) {
                    console.log(error)
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


    },
    Reserva: {
        establecimiento: async (reserva) => {
            console.log('pasa por resolver reserva')
          const establecimiento = await Establecimiento.findById(reserva.establecimiento);
          return establecimiento;
        },
    },
    EstablecimientoLista: {
        id: (establecimiento) => establecimiento._id.toString(),
    },

    Subscription: {
        nuevaReservacion: {
          subscribe: (_, {establecimientoId}) => { 
            console.log('subsribiendo a', establecimientoId)
            return pubsub.asyncIterator(`RESERVA_${establecimientoId}`)
        }
        //    return context.pubsub.asyncIterator(`NUEVA_NOTIFICACION_${hotelId}`);
        },
      },
  };
