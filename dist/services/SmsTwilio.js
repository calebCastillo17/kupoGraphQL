import pkg from 'twilio';
import dotenv from 'dotenv';
dotenv.config();
const { Twilio } = pkg;
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
async function SmsTwilioSend(myNumber, message) {
    if (accountSid && authToken && myNumber && twilioNumber) {
        const client = new Twilio(accountSid, authToken);
        try {
            const respuesta = await client.messages.create({
                from: twilioNumber,
                to: myNumber,
                body: message
            });
            // console.log('respuesta de twilio' , respuesta)
            return respuesta;
        }
        catch (error) {
            throw error;
        }
    }
    else {
        console.error("You are missing one of the variables you need to send a message");
    }
}
export default SmsTwilioSend;
