import * as nodemailer from 'nodemailer';

export const generateOTP = (): string => {
  return Math.floor(
    100000 + Math.random() * 900000,
  ).toString();
};

export const sendMail = async (
  to: string,
  subject: string,
  html: string,
) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  return transporter.sendMail({
    from: process.env.GMAIL_USER,
    to,
    subject,
    html,
  });
};