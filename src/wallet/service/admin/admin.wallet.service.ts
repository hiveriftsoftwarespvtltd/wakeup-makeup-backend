import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

// Wallet schemas
import { UserWalletDocument, UserWallet } from '../../schema/user/user.wallet.schema';
import { VendorWalletDocument, VendorWallet } from '../../schema/vendor/vendor.wallet.schema';
import { InfluencerWalletDocument, InfluencerWallet } from '../../schema/influencer/influencer.wallet.schema';
import { ServiceProviderWalletDocument, ServiceProviderWallet } from '../../schema/service_provider/service_provider.wallet.schema';

// Collection schemas
import { UserDocument, User } from 'src/user/schema/user.schema';
import { VendorDocument, Vendor } from 'src/vendor/schema/vendor.schema';
import { InfluencerDocument, Influencer } from 'src/influencer/schema/influencer.schema';
import { ServiceProviderDocument, ServiceProvider } from 'src/service/schema/service-provider.schema';

@Injectable()
export class AdminWalletService {
    constructor(
        @InjectModel(UserWallet.name) private readonly userWalletModel: Model<UserWalletDocument>,
        @InjectModel(VendorWallet.name) private readonly vendorWalletModel: Model<VendorWalletDocument>,
        @InjectModel(InfluencerWallet.name) private readonly influencerWalletModel: Model<InfluencerWalletDocument>,
        @InjectModel(ServiceProviderWallet.name) private readonly serviceProviderWalletModel: Model<ServiceProviderWalletDocument>,

        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
        @InjectModel(Vendor.name) private readonly vendorModel: Model<VendorDocument>,
        @InjectModel(Influencer.name) private readonly influencerModel: Model<InfluencerDocument>,
        @InjectModel(ServiceProvider.name) private readonly serviceProviderModel: Model<ServiceProviderDocument>,
    ) {}

    async initializeUserWallet(userId: string) {
        const existingWallet = await this.userWalletModel.findOne({ userId: new Types.ObjectId(userId) });
        if (existingWallet) {
            throw new BadRequestException('Wallet already exists for this user');
        }

        const newWallet = await this.userWalletModel.create({
            userId: new Types.ObjectId(userId),
            balance: 0,
            totalCredits: 0,
            totalDebits: 0,
            isActive: true,
        });

        return newWallet;
    }

    async syncAllWallets() {
        const results = {
            usersCreated: 0,
            vendorsCreated: 0,
            influencersCreated: 0,
            serviceProvidersCreated: 0,
        };

        // Sync Users
        const users = await this.userModel.find();
        for (const user of users) {
            const existing = await this.userWalletModel.findOne({ userId: user._id });
            if (!existing) {
                await this.userWalletModel.create({ userId: user._id });
                results.usersCreated++;
            }
        }

        // Sync Vendors
        const vendors = await this.vendorModel.find();
        for (const vendor of vendors) {
            const existing = await this.vendorWalletModel.findOne({ vendorId: vendor._id });
            if (!existing) {
                await this.vendorWalletModel.create({ vendorId: vendor._id });
                results.vendorsCreated++;
            }
        }

        // Sync Influencers
        const influencers = await this.influencerModel.find();
        for (const influencer of influencers) {
            const existing = await this.influencerWalletModel.findOne({ influencerId: influencer._id });
            if (!existing) {
                await this.influencerWalletModel.create({ influencerId: influencer._id });
                results.influencersCreated++;
            }
        }

        // Sync Service Providers
        const serviceProviders = await this.serviceProviderModel.find();
        for (const sp of serviceProviders) {
            const existing = await this.serviceProviderWalletModel.findOne({ serviceProviderId: sp._id });
            if (!existing) {
                await this.serviceProviderWalletModel.create({ serviceProviderId: sp._id });
                results.serviceProvidersCreated++;
            }
        }

        return { message: 'Wallet sync completed successfully', results };
    }
}
