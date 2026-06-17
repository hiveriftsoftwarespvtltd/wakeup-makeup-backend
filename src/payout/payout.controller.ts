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
@Roles(UserRole.ADMIN)
@Controller('payout')
export class PayoutController {
  constructor(private payoutService: PayoutService) {}

  @Post('vendor-payout/settle')
  settleVendorPayout(@Body() dto: SettleVendorPayoutDto) {
    return this.payoutService.settleVendorPayout(dto);
  }

  @Post('influencer-payout/settle')
  settleInfluencerPayout(@Body() dto: SettleInfluencerPayoutDto) {
    return this.payoutService.settleInfluencerPayout(dto);
  }

  @Post('vendor/settle-pending')
  settleVendorPendingBalance(@Body() dto: SettleVendorPendingBalanceDto) {
    return this.payoutService.settleVendorPendingBalance(dto);
  }

  @Post('influencer/settle-pending')
  settleInfluencerPendingBalance(@Body() dto: SettleInfluencerPendingBalanceDto) {
    return this.payoutService.settleInfluencerPendingBalance(dto);
  }

  @Post('service-provider/settle-pending')
  settleServiceProviderPendingBalance(@Body() dto: SettleServiceProviderPendingBalanceDto) {
    return this.payoutService.settleServiceProviderPendingBalance(dto);
  }

  @Post('educator/settle-pending')
  settleEducatorPendingBalance(@Body() dto: SettleEducatorPendingBalanceDto) {
    return this.payoutService.settleEducatorPendingBalance(dto);
  }
}
