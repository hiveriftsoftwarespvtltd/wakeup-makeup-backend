import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ServiceProviderWalletDocument, ServiceProviderWallet } from '../../schema/service_provider/service_provider.wallet.schema';
import { ServiceProviderWalletTransactionDocument, ServiceProviderWalletTransaction } from '../../schema/service_provider/service_provider.wallet.transactions';
import { ServiceProviderWalletWithdrawDocument, ServiceProviderWalletWithdraw, ServiceProviderWithdrawalStatus } from '../../schema/service_provider/service_provider.wallet.withdraw.schema';

@Injectable()
export class ServiceProviderWalletService {
    constructor(
        @InjectModel(ServiceProviderWallet.name) private readonly serviceProviderWalletModel: Model<ServiceProviderWalletDocument>,
        @InjectModel(ServiceProviderWalletTransaction.name) private readonly serviceProviderWalletTransactionModel: Model<ServiceProviderWalletTransactionDocument>,
        @InjectModel(ServiceProviderWalletWithdraw.name) private readonly serviceProviderWalletWithdrawModel: Model<ServiceProviderWalletWithdrawDocument>,
    ) { }

    async getBalance(providerId: string) {
        const wallet = await this.serviceProviderWalletModel.findOne({ serviceProviderId: new Types.ObjectId(providerId) });
        if (!wallet) throw new NotFoundException('Wallet not found');
        return { balance: wallet.balance, pendingBalance: wallet.pendingBalance, totalEarnings: wallet.totalEarnings };
    }

    async getTransactions(providerId: string) {
        return this.serviceProviderWalletTransactionModel.find({ serviceProviderId: new Types.ObjectId(providerId) }).sort({ createdAt: -1 });
    }

    async requestWithdrawal(providerId: string, amount: number, bankAccountId: string) {
        if (amount <= 0) throw new BadRequestException('Amount must be greater than zero');

        const wallet = await this.serviceProviderWalletModel.findOne({ serviceProviderId: new Types.ObjectId(providerId) });
        if (!wallet || wallet.balance < amount) throw new BadRequestException('Insufficient balance');

        const withdrawal = await this.serviceProviderWalletWithdrawModel.create({
            serviceProviderId: new Types.ObjectId(providerId),
            amount,
            bankAccountId: new Types.ObjectId(bankAccountId),
            status: ServiceProviderWithdrawalStatus.PENDING,
        });

        // Deduct from balance immediately on request
        wallet.balance -= amount;
        wallet.totalWithdrawn += amount;
        await wallet.save();

        return withdrawal;
    }

    async getWithdrawals(providerId: string) {
        return this.serviceProviderWalletWithdrawModel.find({ serviceProviderId: new Types.ObjectId(providerId) }).sort({ createdAt: -1 });
    }
}
