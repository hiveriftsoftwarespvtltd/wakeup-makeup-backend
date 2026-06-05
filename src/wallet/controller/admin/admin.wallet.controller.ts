import { Controller, Post, Param, UseGuards } from '@nestjs/common';
import { AdminWalletService } from '../../service/admin/admin.wallet.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guad';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/user/schema/user.schema';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('wallet/admin')
export class AdminWalletController {
    constructor(private readonly adminWalletService: AdminWalletService) { }

    @Post('initialize/:userId')
    async initializeUserWallet(@Param('userId') userId: string) {
        return this.adminWalletService.initializeUserWallet(userId);
    }

    @Post('sync-all')
    async syncAllWallets() {
        return this.adminWalletService.syncAllWallets();
    }
}
