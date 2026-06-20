import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AdminCommissionRateService } from './admin.commission-rate.service';
import {
  CreateCommissionRateDto,
  UpdateCommissionRateDto,
} from './dto/commission-rate.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guad';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/user/schema/user.schema';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/commission-rates')
export class AdminCommissionRateController {
  constructor(
    private readonly commissionRateService: AdminCommissionRateService,
  ) { }

  /** GET the single global commission-rate configuration */
  @Get()
  async get() {
    return this.commissionRateService.get();
  }

  /** SET (upsert) the global commission-rate slabs */
  @Post()
  async set(@Body() dto: CreateCommissionRateDto) {
    return this.commissionRateService.set(dto);
  }
}
