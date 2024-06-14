import Usuario from "../../models/Usuarios.js";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { GraphQLError } from "graphql";
import SmsTwilioSend from "../../services/SmsTwilio.js";
import { PubSub } from "graphql-subscriptions";
const pubsub = new PubSub();
const horaActual = new Date();
console.log(horaActual.getHours());
console.log(Date.now());
const crearTokenUsuario = (cliente, secreta, expiresIn) => {
    const { id, email, nombre } = cliente;
    return jwt.sign({ id, email, nombre }, secreta, { expiresIn });
};
export const UsuarioResolvers = {
    Query: {
        obtenerUsuario: async (_, {}, ctx) => {
            console.log('pasapor aquiiiiii');
            if (!ctx.usuario) {
                throw new GraphQLError('no Autenticado', {
                    extensions: { code: 'UNAUTHENTICATED' },
                });
            }
            const usuario = await Usuario.findById(ctx.usuario.id);
            console.log(usuario);
            return usuario;
        },
        encontrarUsuario: async (_, { UsuarioId }, ctx) => {
            console.log('obtenerrrrrrrrrrrrrr', UsuarioId);
            const usuario = await Usuario.findById(UsuarioId);
            return usuario;
        }
    },
    Mutation: {
        crearUsuario: async (_, { input }, ctx) => {
            const { nombreUsuario, password, telefono } = input;
            console.log('entrando input', nombreUsuario, password);
            const existeTelefonoUsuario = await Usuario.findOne({ telefono });
            if (existeTelefonoUsuario) {
                throw new Error('Ese numero ya esta registrado en otra cuenta');
            }
            const existeUsuario = await Usuario.findOne({ nombreUsuario });
            if (existeUsuario) {
                throw new Error('El Usuarioistrador ya esta registrado');
            }
            try {
                const salt = await bcrypt.genSalt(10);
                input.password = await bcrypt.hash(password, salt);
                // registrar nuevo ususario
                const NuevoUsuario = new Usuario(input);
                console.log(NuevoUsuario);
                NuevoUsuario.save();
                return "Usuario creado correctamente";
            }
            catch (error) {
                console.log(error);
            }
        },
        verificarNombreUsuario: async (_, { nombreUsuario }, ctx) => {
            console.log(nombreUsuario);
            const existeUsuario = await Usuario.findOne({ nombreUsuario });
            if (existeUsuario) {
                throw new Error('Ese nombre de usuario ya esta registrado');
            }
            return 'Nombre de usuario validado correctamente';
        },
        enviarCodeVerificacionUsuario: async (_, { telefono }, ctx) => {
            let verificacionCode = Math.floor(10000 + Math.random() * 90000);
            console.log('telefono,hhh', telefono);
            const existeUsuario = await Usuario.findOne({ telefono });
            if (!existeUsuario) {
                throw new Error('El Usuario no está registrado');
            }
            try {
                const mensaje = await SmsTwilioSend(telefono, `${verificacionCode} es tu codigo de verificacion`);
                console.log('mensaje pe', mensaje.status);
                if (mensaje.status === "queued") {
                    const usuario = await Usuario.findOneAndUpdate({ telefono }, { code_verificacion: verificacionCode }, { new: true });
                    if (usuario.code_verificacion === verificacionCode) {
                        return 'codigo enviado';
                    }
                    console.log('usuario ps', usuario);
                }
            }
            catch (error) {
                console.log('mensaje serio error', error);
                throw new Error(error);
            }
        },
        autenticarUsuario: async (_, { input, userType }, ctx) => {
            const { password, nombreUsuario } = input;
            console.log('tus credenciales son', nombreUsuario, password);
            const existeUsuario = await Usuario.findOne({ nombreUsuario });
            if (!existeUsuario) {
                throw new Error('El usuario no esta registrado');
            }
            let user = {};
            let userProfileType = null;
            if (!userType) {
                console.log('tus credenciales son', existeUsuario.esAdmin, existeUsuario.esCliente);
                if (existeUsuario.esAdmin && existeUsuario.esCliente) {
                    return {
                        mensaje: 'El usuario tiene ambos perfiles. Por favor, elija con cuál perfil desea autenticarse.',
                        opciones: ['CLIENTE', 'ADMIN'],
                    };
                }
                user = existeUsuario;
                userProfileType = 'CLIENTE';
            }
            else {
                console.log('el usuario envio un tipo de usuario', userType);
                if (userType === 'CLIENTE') {
                    const existeUsuario = await Usuario.findOne({ nombreUsuario });
                    user = existeUsuario;
                    userProfileType = 'CLIENTE';
                }
                else if (userType === 'ADMIN') {
                    const existeUsuario = await Usuario.findOne({ nombreUsuario });
                    user = existeUsuario;
                    userProfileType = 'ADMIN';
                }
                else {
                    throw new Error('El Usuario no está registrado');
                }
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
        },
        verificarUsuario: async (_, { code, telefono }, ctx) => {
            console.log('telefono, y codigo', telefono, code);
            const existeUsuario = await Usuario.findOne({ telefono });
            if (!existeUsuario) {
                throw new Error('El Usuario no está registrado');
            }
            if (existeUsuario.code_verificacion === code) {
                await Usuario.findOneAndUpdate({ telefono }, { estado: 'verificado' }, { new: true });
                return 'correcto';
            }
            else {
                return 'incorrecto';
            }
        },
        restaurarPasswordUsuario: async (_, { input }, ctx) => {
            const { email, password, telefono } = input;
            const usuario = await Usuario.findOne({ telefono });
            if (!usuario) {
                throw new Error('Ese Usuario no existe');
            }
            try {
                //Hashear Password
                const salt = await bcrypt.genSalt(10);
                const passwordNew = await bcrypt.hash(password, salt);
                await Usuario.findOneAndUpdate({ telefono }, { password: passwordNew }, { new: true });
                return "Contraseña restablecida correctamente";
            }
            catch (error) {
                console.log(error);
            }
        },
        refreshAccessTokenUsuario: (parent, { refreshToken }) => {
            // Verificar el token de actualización (refresh token)
            try {
                const usuario = jwt.verify(refreshToken, process.env.PALABRATOKEN);
                console.log(usuario);
                // Generar un nuevo token de acceso
                const accessToken = crearTokenUsuario(usuario, process.env.PALABRATOKEN, '17h');
                return { token: accessToken };
            }
            catch (error) {
                throw new Error('Token de actualización inválido');
            }
        },
        verificarAutenticacion: (_, { input }, ctx) => {
            if (!ctx.usuario) {
                throw new GraphQLError('Usuario No autenticado', {
                    extensions: { code: 'UNAUTHENTICATED' },
                });
            }
            return true;
        },
        editarUsuario: async (_, { input }, ctx) => {
            console.log('ES LO QUE ESTA ENTRANDO', input);
            if (!ctx.usuario) {
                throw new GraphQLError('Usuario No autenticado', {
                    extensions: { code: 'UNAUTHENTICATED' },
                });
            }
            let usuario = await Usuario.findById(ctx.usuario.id);
            if (!usuario) {
                throw new Error('usuario no encontrado');
            }
            // Si la persona que edita es o no!!
            usuario = await Usuario.findOneAndUpdate({ _id: ctx.usuario.id }, input, { new: true });
            return usuario;
        },
        editarPeloteroUsuario: async (_, { input }, ctx) => {
            if (!ctx.usuario) {
                throw new GraphQLError('Usuario No autenticado', {
                    extensions: { code: 'UNAUTHENTICATED' },
                });
            }
            console.log('pelotero', input);
            let usuario = await Usuario.findById(ctx.usuario.id);
            if (!usuario) {
                throw new Error('usuario no encontrado');
            }
            // Si la persona que edita es o no!!
            usuario = await Usuario.findOneAndUpdate({ _id: ctx.usuario.id }, { pelotero: input }, { new: true });
            console.log('editarrrr Usuario', usuario);
            return usuario;
        },
        editarFotoUsuario: async (_, { foto }, ctx) => {
            console.log('foto', foto);
            let usuario = await Usuario.findById(ctx.usuario.id);
            if (!usuario) {
                throw new Error('usuario no encontrado');
            }
            // Si la persona que edita es o no!!
            usuario = await Usuario.findOneAndUpdate({ _id: ctx.usuario.id }, { foto }, { new: true });
            console.log('editarrrr Usuario', usuario);
            return usuario.foto;
        },
        actualizarTokenNotificaciones: async (_, { token }, ctx) => {
            if (!ctx.usuario) {
                throw new GraphQLError('Usuario No autenticado', {
                    extensions: { code: 'UNAUTHENTICATED' },
                });
            }
            let usuario = await Usuario.findById(ctx.usuario.id);
            console.log('USUARIO', usuario);
            if (!usuario) {
                throw new Error('usuario no encontrado');
            }
            // Si la persona que edita es o no!!
            usuario = await Usuario.findOneAndUpdate({ _id: ctx.usuario.id }, { notificaciones_token: token }, { new: true });
            return 'Token de notificacion actualizado correctamente';
        },
    },
    Subscription: {
        cambioEstadoMiReservacion: {
            subscribe: (_, { UsuarioId }) => {
                console.log('subsribiendo00 a', `RESERVAS_DE_${UsuarioId}`);
                return pubsub.asyncIterator(`RESERVAS_DE_${UsuarioId}`);
            }
            //    return context.pubsub.asyncIterator(`NUEVA_NOTIFICACION_${hotelId}`);
        }
    },
};
