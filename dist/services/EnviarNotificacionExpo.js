import { Expo } from 'expo-server-sdk';
const enviarNotificacion = async (pushToken, body, data) => {
    // Crea un nuevo cliente Expo SDK
    const expo = new Expo();
    // Verifica si el token de notificación es válido
    if (!Expo.isExpoPushToken(pushToken)) {
        throw new Error(`El token de notificación ${pushToken} no es válido.`);
    }
    // Construye el mensaje de notificación
    const message = {
        to: pushToken,
        sound: 'default',
        body: body,
        data: data,
    };
    try {
        // Envía la notificación
        await expo.sendPushNotificationsAsync([message]);
    }
    catch (error) {
        throw new Error(`Error al enviar la notificación: ${error}`);
    }
};
export default enviarNotificacion;
