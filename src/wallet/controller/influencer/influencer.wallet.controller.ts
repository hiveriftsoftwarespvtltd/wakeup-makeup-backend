import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { InfluencerWalletService } from '../../service/influencer/influencer.wallet.service';

@Controller('wallet/influencer')
export class InfluencerWalletController {
    constructor(private readonly influencerWalletService: InfluencerWalletService) {}

    @Get('balance/:influencerId')
    async getBalance(@Param('influencerId') influencerId: string) {
        return this.influencerWalletService.getBalance(influencerId);
    }

    @Get('transactions/:influencerId')
    async getTransactions(@Param('influencerId') influencerId: string) {
        return this.influencerWalletService.getTransactions(influencerId);
    }

    @Post('withdraw')
    async requestWithdrawal(@Body() withdrawDto: { influencerId: string; amount: number; bankAccountId: string }) {
        return this.influencerWalletService.requestWithdrawal(withdrawDto.influencerId, withdrawDto.amount, withdrawDto.bankAccountId);
    }

    @Get('withdrawals/:influencerId')
    async getWithdrawals(@Param('influencerId') influencerId: string) {
        return this.influencerWalletService.getWithdrawals(influencerId);
    }
}
