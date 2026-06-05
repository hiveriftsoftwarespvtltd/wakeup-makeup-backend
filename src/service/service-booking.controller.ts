import {
  Controller,
  Post,
  Put,
  Get,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ServiceBookingService } from './service-booking.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guad';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/user/schema/user.schema';
import { CreateBookingDTO, RescheduleBookingDTO } from './dto/service.dto';

@Controller('service-booking')
export class ServiceBookingController {
  constructor(private readonly serviceBookingService: ServiceBookingService) { }

  @Post('create-booking')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  createBooking(@Req() req: any, @Body() dto: CreateBookingDTO) {
    return this.serviceBookingService.createBooking(req.user._id, dto);
  }

  @Put('cancel-service-booking/:id')
  @UseGuards(JwtAuthGuard)
  cancelBooking(@Req() req: any, @Param('id') bookingId: string) {
    // Basic implementation: User cancels their own booking
    return this.serviceBookingService.cancelBooking(req.user._id, bookingId);
  }

  @Put('reschedule/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  rescheduleBooking(
    @Req() req: any,
    @Param('id') bookingId: string,
    @Body() dto: RescheduleBookingDTO,
  ) {
    return this.serviceBookingService.rescheduleBooking(req.user._id, bookingId, dto);
  }

  @Put(':id/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SERVICE_PROVIDER)
  confirmBooking(@Req() req: any, @Param('id') bookingId: string) {
    // The provider confirms the booking
    return this.serviceBookingService.confirmBooking(req.user._id, bookingId);
  }

  @Get('user-service-booking-history')
  @UseGuards(JwtAuthGuard)
  getBookingHistory(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.serviceBookingService.getUserBookingHistory(
      req.user._id,
      status,
      startDate,
      endDate,
    );
  }
}
