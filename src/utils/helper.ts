import { BadRequestException } from '@nestjs/common';
import axios from 'axios';
import * as nodemailer from 'nodemailer';
import { WeekDay } from 'src/service/schema/service-availability.schema';

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

export const safeSendMail = async (
  to: string,
  subject: string,
  html: string,
): Promise<{ success: boolean; error?: any }> => {
  try {
    await sendMail(to, subject, html);
    return { success: true };
  } catch (error) {
    console.log('EMAIL FAILED:', error);

    return {
      success: false,
      error,
    };
  }
};

export const toSlug = (str: string): string => {
  return str
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_');
};
export const getWeekDay = (date: Date): WeekDay => {
  const days: WeekDay[] = [
    WeekDay.SUNDAY,
    WeekDay.MONDAY,
    WeekDay.TUESDAY,
    WeekDay.WEDNESDAY,
    WeekDay.THURSDAY,
    WeekDay.FRIDAY,
    WeekDay.SATURDAY,
  ];

  return days[date.getDay()];
}

export const toMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export const toTimeString = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  return `${h.toString().padStart(2, '0')}:${m
    .toString()
    .padStart(2, '0')}`;
}

export const calculateEndTime = (
  startTime: string,
  durationMinutes: number,
): string => {
  const [hours, minutes] = startTime.split(':').map(Number);

  const totalMinutes = hours * 60 + minutes + durationMinutes;

  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;

  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
};


export const geocodePincode = async (pincode: string): Promise<{ lat: number; lng: number }> => {
  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/geocode/json',
      {
        params: {
          address: pincode,
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
    );

    const location = response.data.results[0]?.geometry?.location;

    if (!location) {
      throw new BadRequestException('Invalid pincode');
    }

    return {
      lat: location.lat,
      lng: location.lng,
    };
  } catch (error) {
    throw new BadRequestException('Failed to fetch location');
  }
};