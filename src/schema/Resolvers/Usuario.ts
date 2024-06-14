import Establecimiento from "../../models/Establecimientos.js";
import Cliente from "../../models/Clientes.js";
import Cancha from "../../models/Canchas.js";
import Usuario from "../../models/Usuarios.js";
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


const crearTokenUsuario = (Usuario, secreta, expiresIn) => {
    const {id, email, nombre} = Usuario
    return jwt.sign({id,email, nombre}, secreta, { expiresIn})
}
const horaActual = new Date()
console.log(horaActual.getHours())
console.log(Date.now())


export const UsuarioResolvers = {

    Query: {

        obtenerUsuarioUsuario: async (_, {}, ctx) => {
            console.log('pasapor aquiiiiii')

            if(!ctx.usuario){
                throw new GraphQLError('no Autenticado', {
                    extensions: { code: 'UNAUTHENTICATED'},
                });
            }


            const usuario =  await Usuario.findById(ctx.usuario.id)
            console.log(usuario)

            return usuario;
        },

       
        encontrarCliente: async (_, {clienteId}, ctx) => {
            console.log('obtenerrrrrrrrrrrrrr', clienteId)
            const cliente =  await Cliente.findById(clienteId)
            return cliente;
        }

    },
    Mutation:{
        crearUsuario: async (_, {input}, ctx) => {
                const {telefono, password} = input;
                // const existeCliente = await Cliente.findOne({telefono})
                // if(existeCliente) {
                //     throw new Error('Ese numero ya esta registrado como usuario');
                // }
                const existeUsuario = await Usuario.findOne({telefono})
                if(existeUsuario) {
                    throw new Error('El Usuarioistrador ya esta registrado');
                }
                try {

                    const salt = await bcrypt.genSalt(10);
                    input.password = await bcrypt.hash(password, salt)
                    // registrar nuevo ususario
                    const NuevoUsuario = new Usuario(input);
                    console.log(NuevoUsuario)
                    NuevoUsuario.save()
                    return "Usuarioistrador creado correctamente"
                } catch (error) {
                    console.log(error)
                }
        },
        enviarCodeVerificacionUsuario: async (_, {telefono}, ctx) => {
            let verificacionCode = Math.floor(10000 + Math.random()*90000)
            console.log('telefono,hhh', telefono)
            const existeUsuario = await Usuario.findOne({telefono})
            if(!existeUsuario) {
                throw new Error('El Usuario no está registrado');
            }
            try {
                const mensaje = await SmsTwilioSend(telefono, `${verificacionCode} es tu codigo de verificacion` )
                console.log('mensaje pe', mensaje.status)
                if(mensaje.status === "queued"){
                    const usuario = await Usuario.findOneAndUpdate({telefono}, {code_verificacion: verificacionCode}, {new:true})
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

        verificarUsuario: async (_, {code, telefono}, ctx) => {
            console.log('telefono, y codigo', telefono, code)
            const existeUsuario = await Usuario.findOne({telefono})
            if(!existeUsuario) {
                throw new Error('El Usuario no está registrado');
            }
            if(existeUsuario.code_verificacion === code){
                await Usuario.findOneAndUpdate({telefono}, {estado: 'verificado'}, {new:true})
                    return 'correcto'
            }else {
                return 'incorrecto'
            }
        },

        restaurarPasswordUsuario: async (_,{input}, ctx) => {
            const {email, password, telefono} = input;
                const usuario = await Usuario.findOne({telefono})
                if(!usuario) {
                    throw new Error('Ese Usuario no existe');
                }
                try {
                    //Hashear Password
                    const salt = await bcrypt.genSalt(10);
                    const passwordNew = await bcrypt.hash(password, salt)
                     await Usuario.findOneAndUpdate({telefono}, {password: passwordNew}, {new:true})
            
                     return "Contraseña restablecida correctamente"
                } catch (error) {
                    console.log(error)
                }
        },
        autenticarUsuario: async (_, {input}, ctx) => {
                const {telefono, password} = input;

                //revisar si el usuario existe
                const existeUsuario = await Usuario.findOne({telefono})
                console.log('admiiiin', existeUsuario)
                if(!existeUsuario) {
                    throw new Error('El Usuarioistrador no esta registrado');
                }
                const {nombre, apellido, nombreUsuario, sexo, id, email} = existeUsuario

                const user = existeUsuario
                //revisar si el password es correcto
                const passwordCorrecto = await bcrypt.compare(password, existeUsuario.password)


                if(!passwordCorrecto) {
                    throw new Error('password Incorrecto');
                }

                return {
                    user:user,
                    accessToken:{ token: crearTokenUsuario(existeUsuario, process.env.PALABRATOKEN, '17h')},
                    refreshToken: {token: crearTokenUsuario(existeUsuario, process.env.PALABRATOKEN, '7d' )}
                }
        },


        refreshAccessTokenUsuario: (parent, { refreshToken }) => {
            // Verificar el token de actualización (refresh token)
            try {
              const usuario = jwt.verify(refreshToken, process.env.PALABRATOKEN);
                console.log(usuario)
              // Generar un nuevo token de acceso
              const accessToken = crearTokenUsuario(usuario, process.env.PALABRATOKEN,'17h');

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
                throw new GraphQLError('Usuario No autenticado', {
                    extensions: { code: 'UNAUTHENTICATED'},
                });
            }
            let usuario = await Usuario.findById(ctx.usuario.id);

            if (!usuario){
                throw new Error('usuario no encontrado');
            }
            // Si la persona que edita es o no!!
            usuario = await Usuario.findOneAndUpdate({_id:ctx.usuario.id}, input, {new:true})
            return usuario
        },
        editarFotoUsuario: async (_,{foto}, ctx) => {
         
            console.log('foto', foto)
            let usuario = await Usuario.findById(ctx.usuario.id);

            if (!usuario){
                throw new Error('usuario no encontrado');
            }
            // Si la persona que edita es o no!!
            usuario = await Usuario.findOneAndUpdate({_id:ctx.usuario.id}, {foto}, {new:true})
            console.log('editarrrr cliente', usuario)
            
            return usuario.foto
        },
        actualizarTokenNotificaciones: async (_,{token}, ctx) => {

            if(!ctx.usuario){
                throw new GraphQLError('Usuario No autenticado', {
                    extensions: { code: 'UNAUTHENTICATED'},
                });
            }
            let usuario = await Usuario.findById(ctx.usuario.id);

            console.log('USUARIO' , usuario)

            if (!usuario){
                throw new Error('usuario no encontrado');
            }
            // Si la persona que edita es o no!!
            usuario = await Usuario.findOneAndUpdate({_id:ctx.usuario.id},{notificaciones_token:token}, {new:true})
            return usuario
        },
       
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