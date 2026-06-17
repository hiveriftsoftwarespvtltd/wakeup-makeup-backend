import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ServiceProviderWalletDocument, ServiceProviderWallet } from '../../schema/service_provider/service_provider.wallet.schema';
import { ServiceProviderWalletTransactionDocument, ServiceProviderWalletTransaction, ServiceProviderWalletTransactionType, ServiceProviderWalletTransactionReason } from '../../schema/service_provider/service_provider.wallet.transactions';
import { ServiceProviderWalletWithdrawDocument, ServiceProviderWalletWithdraw, ServiceProviderWithdrawalStatus } from '../../schema/service_provider/service_provider.wallet.withdraw.schema';

@Injectable()
export class ServiceProviderWalletService {
    constructor(
        @InjectModel(ServiceProviderWallet.name) private readonly serviceProviderWalletModel: Model<ServiceProviderWalletDocument>,
        @InjectModel(ServiceProviderWalletTransaction.name) private readonly serviceProviderWalletTransactionModel: Model<ServiceProviderWalletTransactionDocument>,
        @InjectModel(ServiceProviderWalletWithdraw.name) private readonly serviceProviderWalletWithdrawModel: Model<ServiceProviderWalletWithdrawDocument>,
    ) { }

    async initializeWallet(providerId: string) {
        const existing = await this.serviceProviderWalletModel.findOne({ serviceProviderId: new Types.ObjectId(providerId) });
        if (!existing) {
            await this.serviceProviderWalletModel.create({ serviceProviderId: new Types.ObjectId(providerId) });
        }
    }

    async getBalance(providerId: string) {
        const wallet = await this.serviceProviderWalletModel.findOne({ serviceProviderId: new Types.ObjectId(providerId) });
        if (!wallet) throw new NotFoundException('Wallet not found');
        return { balance: wallet.balance, pendingBalance: wallet.pendingBalance, totalEarnings: wallet.totalEarnings };
    }

    async getTransactions(providerId: string) {
        return this.serviceProviderWalletTransactionModel.find({ serviceProviderId: new Types.ObjectId(providerId) }).sort({ createdAt: -1 });
    }

    async getAllWallets() {
        return this.serviceProviderWalletModel.find().populate('serviceProviderId', 'businessName email').sort({ createdAt: -1 });
    }

    async addBalance(providerId: string, amount: number, reason: ServiceProviderWalletTransactionReason, description?: string, bookingId?: string, session?: any, quotationId?: string) {
        if (amount <= 0) throw new BadRequestException('Amount must be greater than zero');

        let wallet = session
            ? await this.serviceProviderWalletModel.findOne({ serviceProviderId: new Types.ObjectId(providerId) }).session(session)
            : await this.serviceProviderWalletModel.findOne({ serviceProviderId: new Types.ObjectId(providerId) });

        if (!wallet) {
            const walletDocs = await this.serviceProviderWalletModel.create([{
                serviceProviderId: new Types.ObjectId(providerId),
                balance: 0,
                pendingBalance: 0,
                totalEarnings: 0,
                totalWithdrawn: 0
            }], { session });
            wallet = walletDocs[0];
        }

        wallet.pendingBalance += amount;
        await wallet.save({ session });

        const transactionDocs = await this.serviceProviderWalletTransactionModel.create([{
            walletId: wallet._id,
            serviceProviderId: new Types.ObjectId(providerId),
            amount,
            type: ServiceProviderWalletTransactionType.CREDIT,
            reason,
            bookingId: bookingId ? new Types.ObjectId(bookingId) : undefined,
            quotationId: quotationId ? new Types.ObjectId(quotationId) : undefined,
            description,
            balanceAfterTransaction: wallet.pendingBalance,
        }], { session });

        return { wallet, transaction: transactionDocs[0] };
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

    async updateWithdrawalStatus(withdrawalId: string, status: ServiceProviderWithdrawalStatus, transactionReference?: string, adminNote?: string) {
        const withdrawal = await this.serviceProviderWalletWithdrawModel.findById(withdrawalId);
        if (!withdrawal) throw new NotFoundException('Withdrawal request not found');

        if (withdrawal.status !== ServiceProviderWithdrawalStatus.PENDING && withdrawal.status !== ServiceProviderWithdrawalStatus.APPROVED) {
            throw new BadRequestException(`Cannot update withdrawal from status ${withdrawal.status}`);
        }

        withdrawal.status = status;
        if (transactionReference) withdrawal.transactionReference = transactionReference;
        if (adminNote) withdrawal.adminNote = adminNote;

        await withdrawal.save();

        if (status === ServiceProviderWithdrawalStatus.REJECTED) {
            // Refund the balance
            const wallet = await this.serviceProviderWalletModel.findOne({ serviceProviderId: withdrawal.serviceProviderId });
            if (wallet) {
                wallet.balance += withdrawal.amount;
                wallet.totalWithdrawn -= withdrawal.amount;
                await wallet.save();
            }
        } else if (status === ServiceProviderWithdrawalStatus.PROCESSED) {
            // Log a transaction record for the withdrawal when processed
            const wallet = await this.serviceProviderWalletModel.findOne({ serviceProviderId: withdrawal.serviceProviderId });
            if (wallet) {
                await this.serviceProviderWalletTransactionModel.create({
                    walletId: wallet._id,
                    serviceProviderId: wallet.serviceProviderId,
                    amount: withdrawal.amount,
                    type: ServiceProviderWalletTransactionType.DEBIT,
                    reason: ServiceProviderWalletTransactionReason.WITHDRAWAL,
                    description: `Withdrawal processed. Ref: ${transactionReference || 'N/A'}`,
                    balanceAfterTransaction: wallet.balance,
                });
            }
        }

        return withdrawal;
    }
}
