import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { VendorWalletService } from '../../service/vendor/vendor.wallet.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guad';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/user/schema/user.schema';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.VENDOR)
@Controller('wallet/vendor')
export class VendorWalletController {
    constructor(private readonly vendorWalletService: VendorWalletService) {}

    @Get('balance')
    async getBalance(@Req() req: any) {
        return this.vendorWalletService.getBalance(req.user.vendorId.toString());
    }

    @Get('transactions')
    async getTransactions(@Req() req: any) {
        return this.vendorWalletService.getTransactions(req.user.vendorId.toString());
    }

    @Post('withdraw')
    async requestWithdrawal(@Req() req: any, @Body() withdrawDto: { amount: number; bankAccountId: string }) {
        return this.vendorWalletService.requestWithdrawal(req.user.vendorId.toString(), withdrawDto.amount, withdrawDto.bankAccountId);
    }

    @Get('withdrawals')
    async getWithdrawals(@Req() req: any) {
        return this.vendorWalletService.getWithdrawals(req.user.vendorId.toString());
    }
}
