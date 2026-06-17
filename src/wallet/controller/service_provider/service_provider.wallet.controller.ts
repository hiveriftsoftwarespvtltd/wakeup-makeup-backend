import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ServiceProviderWalletService } from '../../service/service_provider/service_provider.wallet.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guad';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/user/schema/user.schema';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SERVICE_PROVIDER)
@Controller('wallet/service-provider')
export class ServiceProviderWalletController {
    constructor(private readonly serviceProviderWalletService: ServiceProviderWalletService) {}

    @Get('balance')
    async getBalance(@Req() req: any) {
        return this.serviceProviderWalletService.getBalance(req.user.serviceProviderId.toString());
    }

    @Get('transactions')
    async getTransactions(@Req() req: any) {
        return this.serviceProviderWalletService.getTransactions(req.user.serviceProviderId.toString());
    }

    @Post('withdraw')
    async requestWithdrawal(@Req() req: any, @Body() withdrawDto: { amount: number; bankAccountId: string }) {
        return this.serviceProviderWalletService.requestWithdrawal(req.user.serviceProviderId.toString(), withdrawDto.amount, withdrawDto.bankAccountId);
    }

    @Get('withdrawals')
    async getWithdrawals(@Req() req: any) {
        return this.serviceProviderWalletService.getWithdrawals(req.user.serviceProviderId.toString());
    }
}
