import Cliente from "../../models/Clientes.js";
import Admin from "../../models/Admins.js";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { GraphQLError } from "graphql";
import SmsTwilioSend from "../../services/SmsTwilio.js";
import { PubSub } from "graphql-subscriptions";
import mailer from "../../config/mailer.js";


const pubsub = new PubSub()
const crearTokenUsuario = (Usuario, secreta, expiresIn) => {
    const {id, email, nombre} = Usuario
    return jwt.sign({id,email, nombre}, secreta, { expiresIn})
}
const crearTokenCliente = (cliente, secreta, expiresIn) => {
    const {id, email, nombre} = cliente
    return jwt.sign({id,email, nombre}, secreta, { expiresIn})
}


const crearTokenAdmin = (admin, secreta, expiresIn) => {
    const {id, email, nombre} = admin
    return jwt.sign({id,email, nombre}, secreta, { expiresIn})
}
const horaActual = new Date()
console.log(horaActual.getHours())
console.log(Date.now())

const verificarNombreUsuario = async (nombreUsuario) => {
    const regex = new RegExp(`^${nombreUsuario}$`, 'i'); // Crear una expresión regular insensible a mayúsculas/minúsculas
    const existeCliente = await Cliente.findOne({ nombreUsuario: regex });
    const existeAdmin = await Admin.findOne({ nombreUsuario: regex });

    if (existeCliente && existeAdmin) {
        return 'AMBOS';
    }
    if (existeCliente) {
        return 'CLIENTE';
    } else if (existeAdmin) {
        return 'ADMIN';
    } else {
        return 'NINGUNO';
    }
};

export const UsuarioResolvers = {

    Query: {
/////////////////////////ADMIIIIIN/////////////////////////
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
        encontrarCliente: async (_, {clienteId}, ctx) => {
            console.log('obtenerrrrrrrrrrrrrr', clienteId)
            const cliente =  await Cliente.findById(clienteId)
            return cliente;
        }
    },

    Mutation:{
        verificarNombreUsuario: async (_, { nombreUsuario }, ctx) => {
            console.log('este es el nombre de Usuario a verificar', nombreUsuario);
            try {
                const regex = new RegExp(`^${nombreUsuario}$`, 'i'); // Crear una expresión regular insensible a mayúsculas/minúsculas
        
                const existeCliente = await Cliente.findOne({ nombreUsuario: regex });
                const existeAdmin = await Admin.findOne({ nombreUsuario: regex });
        
                if (existeCliente && existeAdmin) {
                    return 'AMBOS';
                }
                if (existeCliente) {
                    return 'CLIENTE';
                } else if (existeAdmin) {
                    return 'ADMIN';
                } else {
                    return 'NINGUNO';
                }
            } catch (error) {
                throw error;
            }
        },

        autenticarUsuario : async (_, { input, userType }, ctx) => {
            const { password, nombreUsuario } = input;
            console.log('tus credenciales son', nombreUsuario, password);
            const regex = new RegExp(`^${nombreUsuario}$`, 'i'); // Crear una expresión regular insensible a mayúsculas/minúsculas
            try {
                    let user:any = {};
                let userProfileType = null;
                console.log('el usuario envio un tipo de usuario', userType)
                if (userType === 'CLIENTE' ){
                    const existeCliente = await Cliente.findOne({ nombreUsuario: regex });
                    user = existeCliente
                    userProfileType = 'CLIENTE';
                } else if (userType === 'ADMIN' ){
                    const existeAdmin = await Admin.findOne({ nombreUsuario: regex });
                    user = existeAdmin
                    userProfileType = 'ADMIN';
                }else {
                    throw new Error('El Usuario no existe');
                }
                // Revisar si el password es correcto
                const passwordCorrecto = await bcrypt.compare(password, user.password);
                if (!passwordCorrecto) {
                    throw new Error('Password incorrecto');
                }

                console.log('Usuario autenticado:', user);
                return {
                    user,
                    userType: userProfileType,
                    accessToken: { token: crearTokenUsuario(user, process.env.PALABRATOKEN, '17h') },
                    refreshToken: { token: crearTokenUsuario(user, process.env.PALABRATOKEN, '7d') },
                };
            } catch (error) {
                    throw error
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

        //////////ADMIN//////////////////////////////////////////
        crearAdmin: async (_, {input}, ctx) => {
            const {telefono, password, email} = input;
            console.log('este es el input0',input)
            
            const existeAdmin2 = await Admin.findOne({email})
            if(existeAdmin2 ) {
                throw new Error('Ya hay alguien registrado con ese correo');
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
                throw new Error('Error al crear Administrador');

            }
        }   ,

        enviarCodeVerificacionAdmin: async (_, {email}, ctx) => {
            let verificacionCode = Math.floor(10000 + Math.random()*90000)
            console.log('correo,hhh', email)
            const existeAdmin = await Admin.findOne({email})
            if(!existeAdmin) {
                throw new Error('El Usuario no está registrado');
            }
            try {
                const resultado = await mailer(email, verificacionCode);
                if(resultado.success ){
                    const usuario = await Admin.findOneAndUpdate({email}, {code_verificacion: verificacionCode}, {new:true})
                    if (usuario.code_verificacion === verificacionCode){
                        return `codigo enviado a ${email}, tu nombre de usuario es ${existeAdmin.nombreUsuario} `
                    }
                console.log('usuario ps',usuario)
                } 
            } catch (error) {
                console.log('mensaje serio error', error)
                throw new Error(error);

            }
        },
        
        verificarAdmin: async (_, {code, email}, ctx) => {
            console.log('telefono, y codigo', email, code)
            const existeAdmin = await Admin.findOne({email})
            if(!existeAdmin) {
                throw new Error('El Usuario no está registrado');
            }
            if(existeAdmin.code_verificacion === code){
                await Admin.findOneAndUpdate({email}, {estado: 'verificado'}, {new:true})
                    return 'correcto'
            }else {
                return 'incorrecto'
            }
        },

        restaurarPasswordAdmin: async (_,{input}, ctx) => {
            const {email, password} = input;
                const usuario = await Admin.findOne({email})
                if(!usuario) {
                    throw new Error('Ese Usuario no existe');
                }
                try {
                    //Hashear Password
                    const salt = await bcrypt.genSalt(10);
                    const passwordNew = await bcrypt.hash(password, salt)
                     await Admin.findOneAndUpdate({email}, {password: passwordNew}, {new:true})
            
                     return "Contraseña restablecida correctamente"
                } catch (error) {
                    console.log(error)
                        throw new Error('error ');

                }
        },

        refreshAccessTokenAdmin: (parent, { refreshToken }) => {
            // Verificar el token de actualización (refresh token)
            try {
              const usuario = jwt.verify(refreshToken, process.env.PALABRATOKEN);
                console.log(usuario)
              // Generar un nuevo token de acceso
              const accessToken = crearTokenAdmin(usuario, process.env.PALABRATOKEN,'17h');

              return { token: accessToken};
            } catch (error) {
              throw new Error('Token de actualización inválido');
            }
        },

       

        editarUsuario: async (_,{ input }, ctx) => {
            if (!ctx.usuario) {
                throw new GraphQLError('Admin No autenticado', {
                    extensions: { code: 'UNAUTHENTICATED' },
                });
            }
            let usuario = await Admin.findById(ctx.usuario.id);

            const { nombreUsuario } = input;
            if (nombreUsuario) {
                const resultado = await verificarNombreUsuario(nombreUsuario);
                if (resultado !== 'NINGUNO') {
                    throw new Error(`El nombre de usuario ${nombreUsuario} ya está en uso como ${resultado}`);
                }
            }

            if (!usuario) {
                throw new Error('usuario no encontrado');
            }

            usuario = await Admin.findOneAndUpdate({ _id: ctx.usuario.id }, input, { new: true });
            return usuario;
        },

        editarFotoAdmin: async (_,{foto}, ctx) => {
         
            console.log('foto', foto)
            let usuario = await Admin.findById(ctx.usuario.id);

            if (!usuario){
                throw new Error('usuario no encontrado');
            }
            // Si la persona que edita es o no!!
            usuario = await Admin.findOneAndUpdate({_id:ctx.usuario.id}, {foto}, {new:true})
            console.log('editarrrr cliente', usuario)
            
            return usuario.foto
        },
        actualizarTokenNotificaciones: async (_, { token }, ctx) => {
            console.log('token notificacion admin', token)
            if (!ctx.usuario) {
                throw new GraphQLError('Admin No autenticado', {
                    extensions: { code: 'UNAUTHENTICATED' },
                });
            }
            let usuario = await Admin.findById(ctx.usuario.id);
            console.log('USUARIO para actualizar', usuario);
            if (!usuario) {
                throw new Error('Usuario no encontrado');
            }
            if (!usuario.notificaciones_token.includes(token)) {
                usuario.notificaciones_token.push(token);
                usuario = await usuario.save();
            }
            return usuario;
        },
        eliminarTokenNotificaciones: async (_, { token , userId}, ctx) => {
            console.log('eliminando token not', token, userId)
            let usuario = await Admin.findById(userId);
            if (!usuario) {
                throw new Error('Usuario no encontrado');
            }

            try {
                const tokenIndex = usuario.notificaciones_token.indexOf(token);
                if (tokenIndex !== -1) {
                    // Eliminar el token del array
                    usuario.notificaciones_token.splice(tokenIndex, 1);
                    // Guardar los cambios
                    usuario = await usuario.save();
                }
                return "Token de Actualizacion Eliminado";
            } catch (error) {
                throw new Error('Error al eliminar token')
            }
          
        },








        /////////////////////////CLIENTE/////////////////////////////////
        crearCliente: async (_, {input}, ctx) => {
            console.log(input)
                const {email, password, telefono} = input;
                console.log('este es el input', input)
                
                const existeCliente2 = await Cliente.findOne({email})

                if(existeCliente2 ) {
                    throw new Error('Ya hay alguien registrado con ese correo');
                }
                // const existeAdmin = await Admin.findOne({telefono})
                // if(existeAdmin) {
                //     throw new Error('Ese numero ya esta registrado como administrador');
                // }
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

        enviarCodeVerificacionCliente: async (_, {email}, ctx) => {
            let verificacionCode = Math.floor(10000 + Math.random()*90000)
            console.log('telefono,hhh', email)
            const existeClient = await Cliente.findOne({email})
            if(!existeClient) {
                throw new Error('El Usuario no está registrado');
            }
            try {
                // const mensaje = await SmsTwilioSend(email, `${verificacionCode} es tu codigo de verificacion` )
                // console.log('mensaje pe', mensaje.status)
                // if(mensaje.status === "queued"){
                //     const usuario = await Cliente.findOneAndUpdate({email}, {code_verificacion: verificacionCode}, {new:true})
                //     if (usuario.code_verificacion === verificacionCode){
                //         return 'codigo enviado'
                //     }
                // console.log('usuario ps',usuario)
                const resultado = await mailer(email, verificacionCode);
                if(resultado.success ){
                    const usuario = await Cliente.findOneAndUpdate({email}, {code_verificacion: verificacionCode}, {new:true})
                    if (usuario.code_verificacion === verificacionCode){
                       return `codigo enviado a ${email}, tu nombre de usuario es ${existeClient.nombreUsuario} `
                    }
                console.log('usuario ps',usuario)
                } 
            } catch (error) {
                console.log('mensaje serio error', error)
                throw new Error(error);

            }
           
        },
    
        verificarCliente: async (_, {code, email}, ctx) => {
            console.log('email, y codigo', email, code)
            const existeAdmin = await Cliente.findOne({email})
            if(!existeAdmin) {
                throw new Error('El Usuario no está registrado');
            }

            if(existeAdmin.code_verificacion === code){
                await Cliente.findOneAndUpdate({email}, {estado: 'verificado'}, {new:true})
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
              const accessToken = crearTokenCliente(usuario, process.env.PALABRATOKEN,'17h');

              return { token: accessToken};
            } catch (error) {
              throw new Error('Token de actualización inválido');
            }
          },


         restaurarPassword: async (_,{input}, ctx) => {
                const {email, password, telefono} = input;
                console.log(password, telefono)
                const existeClient = await Cliente.findOne({email})
                if(!existeClient) {
                    throw new Error('El Usuario no está registrado');
                }
                try {
                    const salt = await bcrypt.genSalt(10);
                    const passwordNew= await bcrypt.hash(password, salt)
                     await Cliente.findOneAndUpdate({email}, {password: passwordNew}, {new:true})
                     return "Contraseña restablecida correctamente"
                } catch (error) {
                    console.log(error)
                }
        },


         editarUsuarioCliente: async (_,{ input }, ctx) => {
            if (!ctx.usuario) {
                throw new GraphQLError('Usuario No autenticado', {
                    extensions: { code: 'UNAUTHENTICATED' },
                });
            }

            const { nombreUsuario } = input;
            if (nombreUsuario) {
                const resultado = await verificarNombreUsuario(nombreUsuario);
                if (resultado !== 'NINGUNO') {
                    throw new Error(`El nombre de usuario ${nombreUsuario} ya está en uso como ${resultado}`);
                }
            }

            let usuario = await Cliente.findById(ctx.usuario.id);
            if (!usuario) {
                throw new Error('usuario no encontrado');
            }

            usuario = await Cliente.findOneAndUpdate({ _id: ctx.usuario.id }, input, { new: true });
            return usuario;
        },
        editarPeloteroCliente: async (_,{ input}, ctx) => {
            if(!ctx.usuario){
                throw new GraphQLError('Usuario No autenticado', {
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


         actualizarTokenNotificacionesCliente: async (_, { token }, ctx) => {
            if (!ctx.usuario) {
                throw new GraphQLError('Cliente No autenticado', {
                    extensions: { code: 'UNAUTHENTICATED' },
                });
            }
            let usuario = await Cliente.findById(ctx.usuario.id);
            if (!usuario) {
                throw new Error('Usuario cliente no encontrado');
            }
            // Verificar si el token ya existe en el array
            if (!usuario.notificaciones_token.includes(token)) {
                usuario.notificaciones_token.push(token);
                usuario = await usuario.save();
            }
            return usuario;
        },

        eliminarTokenNotificacionesCliente: async (_, { token, userId }, ctx) => {
            console.log('eliminando token not', token, userId)
            let usuario = await Cliente.findById(userId);
            if (!usuario) {
                throw new Error('Usuario cliente no encontrado');
            }
            // Verificar si el token existe en el array
            try {
                const tokenIndex = usuario.notificaciones_token.indexOf(token);
                if (tokenIndex !== -1) {
                    usuario.notificaciones_token.splice(tokenIndex, 1);
                    usuario = await usuario.save();
                }
                return "Token de Actualizacion Eliminado";
            } catch (error) {
                throw new Error('Error al eliminar token')
            }
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