import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { VendorWalletService } from '../../service/vendor/vendor.wallet.service';

@Controller('wallet/vendor')
export class VendorWalletController {
    constructor(private readonly vendorWalletService: VendorWalletService) {}

    @Get('balance/:vendorId')
    async getBalance(@Param('vendorId') vendorId: string) {
        return this.vendorWalletService.getBalance(vendorId);
    }

    @Get('transactions/:vendorId')
    async getTransactions(@Param('vendorId') vendorId: string) {
        return this.vendorWalletService.getTransactions(vendorId);
    }

    @Post('withdraw')
    async requestWithdrawal(@Body() withdrawDto: { vendorId: string; amount: number; bankAccountId: string }) {
        return this.vendorWalletService.requestWithdrawal(withdrawDto.vendorId, withdrawDto.amount, withdrawDto.bankAccountId);
    }

    @Get('withdrawals/:vendorId')
    async getWithdrawals(@Param('vendorId') vendorId: string) {
        return this.vendorWalletService.getWithdrawals(vendorId);
    }
}
