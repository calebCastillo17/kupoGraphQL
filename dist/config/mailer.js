import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();
const usuario = process.env.CORREO_IMPERIOT;
const password = process.env.PASSWORDAPP_IMPERIOT;
async function mailer(email, code) {
    try {
        // Create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: usuario,
                pass: password, // generated ethereal password
            },
            tls: {
                rejectUnauthorized: false,
            },
        });
        // Send mail with defined transport object
        let info = await transporter.sendMail({
            from: '"Altoque 👻" <imperiot.cupo@gmail.com>',
            to: `${email}`,
            subject: "Hola Socio ✔",
            text: `Tu código de verificación es ${code}`,
            html: `<b>Tu código de verificación es ${code}</b>`, // HTML body
        });
        console.log("Message sent: %s", info.messageId);
        // Log preview URL only if using Ethereal account
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        return { success: true, message: `Mensaje enviado a ${email}` };
    }
    catch (error) {
        console.error("Error sending email: ", error);
        throw error;
    }
}
export default mailer;
