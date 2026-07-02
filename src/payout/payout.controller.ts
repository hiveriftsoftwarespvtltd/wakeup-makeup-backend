import { AdminAccess } from 'src/auth/admin-access.decorator';
import { AdminModule, AccessType } from 'src/admin/schema/admin.schema';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PayoutService } from './payout.service';
import {
  SettleInfluencerPayoutDto,
  SettleVendorPayoutDto,
  SettleVendorPendingBalanceDto,
  SettleInfluencerPendingBalanceDto,
  SettleServiceProviderPendingBalanceDto,
  SettleEducatorPendingBalanceDto
} from './dto/payout.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/user/schema/user.schema';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guad';

@UseGuards(JwtAuthGuard, RolesGuard)

@Controller('payout')
export class PayoutController {
  constructor(private payoutService: PayoutService) {}

    @AdminAccess(AdminModule.FINANCE, AccessType.WRITE)
  @Post('vendor-payout/settle')
  settleVendorPayout(@Body() dto: SettleVendorPayoutDto) {
    return this.payoutService.settleVendorPayout(dto);
  }

    @AdminAccess(AdminModule.FINANCE, AccessType.WRITE)
  @Post('influencer-payout/settle')
  settleInfluencerPayout(@Body() dto: SettleInfluencerPayoutDto) {
    return this.payoutService.settleInfluencerPayout(dto);
  }

    @AdminAccess(AdminModule.FINANCE, AccessType.WRITE)
  @Post('vendor/settle-pending')
  settleVendorPendingBalance(@Body() dto: SettleVendorPendingBalanceDto) {
    return this.payoutService.settleVendorPendingBalance(dto);
  }

    @AdminAccess(AdminModule.FINANCE, AccessType.WRITE)
  @Post('influencer/settle-pending')
  settleInfluencerPendingBalance(@Body() dto: SettleInfluencerPendingBalanceDto) {
    return this.payoutService.settleInfluencerPendingBalance(dto);
  }

    @AdminAccess(AdminModule.FINANCE, AccessType.WRITE)
  @Post('service-provider/settle-pending')
  settleServiceProviderPendingBalance(@Body() dto: SettleServiceProviderPendingBalanceDto) {
    return this.payoutService.settleServiceProviderPendingBalance(dto);
  }

    @AdminAccess(AdminModule.FINANCE, AccessType.WRITE)
  @Post('educator/settle-pending')
  settleEducatorPendingBalance(@Body() dto: SettleEducatorPendingBalanceDto) {
    return this.payoutService.settleEducatorPendingBalance(dto);
  }
}
