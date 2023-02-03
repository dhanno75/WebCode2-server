import nodemailer from "nodemailer";

// const mailOptions = {
//   from: "puppaladhananjay@gmail.com",
//   to: "zanoyofiti-8350@yopmail.com",
//   subject: "Nodemailer testing",
//   text: "Some gibberish words",
// };

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: "pdhananjay774@gmail.com",
//     pass: "uzwudcnotbyjmbzk",
//   },
//   port: 465,
//   host: "smtp.gmail.com",
// });

// transporter.sendMail(mailOptions, function (error, info) {
//   if (error) {
//     console.log(error);
//   } else {
//     console.log("Email sent: " + info.response);
//     // do something useful
//   }
// });

const sendEmail = async (options) => {
  // 1) Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // 2) Define the email options
  const mailOptions = {
    from: "Dhananjay P <pdhananjay@gmail.com>",
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html
  };

  // 3) Actually send the email with nodemailer
  await transporter.sendMail(mailOptions); // this is an asynchronous function here
};

export default sendEmail;
