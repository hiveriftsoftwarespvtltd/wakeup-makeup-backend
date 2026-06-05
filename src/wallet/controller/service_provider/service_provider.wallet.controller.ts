import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ServiceProviderWalletService } from '../../service/service_provider/service_provider.wallet.service';

@Controller('wallet/service-provider')
export class ServiceProviderWalletController {
    constructor(private readonly serviceProviderWalletService: ServiceProviderWalletService) {}

    @Get('balance/:providerId')
    async getBalance(@Param('providerId') providerId: string) {
        return this.serviceProviderWalletService.getBalance(providerId);
    }

    @Get('transactions/:providerId')
    async getTransactions(@Param('providerId') providerId: string) {
        return this.serviceProviderWalletService.getTransactions(providerId);
    }

    @Post('withdraw')
    async requestWithdrawal(@Body() withdrawDto: { providerId: string; amount: number; bankAccountId: string }) {
        return this.serviceProviderWalletService.requestWithdrawal(withdrawDto.providerId, withdrawDto.amount, withdrawDto.bankAccountId);
    }

    @Get('withdrawals/:providerId')
    async getWithdrawals(@Param('providerId') providerId: string) {
        return this.serviceProviderWalletService.getWithdrawals(providerId);
    }
}
