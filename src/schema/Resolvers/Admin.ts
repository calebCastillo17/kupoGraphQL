import Establecimiento from "../../models/Establecimientos.js";
import Cliente from "../../models/Clientes.js";
import Cancha from "../../models/Canchas.js";
import Admin from "../../models/Admins.js";
import Reserva from "../../models/Reservas.js";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { GraphQLError } from "graphql";
import mailer from "../../config/mailer.js";

const crearTokenAdmin = (admin, secreta, expiresIn) => {
    const {id, email, nombre} = admin
    return jwt.sign({id,email, nombre}, secreta, { expiresIn})
}   
const horaActual = new Date()
console.log(horaActual.getHours())
console.log(Date.now())


export const AdminResolvers = {
    Query: {

        obtenerUsuarioAdmin: async (_, {}, ctx) => {
            console.log('pasapor aquiiiiii')

            if(!ctx.usuario){
                throw new GraphQLError('no Autenticado', {
                    extensions: { code: 'UNAUTHENTICATED'},
                });
            }
          
            
            const usuario =  await Admin.findById(ctx.usuario.id)
            console.log(usuario)

            return usuario;
        },

        obtenerMisEstablecimientos: async (_, {}, ctx) => {

            if(!ctx.usuario){
                throw new GraphQLError('no Autenticado', {
                    extensions: { code: 'UNAUTHENTICATED'},
                });
            }
    
            
            const establecimiento =  await Establecimiento.find({creador: ctx.usuario.id})
            return establecimiento;
        },
        obtenerMiEstablecimientoSeleccionado: async (_, {establecimientoId}, ctx) => {
           
            console.log(establecimientoId)
            if(!ctx.usuario){
                throw new GraphQLError('no Autenticado 2', {
                    extensions: { code: 'UNAUTHENTICATED'},
                });
            }
         
                const establecimiento =  await Establecimiento.find({creador: ctx.usuario.id}).where('_id').equals(establecimientoId)
                return establecimiento;
        },

        
        obtenerMisCanchasPorEstablecimientoFuera: async (_, {establecimientoId}, ctx) => {

            console.log(establecimientoId)
            if(!ctx.usuario){
                throw new GraphQLError('no Autenticado 2', {
                    extensions: { code: 'UNAUTHENTICATED'},
                });
            }
            console.log('establecimiento oid---------',establecimientoId)
       
            const canchas = await Cancha.find({creador: ctx.usuario.id}).where('establecimiento').equals(establecimientoId)
            console.log(canchas)
            return canchas;
        },
        

        obtenerMisReservas: async (_, {establecimientoId}, ctx) => {
            console.log('mis reservas id', establecimientoId)
            const now = new Date();
            const reservas =  await Reserva.find({establecimiento:establecimientoId, fecha: { $gte: now }, estado: { $ne: 'denegado' }}).sort({ fecha: 1 }).exec();
            return reservas;
        },


        encontrarMiEstablecimientoPorId: async (_, {id}, ctx) => {
            
            if(!ctx.usuario){
                throw new GraphQLError('no Autenticado 2', {
                    extensions: { code: 'UNAUTHENTICATED'},
                });
            }
            console.log('encontrando mi estableccimientooooo',id)

                const establecimiento =  await Establecimiento.find({creador: ctx.usuario.id}).where('_id').equals(id)
                return establecimiento;
        },

        obtenerMiHistorialReservas: async (_, {establecimientoId, limite, page}, ctx) => {
            console.log('mis reservas id', establecimientoId)
            const now = new Date();
            const skip = (page - 1) * limite;
           
            const filtroFecha =  { $lt: now };
            const reservas =  await Reserva.find({establecimiento: establecimientoId, fecha: filtroFecha})
            .sort({ registro: -1 })
            .limit(limite)
            .skip(skip)
            .exec();
            return reservas;
        },
        encontrarCliente: async (_, {nombreUsuario}, ctx) => {
            console.log('obtenerrrrrrrrrrrrrr', nombreUsuario)
            const cliente =  await Cliente.findOne({nombreUsuario})
            return cliente;
        }
      
    },
    Mutation:{
        crearAdmin: async (_, {input}, ctx) => {
                const {email, password} = input;
                const existeAdmin = await Admin.findOne({email})
                if(existeAdmin) {
                    throw new Error('El administrador ya esta registrado');
                }
                try {
                   
                    const salt = await bcrypt.genSalt(10);
                    input.password = await bcrypt.hash(password, salt)
                    // registrar nuevo ususario
                    const NuevoAdmin = new Admin(input);
                    console.log(NuevoAdmin)
                    NuevoAdmin.save()
                    return "Administrador creado correctamente"
                } catch (error) {
                    console.log(error)
                }
        },



        verificarAdmin: async (_, {input}, ctx) => {
                const {email, password} = input;
                let verificacionCode = Math.floor(10000 + Math.random()*90000)
                const existeAdmin = await Admin.findOne({email})
                if(existeAdmin) {
                    throw new Error('El administrador ya esta registrado');
                }
                try {
                   
                    const mensaje =  await mailer(email, verificacionCode, process.env.CORREO_IMPERIOT, process.env.PASSWORDAPP_IMPERIOT )
                    console.log(mensaje)
                    input.code = verificacionCode
                    input.message = mensaje
                    return input
                } catch (error) {
                    console.log(error)
                }
        },
        autenticarAdmin: async (_, {input}, ctx) => {
                const {email, password} = input;

                //revisar si el usuario existe
                const existeAdmin = await Admin.findOne({email})
                console.log(existeAdmin)
                if(!existeAdmin) {
                    throw new Error('El Administrador no esta registrado');
                }
                const {nombre, apellido, nombreUsuario, sexo, id} = existeAdmin
               
                const user = {
                    nombre,
                    apellido,
                    nombreUsuario,
                    sexo,
                    id
                }
                //revisar si el password es correcto
                const passwordCorrecto = await bcrypt.compare(password, existeAdmin.password)
            

                if(!passwordCorrecto) {
                    throw new Error('password Incorrecto');
                }

                return {
                    user:user,
                    accessToken:{ token: crearTokenAdmin(existeAdmin, process.env.PALABRATOKEN, '50m')},
                    refreshToken: {token: crearTokenAdmin(existeAdmin, process.env.PALABRATOKEN, '1h' )}
                }
        },
        

        refreshAccessTokenAdmin: (parent, { refreshToken }) => {
            // Verificar el token de actualización (refresh token)
            try {
              const usuario = jwt.verify(refreshToken, process.env.PALABRATOKEN);
                console.log(usuario)
              // Generar un nuevo token de acceso
              const accessToken = crearTokenAdmin(usuario, process.env.PALABRATOKEN,'1h');
      
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
        
        
        editarUsuario: async (_,{ input}, ctx) => {

            if(!ctx.usuario){
                throw new GraphQLError('Admin No autenticado', {
                    extensions: { code: 'UNAUTHENTICATED'},
                });
            } 
            let usuario = await Admin.findById(ctx.usuario.id);

            if (!usuario){
                throw new Error('usuario no encontrado');
            }
            // Si la persona que edita es o no!!
            usuario = await Admin.findOneAndUpdate({_id:ctx.usuario.id}, input, {new:true})
            return usuario
        },

        nuevoEstablecimiento: async (_,{input, ubicacion}, ctx) => {
            console.log('desde relveres nuevi establecimieno', input)
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
            
                //almacenarlo en DB.
                const resultado = await establecimiento.save();
                
                return resultado
            } catch (error) {
                console.log(error)
            }
        },

        actualizarEstablecimiento: async (_,{id,  input, disponible, ubicacion}, ctx) => {
            //si la tarea existe o no
            
            console.log(ubicacion)
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
            
            // if(establecimiento.creador.toString() !== ctx.usuario.id){
            //     throw new Error('Establecimiento no Autenticado');
            // }
            input.disponible = disponible

            establecimiento = await Establecimiento.findOneAndUpdate({_id:id}, input, {new:true})
            // console.log('actualizar estab', establecimiento)
            return establecimiento

            // Guardar y retornar la tarea
        },

        eliminarEstablecimiento: async (_,{id}, ctx) => {
            //si la tarea existe o no
            let establecimiento = await Establecimiento.findById(id);
            
            if (!establecimiento){
                throw new Error('establecimiento no encontrada');
            }
            // Si la persona que edita es o no 
            
            if(establecimiento.creador.toString() !== ctx.usuario.id){
                throw new Error('No tienes las credenciales ');
            }

            await Establecimiento.findOneAndDelete({_id: id})
            return "cancha eliminada"
      },

      nuevaCancha: async (_,{establecimientoId,input}, ctx) => {
        console.log('nueva cancha-------------', input)
        if(!ctx.usuario){
            throw new GraphQLError('Cancha No autenticada', {
                extensions: { code: 'UNAUTHENTICATED'},
            });
        } 

        try {
            const cancha = new Cancha(input)
        // Asociar al creador
            cancha.establecimiento = establecimientoId
            cancha.creador = ctx.usuario.id
            
            console.log(cancha)
    
            //almacenarlo en DB.
            const resultado = await cancha.save();
            console.log("desde resultado", resultado)
        
            return resultado
            
            

        } catch (error) {
            console.log(error)
        }
    },
    actualizarCancha: async (_,{id,  input, disponible}, ctx) => {
            //si la tarea existe o no
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

            console.log(id)
            if(!ctx.usuario){
                throw new GraphQLError('Cancha No autenticada', {
                    extensions: { code: 'UNAUTHENTICATED'},
                });
            } 
            
        //si la tarea existe o no
            let cancha = await Cancha.findById(id);
                
            if (!cancha){
                throw new Error('Cancha no encontrada');
            }
            // Si la persona que edita es o no 
            
            if(cancha.creador.toString() !== ctx.usuario.id){
                throw new Error('No tienes las credenciales ');
            }
            await Cancha.findOneAndDelete({_id: id})
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

    actualizarReservaEstado: async (_,{id,  establecimiento, estado}, ctx) => {
        //si la tarea existe o no

        let reserva = await Reserva.findById(id);
    
        console.log(reserva)
        
        if (!reserva){
            throw new Error('reserva no encontrada');
        }
        // Si la persona que edita es o no 
        
        if(reserva.establecimiento.toString() !== establecimiento){
            throw new Error('No tienes las credenciales');
        }

        reserva = await Reserva.findOneAndUpdate({_id:id}, {estado}, {new:true})
         console.log('verificacion', reserva)
        return reserva

        // Guardar y retornar la tarea
    },
    

    nuevaAutoReserva: async (_,{ userId, input}, ctx) => {
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
      
 }, 
    MiEstablecimiento: {
        nuevo: (root) => {
            return root.descripcion
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
  


}