import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotAcceptableException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcryptjs';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserRole } from 'src/user/schema/user.schema';
import { Model, Types } from 'mongoose';
import { RegisterDTO } from './dto/register.dto';
import { ApiResponse } from 'src/common/responses/api-response';
import { LoginDTO } from './dto/login.dto';
import {
  forgotPasswordTemplate,
  loginOtpTemplate,
  verificationTemplate,
} from 'src/utils/email.template';
import { generateOTP, sendMail } from 'src/utils/helper';
import { VerifyEmailDTO } from './dto/verify-email.dto';
import { VerifyLoginDTO } from './dto/verify-login.dto';
import { ResetPasswordDTO } from './dto/reset-password.dto';
import { ForgotPasswordOTPDTO } from './dto/verify-forgot-password-otp.dto';
import { Vendor } from 'src/vendor/schema/vendor.schema';
import { ServiceProvider } from 'src/service/schema/service-provider.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Vendor.name) private vendorModel: Model<Vendor>,
    @InjectModel(ServiceProvider.name) private serviceProviderModel: Model<ServiceProvider>,
    private userService: UserService,
    private jwtService: JwtService,
  ) { }

  async register(dto: RegisterDTO) {
    const existingUser = await this.userModel.findOne({
      email: dto.email.toLowerCase(),
    });

    // block restricted roles
    if (dto.role) {
      if (
        [UserRole.ADMIN, UserRole.INFLUENCER, UserRole.DISTRIBUTOR].includes(
          dto.role,
        )
      ) {
        throw new BadRequestException(
          `You are not authorized to create ${dto.role} account`,
        );
      }
    }

    // verified user already exists
    if (
      existingUser &&
      !existingUser.isDeleted &&
      existingUser.isEmailVerified
    ) {
      throw new BadRequestException('Email already exists');
    }

    // generate otp
    const otp = generateOTP();

    // expiry
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // resend otp if email not verified
    if (
      existingUser &&
      !existingUser.isDeleted &&
      !existingUser.isEmailVerified
    ) {
      existingUser.otp = otp;
      existingUser.otpExpiresAt = otpExpiresAt;

      await existingUser.save();

      await sendMail(
        existingUser.email,
        'Verify Your Email',
        verificationTemplate(existingUser.name, otp),
      );

      return ApiResponse.success(
        'Verification OTP sent to your email',
        otp,
        200,
      );
    }

    // hash password only when needed
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // restore deleted user
    if (existingUser && existingUser.isDeleted) {
      existingUser.name = dto.name;
      existingUser.password = hashedPassword;
      if (existingUser.phone) {
        existingUser.phone = dto.phone;
      }
      if (dto.role) {
        existingUser.role = dto.role;
      }

      existingUser.otp = otp;
      existingUser.otpExpiresAt = otpExpiresAt;

      existingUser.isDeleted = false;
      existingUser.isEmailVerified = false;

      existingUser.isActive = dto.role === UserRole.VENDOR ? false : true;

      await existingUser.save();

      await sendMail(
        existingUser.email,
        'Verify Your Email',
        verificationTemplate(existingUser.name, otp),
      );

      return ApiResponse.success(
        'Registration successful. OTP sent to email',
        otp,
        201,
      );
    }

    // new user creation
    const user = await this.userModel.create({
      ...dto,
      email: dto.email.toLowerCase(),
      password: hashedPassword,
      otp,
      otpExpiresAt,
      isEmailVerified: false,
      isActive: true,
    });

    await sendMail(
      user.email,
      'Verify Your Email',
      verificationTemplate(user.name, otp),
    );

    return ApiResponse.success(
      'Registration successful. OTP sent to email',
      otp,
      201,
    );
  }

  async sendVerifyEmailOTP(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('User Not Found');
    }

    if (user.isEmailVerified) {
      throw new ConflictException('This email is already verified');
    }

    const otp = generateOTP();

    // expiry
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;

    await user.save();
    await sendMail(
      email,
      'Verify Your Email',
      verificationTemplate(user.name, otp),
    );
    return ApiResponse.success(
      'Verification OTP successfully sent on your mail',
      otp,
    );
  }

  async verifyEmail(dto: VerifyEmailDTO) {
    const user = await this.userModel.findOne({
      email: dto.email.toLowerCase(),
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    if (user.otp !== dto.otp) {
      throw new BadRequestException('Invalid OTP');
    }

    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      throw new BadRequestException('OTP expired');
    }

    user.isEmailVerified = true;

    user.otp = undefined;
    user.otpExpiresAt = undefined;

    await user.save();

    return ApiResponse.success('Email verified successfully', null, 200);
  }

  async login(dto: LoginDTO) {
    const user = await this.userModel.findOne({
      email: dto.email.toLowerCase(),
    });

    if (!user) {
      throw new UnauthorizedException('Invalid Credentials');
    }

    if (!user.password) {
      throw new UnauthorizedException('Login with Google');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email first');
    }

    if (!user.isActive) {
      throw new NotAcceptableException('Your account is not active');
    }

    if (user.role === UserRole.VENDOR) {
      const vendor = await this.vendorModel.findOne({ ownerId: user._id });

      if (vendor?.status === 'PENDING') {
        throw new ConflictException('You account is not approved by admin');
      } else if (vendor?.status === 'REJECTED') {
        throw new ConflictException('Your account is rejected by admin');
      }
    }

    if (user.role === UserRole.SERVICE_PROVIDER) {
      const serviceProvider = await this.serviceProviderModel.findOne({ ownerId: new Types.ObjectId(user._id) });

      if (serviceProvider?.verificationStatus === 'PENDING') {
        throw new ConflictException('You account is not approved by admin');
      } else if (serviceProvider?.verificationStatus === 'REJECTED') {
        throw new ConflictException('Your account is rejected by admin');
      }
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid Credentials');
    }

    // generate login otp
    const otp = generateOTP();

    user.otp = otp;

    user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await user.save();

    // send login otp
    await sendMail(user.email, 'Login OTP', loginOtpTemplate(user.name, otp));

    return ApiResponse.success(
      'OTP sent successfully',
      {
        email: user.email,
        otp,
      },
      200,
    );
  }

  async verifyLoginOtp(dto: VerifyLoginDTO) {

    const user = await this.userModel.findOne({
      email: dto.email.toLowerCase(),
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.otp !== dto.otp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      throw new UnauthorizedException('OTP expired');
    }

    // clear otp
    user.otp = undefined;
    user.otpExpiresAt = undefined;

    await user.save();

    const payload = {
      sub: user._id,
      email: user.email,
      role: user.role,
    };

    const token = await this.jwtService.signAsync(payload);

    const { password, ...safeUser } = user.toObject();

    return ApiResponse.success(
      'Login successful',
      {
        safeUser,
        access_token: token,
      },
      200,
    );
  }

  async resetPassword(dto: ResetPasswordDTO, userId: string) {
    const user = await this.userModel.findOne({
      _id: userId,
      email: dto.email.toLowerCase(),
    });

    if (!user) {
      throw new BadRequestException('Unauthorized user or email mismatch');
    }

    if (!user.password) {
      throw new BadRequestException(
        'Google account cannot reset password this way',
      );
    }

    const isMatch = await bcrypt.compare(dto.oldPassword, user.password);

    if (!isMatch) {
      throw new BadRequestException('Old password is incorrect');
    }

    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    if (dto.oldPassword === dto.newPassword) {
      throw new BadRequestException(
        'New password cannot be same as old password',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    user.password = hashedPassword;

    await user.save();

    return ApiResponse.success('Password reset successful', null, 200);
  }

  async sendForgotPasswordOTP(email: string) {
    const user = await this.userModel.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const otp = generateOTP();

    user.otp = otp;

    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await user.save();

    await sendMail(
      user.email,
      'Forgot Password OTP',
      forgotPasswordTemplate(user.name, otp),
    );

    return ApiResponse.success('OTP sent successfully', null, 200);
  }

  async verifyForgotPasswordOTP(dto: ForgotPasswordOTPDTO) {
    const user = await this.userModel.findOne({
      email: dto.email.toLowerCase(),
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.otp !== dto.otp) {
      throw new BadRequestException('Invalid OTP');
    }

    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      throw new BadRequestException('OTP expired');
    }

    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    user.password = hashedPassword;

    // clear otp
    user.otp = undefined;
    user.otpExpiresAt = undefined;

    await user.save();

    return ApiResponse.success('Password updated successfully', null, 200);
  }
}
