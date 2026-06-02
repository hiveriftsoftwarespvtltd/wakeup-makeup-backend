import { BadRequestException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export const generateOTP = (): string => {
  return Math.floor(
    100000 + Math.random() * 900000,
  ).toString();
};

// create transporter once

export const sendMail = async (
  to: string,
  subject: string,
  html: string,
): Promise<boolean> => {
  try {
    const transporter = nodemailer.createTransport({
  service: 'gmail',

  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});


    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject,
      html,
    });

    return true;
  } catch (error) {
    console.log('MAIL ERROR:', error);

    throw new BadRequestException(
      'Unable to send email at the moment. Please try again later.',
    );
  }
};

export const toSlug = (str: string): string => {
  return str
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_');
};