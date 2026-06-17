import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { DistributorWalletService } from '../../service/distributor/distributor.wallet.service';

@Controller('wallet/distributor')
export class DistributorWalletController {
    constructor(private readonly distributorWalletService: DistributorWalletService) {}

    @Get('balance/:distributorId')
    async getBalance(@Param('distributorId') distributorId: string) {
        return this.distributorWalletService.getBalance(distributorId);
    }

    @Get('transactions/:distributorId')
    async getTransactions(@Param('distributorId') distributorId: string) {
        return this.distributorWalletService.getTransactions(distributorId);
    }

    @Post('withdraw')
    async requestWithdrawal(@Body() withdrawDto: { distributorId: string; amount: number; bankAccountId: string }) {
        return this.distributorWalletService.requestWithdrawal(withdrawDto.distributorId, withdrawDto.amount, withdrawDto.bankAccountId);
    }

    @Get('withdrawals/:distributorId')
    async getWithdrawals(@Param('distributorId') distributorId: string) {
        return this.distributorWalletService.getWithdrawals(distributorId);
    }
}
