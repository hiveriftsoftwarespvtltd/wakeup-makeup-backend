import { AdminAccess } from 'src/auth/admin-access.decorator';
import { AdminModule, AccessType } from 'src/admin/schema/admin.schema';
import { Controller, Post, Param, UseGuards, Get } from '@nestjs/common';
import { AdminWalletService } from '../../service/admin/admin.wallet.service';
import { VendorWalletService } from '../../service/vendor/vendor.wallet.service';
import { ServiceProviderWalletService } from '../../service/service_provider/service_provider.wallet.service';
import { InfluencerWalletService } from '../../service/influencer/influencer.wallet.service';
import { UserWalletService } from '../../service/user/user.wallet.service';
import { PlatformWalletService } from '../../service/platform/platform.wallet.service';
import { EducatorWalletService } from '../../service/educator/educator.wallet.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guad';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/user/schema/user.schema';
import { Body, Put } from '@nestjs/common';
import { VendorWithdrawalStatus } from 'src/wallet/schema/vendor/vendor.wallet.withdraw.schema';
import { InfluencerWithdrawalStatus } from 'src/wallet/schema/influencer/influencer.wallet.withdraw.schema';
import { ServiceProviderWithdrawalStatus } from 'src/wallet/schema/service_provider/service_provider.wallet.withdraw.schema';
import { EducatorWithdrawalStatus } from 'src/wallet/schema/educator/educator.wallet.withdraw.schema';
import { BadRequestException } from '@nestjs/common';

@UseGuards(JwtAuthGuard, RolesGuard)

@Controller('wallet/admin')
export class AdminWalletController {
    constructor(
        private readonly adminWalletService: AdminWalletService,
        private readonly vendorWalletService: VendorWalletService,
        private readonly serviceProviderWalletService: ServiceProviderWalletService,
        private readonly influencerWalletService: InfluencerWalletService,
        private readonly userWalletService: UserWalletService,
        private readonly platformWalletService: PlatformWalletService,
        private readonly educatorWalletService: EducatorWalletService,
    ) { }

    @AdminAccess(AdminModule.FINANCE, AccessType.WRITE)
    @Post('initialize/:userId')
    async initializeUserWallet(@Param('userId') userId: string) {
        return this.adminWalletService.initializeUserWallet(userId);
    }

    @AdminAccess(AdminModule.FINANCE, AccessType.WRITE)
    @Post('sync-all')
    async syncAllWallets() {
        return this.adminWalletService.syncAllWallets();
    }

    // --- Admin's Own (Platform) ---
    @AdminAccess(AdminModule.FINANCE, AccessType.READ)
    @Get('platform/balance')
    async getPlatformBalance() {
        return this.platformWalletService.getBalance();
    }

    @AdminAccess(AdminModule.FINANCE, AccessType.READ)
    @Get('platform/transactions')
    async getPlatformTransactions() {
        return this.platformWalletService.getTransactions();
    }

    // --- Educator ---
    @AdminAccess(AdminModule.FINANCE, AccessType.READ)
    @Get('educator/:educatorId/balance')
    async getEducatorBalance(@Param('educatorId') educatorId: string) {
        return this.educatorWalletService.getBalance(educatorId);
    }

    @AdminAccess(AdminModule.FINANCE, AccessType.READ)
    @Get('educator/:educatorId/transactions')
    async getEducatorTransactions(@Param('educatorId') educatorId: string) {
        return this.educatorWalletService.getTransactions(educatorId);
    }

    // --- Vendor ---
    @AdminAccess(AdminModule.FINANCE, AccessType.READ)
    @Get('vendor/:vendorId/balance')
    async getVendorBalance(@Param('vendorId') vendorId: string) {
        return this.vendorWalletService.getBalance(vendorId);
    }

    @AdminAccess(AdminModule.FINANCE, AccessType.READ)
    @Get('vendor/:vendorId/transactions')
    async getVendorTransactions(@Param('vendorId') vendorId: string) {
        return this.vendorWalletService.getTransactions(vendorId);
    }

    // --- Service Provider ---
    @AdminAccess(AdminModule.FINANCE, AccessType.READ)
    @Get('service-provider/:providerId/balance')
    async getServiceProviderBalance(@Param('providerId') providerId: string) {
        return this.serviceProviderWalletService.getBalance(providerId);
    }

    @AdminAccess(AdminModule.FINANCE, AccessType.READ)
    @Get('service-provider/:providerId/transactions')
    async getServiceProviderTransactions(@Param('providerId') providerId: string) {
        return this.serviceProviderWalletService.getTransactions(providerId);
    }

    // --- Influencer ---
    @AdminAccess(AdminModule.FINANCE, AccessType.READ)
    @Get('influencer/:influencerId/balance')
    async getInfluencerBalance(@Param('influencerId') influencerId: string) {
        return this.influencerWalletService.getBalance(influencerId);
    }

    @AdminAccess(AdminModule.FINANCE, AccessType.READ)
    @Get('influencer/:influencerId/transactions')
    async getInfluencerTransactions(@Param('influencerId') influencerId: string) {
        return this.influencerWalletService.getTransactions(influencerId);
    }

    // --- User ---
    @AdminAccess(AdminModule.FINANCE, AccessType.READ)
    @Get('user/:userId/balance')
    async getUserBalance(@Param('userId') userId: string) {
        return this.userWalletService.getBalance(userId);
    }

    @AdminAccess(AdminModule.FINANCE, AccessType.READ)
    @Get('user/:userId/transactions')
    async getUserTransactions(@Param('userId') userId: string) {
        return this.userWalletService.getTransactions(userId);
    }

    // --- ALL BALANCES FOR TABLES ---

    @AdminAccess(AdminModule.FINANCE, AccessType.READ)
    @Get('balances/users')
    async getAllUserBalances() {
        return this.userWalletService.getAllWallets();
    }

    @AdminAccess(AdminModule.FINANCE, AccessType.READ)
    @Get('balances/vendors')
    async getAllVendorBalances() {
        return this.vendorWalletService.getAllWallets();
    }

    @AdminAccess(AdminModule.FINANCE, AccessType.READ)
    @Get('balances/influencers')
    async getAllInfluencerBalances() {
        return this.influencerWalletService.getAllWallets();
    }

    @AdminAccess(AdminModule.FINANCE, AccessType.READ)
    @Get('balances/service-providers')
    async getAllServiceProviderBalances() {
        return this.serviceProviderWalletService.getAllWallets();
    }

    @AdminAccess(AdminModule.FINANCE, AccessType.READ)
    @Get('balances/educators')
    async getAllEducatorBalances() {
        return this.educatorWalletService.getAllWallets();
    }

    @AdminAccess(AdminModule.FINANCE, AccessType.READ)
    @Get('balances/platform')
    async getAllPlatformBalances() {
        return this.platformWalletService.getAllWallets();
    }

    // --- WITHDRAWALS ---
    @AdminAccess(AdminModule.FINANCE, AccessType.WRITE)
    @Put('withdrawals/:type/:id/status')
    async updateWithdrawalStatus(
        @Param('type') type: 'vendor' | 'influencer' | 'service-provider' | 'educator',
        @Param('id') id: string,
        @Body() body: { status: string; transactionReference?: string; adminNote?: string }
    ) {
        switch (type) {
            case 'vendor':
                return this.vendorWalletService.updateWithdrawalStatus(
                    id, 
                    body.status as VendorWithdrawalStatus, 
                    body.transactionReference, 
                    body.adminNote
                );
            case 'influencer':
                return this.influencerWalletService.updateWithdrawalStatus(
                    id, 
                    body.status as InfluencerWithdrawalStatus, 
                    body.transactionReference, 
                    body.adminNote
                );
            case 'service-provider':
                return this.serviceProviderWalletService.updateWithdrawalStatus(
                    id, 
                    body.status as ServiceProviderWithdrawalStatus, 
                    body.transactionReference, 
                    body.adminNote
                );
            case 'educator':
                return this.educatorWalletService.updateWithdrawalStatus(
                    id, 
                    body.status as EducatorWithdrawalStatus, 
                    body.transactionReference, 
                    body.adminNote
                );
            default:
                throw new BadRequestException('Invalid user type for withdrawal');
        }
    }
}
