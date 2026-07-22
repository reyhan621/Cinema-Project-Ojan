const nodemailer = require("nodemailer");

let cachedTransport;

const getTransport = async () => {
  if (cachedTransport) return cachedTransport;
  if (process.env.SMTP_HOST) {
    cachedTransport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  } else {
    // Dev fallback: Ethereal test inbox. Each message gets a preview URL (logged).
    const testAccount = await nodemailer.createTestAccount();
    cachedTransport = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  }
  return cachedTransport;
};

const sendMail = async ({ to, subject, text }) => {
  // No real email in tests — the flow relies on `devCode` in the API response.
  if (process.env.NODE_ENV === "test") return { messageId: "test", previewUrl: null };
  const transport = await getTransport();
  const info = await transport.sendMail({
    from: process.env.EMAIL_FROM || "Cinema Booking <no-reply@cinema.local>",
    to,
    subject,
    text,
  });
  const previewUrl = nodemailer.getTestMessageUrl(info) || null;
  if (previewUrl) console.log("📧 Email preview:", previewUrl);
  return { messageId: info.messageId, previewUrl };
};

const sendVerificationCode = (to, code) =>
  sendMail({
    to,
    subject: "Verify your email",
    text: `Your verification code is ${code}. It expires in 10 minutes.`,
  });

const sendResetCode = (to, code) =>
  sendMail({
    to,
    subject: "Reset your password",
    text: `Your password reset code is ${code}. It expires in 10 minutes.`,
  });

module.exports = { sendMail, sendVerificationCode, sendResetCode, getTransport };
