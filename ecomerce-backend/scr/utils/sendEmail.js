const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOtpEmail = async (to, otp) => {
  await transporter.sendMail({
    from: `"Aureye App" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Verify your email - OTP Code",
    html: `
      <h2>Your OTP is: ${otp}</h2>
      <p>This code expires in 1 minute.</p>
    `,
  });
};

module.exports = sendOtpEmail;