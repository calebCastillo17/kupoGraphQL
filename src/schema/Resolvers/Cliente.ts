import Establecimiento from "../../models/Establecimientos.js";
import Cliente from "../../models/Clientes.js";
import Cancha from "../../models/Canchas.js";
import Reserva from "../../models/Reservas.js";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { GraphQLError } from "graphql";
import dotenv from 'dotenv';
import { PubSub } from "graphql-subscriptions";

dotenv.config();

const pubsub = new PubSub()


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

        obtenerEstablecimientosFilter: async (_, {nombre,ubicacion, metros, limit, page}, ctx) => {
            console.log('obtenerrrrrrrrrrrrrr', ubicacion, metros)
            const skip = (page - 1) * limit;

            const filter: any = {}
                if(nombre){
                filter.nombre ={ $regex: new RegExp(`.*${nombre}`, 'i') };
                // otra opcion `\\b${nombre}\\w*`
            }
            if(ubicacion){
                filter.ubicacion =  {
                    $nearSphere: {
                      $geometry: {
                        type: 'Point',
                        coordinates: [ubicacion.latitude,ubicacion.longitude]
                      },
                      $maxDistance: metros
                    }
                  }
            }

            const establecimiento = await Establecimiento.find(filter).skip(skip).limit(limit);
          
              return establecimiento;
        },

     
        obtenerCanchasPorEstablecimiento: async (_, {establecimientoId}, ctx) => {

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
                const {email, password} = input;
                const existeCliente = await Cliente.findOne({email})
                if(existeCliente) {
                    throw new Error('El cliente ya esta registrado');
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
                const {email, password} = input;

                //revisar si el usuario existe
                const existeCliente = await Cliente.findOne({email})

                if(!existeCliente) {
                    throw new Error('El cliente no esta registrado');
                }
                const {nombre, apellido, nombreUsuario, sexo, telefono, id} = existeCliente
                
                const user = {
                    nombre,
                    apellido,
                    nombreUsuario,
                    sexo,
                    telefono,
                    id
                }
                //revisar si el password es correcto
                const passwordCorrecto = await bcrypt.compare(password, existeCliente.password)
            

                if(!passwordCorrecto) {
                    throw new Error('password Incorrecto');
                }

                return {
                user,
                accessToken:{ token: crearTokenCliente(existeCliente, process.env.PALABRATOKEN, '20m')},
                refreshToken: {token: crearTokenCliente(existeCliente, process.env.PALABRATOKEN, '7d' )}

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
        
        editarUsuarioCliente: async (_,{ input}, ctx) => {
            console.log('editarrrr cliente', input)
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
                    // pubsub.publish('RESERVA', {nuevaReservacion: resultado})
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
    

       
    },
    Reserva: {
        establecimiento: async (reserva) => {
            console.log('pasa por resolver reserva')
          const establecimiento = await Establecimiento.findById(reserva.establecimiento);
          return establecimiento;
        },
    },
    
    Subscription: {
        nuevaReservacion: {
          subscribe: () =>  pubsub.asyncIterator('RESERVA')
        },
      },
  };
