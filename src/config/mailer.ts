import nodemailer from 'nodemailer';




async function mailer(email, code, user, pass) {

  
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      tls:{
          rejectUnauthorized:false
      },
      secure: true, // true for 465, false for other ports
      auth: {
        user: user, // generated ethereal user
        pass: pass, // generated ethereal password
      },
    });
  
    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: '"Kupo12 👻" <imperiot.cupo@gmail.com>', // sender address
      to: `${email}`, // list of receivers
      subject: "Hola Socio ✔", // Subject line
      text: `<b>Tu codigo de verificacion es ${code}</b>`, // plain text body
      html: `<b>Tu codigo de verificacion es ${code}</b>`, // html body
    });
  
    console.log("Message sent: %s", info.messageId);
     
    
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
  
    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    return `Mensaje enviado a ${email}`
  }
  
  // main().catch(console.error);
  export default mailer