import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { InfluencerWalletService } from '../../service/influencer/influencer.wallet.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guad';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/user/schema/user.schema';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.INFLUENCER)
@Controller('wallet/influencer')
export class InfluencerWalletController {
    constructor(private readonly influencerWalletService: InfluencerWalletService) {}

    @Get('balance')
    async getBalance(@Req() req: any) {
        return this.influencerWalletService.getBalance(req.user.influencerId.toString());
    }

    @Get('transactions')
    async getTransactions(@Req() req: any) {
        return this.influencerWalletService.getTransactions(req.user.influencerId.toString());
    }

    @Post('withdraw')
    async requestWithdrawal(@Req() req: any, @Body() withdrawDto: { amount: number; bankAccountId: string }) {
        return this.influencerWalletService.requestWithdrawal(req.user.influencerId.toString(), withdrawDto.amount, withdrawDto.bankAccountId);
    }

    @Get('withdrawals')
    async getWithdrawals(@Req() req: any) {
        return this.influencerWalletService.getWithdrawals(req.user.influencerId.toString());
    }
}
