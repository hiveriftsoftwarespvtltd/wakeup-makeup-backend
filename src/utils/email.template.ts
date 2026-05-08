

export const verificationTemplate = (
  name: string,
  otp: string,
) => {
  return `
    <div style="font-family:Arial;padding:20px">
      <h2>Email Verification</h2>

      <p>Hello ${name},</p>

      <p>Your verification OTP is:</p>

      <div style="
        font-size:32px;
        font-weight:bold;
        color:#2563eb;
        letter-spacing:5px;
        margin:20px 0;
      ">
        ${otp}
      </div>

      <p>This OTP expires in 10 minutes.</p>
    </div>
  `;
};

export const loginOtpTemplate = (
  name: string,
  otp: string,
) => {
  return `
    <div style="font-family:Arial;padding:20px">
      <h2>Two Factor Authentication</h2>

      <p>Hello ${name},</p>

      <p>Your login OTP is:</p>

      <div style="
        font-size:32px;
        font-weight:bold;
        color:#16a34a;
        letter-spacing:5px;
        margin:20px 0;
      ">
        ${otp}
      </div>

      <p>This OTP expires in 5 minutes.</p>
    </div>
  `;
};

export const forgotPasswordTemplate = (
  name: string,
  otp: string,
) => {
  return `
    <div style="font-family:Arial;padding:20px">
      <h2>Reset Password OTP</h2>

      <p>Hello ${name},</p>

      <p>Your password reset OTP is:</p>

      <div style="
        font-size:32px;
        font-weight:bold;
        color:#dc2626;
        letter-spacing:5px;
        margin:20px 0;
      ">
        ${otp}
      </div>

      <p>This OTP expires in 10 minutes.</p>

      <p>If you did not request this, please ignore this email.</p>
    </div>
  `;
};