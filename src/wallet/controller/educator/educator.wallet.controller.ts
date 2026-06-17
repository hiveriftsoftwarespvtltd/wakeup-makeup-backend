import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { EducatorWalletService } from '../../service/educator/educator.wallet.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guad';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/user/schema/user.schema';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.EDUCATOR)
@Controller('wallet/educator')
export class EducatorWalletController {
    constructor(private readonly educatorWalletService: EducatorWalletService) {}

    @Get('balance')
    async getBalance(@Req() req: any) {
        return this.educatorWalletService.getBalance(req.user.educatorId.toString());
    }

    @Get('transactions')
    async getTransactions(@Req() req: any) {
        return this.educatorWalletService.getTransactions(req.user.educatorId.toString());
    }

    @Post('withdraw')
    async requestWithdrawal(@Req() req: any, @Body() withdrawDto: { amount: number; bankAccountId: string }) {
        return this.educatorWalletService.requestWithdrawal(req.user.educatorId.toString(), withdrawDto.amount, withdrawDto.bankAccountId);
    }

    @Get('withdrawals')
    async getWithdrawals(@Req() req: any) {
        return this.educatorWalletService.getWithdrawals(req.user.educatorId.toString());
    }
}
