import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { InfluencerWalletDocument, InfluencerWallet } from '../../schema/influencer/influencer.wallet.schema';
import { InfluencerWalletTransactionDocument, InfluencerWalletTransaction, InfluencerWalletTransactionType, InfluencerWalletTransactionReason } from '../../schema/influencer/influencer.wallet.transactions';
import { InfluencerWalletWithdrawDocument, InfluencerWalletWithdraw, InfluencerWithdrawalStatus } from '../../schema/influencer/influencer.wallet.withdraw.schema';

@Injectable()
export class InfluencerWalletService {
    constructor(
        @InjectModel(InfluencerWallet.name) private readonly influencerWalletModel: Model<InfluencerWalletDocument>,
        @InjectModel(InfluencerWalletTransaction.name) private readonly influencerWalletTransactionModel: Model<InfluencerWalletTransactionDocument>,
        @InjectModel(InfluencerWalletWithdraw.name) private readonly influencerWalletWithdrawModel: Model<InfluencerWalletWithdrawDocument>,
    ) {}

    async initializeWallet(influencerId: string) {
        const existing = await this.influencerWalletModel.findOne({ influencerId: new Types.ObjectId(influencerId) });
        if (!existing) {
            await this.influencerWalletModel.create({ influencerId: new Types.ObjectId(influencerId) });
        }
    }

    async getBalance(influencerId: string) {
        const wallet = await this.influencerWalletModel.findOne({ influencerId: new Types.ObjectId(influencerId) });
        if (!wallet) throw new NotFoundException('Wallet not found');
        return { balance: wallet.balance, totalEarnings: wallet.totalEarnings };
    }

    async getTransactions(influencerId: string) {
        return this.influencerWalletTransactionModel.find({ influencerId: new Types.ObjectId(influencerId) }).sort({ createdAt: -1 });
    }

    async getAllWallets() {
        return this.influencerWalletModel.find().populate('influencerId', 'name email').sort({ createdAt: -1 });
    }

    async addBalance(influencerId: string, amount: number, reason: InfluencerWalletTransactionReason, description?: string, orderId?: string, bookingId?: string, session?: any) {
        if (amount <= 0) throw new BadRequestException('Amount must be greater than zero');

        let wallet = session
            ? await this.influencerWalletModel.findOne({ influencerId: new Types.ObjectId(influencerId) }).session(session)
            : await this.influencerWalletModel.findOne({ influencerId: new Types.ObjectId(influencerId) });

        if (!wallet) {
            const walletDocs = await this.influencerWalletModel.create([{
                influencerId: new Types.ObjectId(influencerId),
                balance: 0,
                pendingBalance: 0,
                totalEarnings: 0,
                totalWithdrawn: 0
            }], { session });
            wallet = walletDocs[0];
        }

        wallet.pendingBalance += amount;
        await wallet.save({ session });

        const transactionDocs = await this.influencerWalletTransactionModel.create([{
            walletId: wallet._id,
            influencerId: new Types.ObjectId(influencerId),
            amount,
            type: InfluencerWalletTransactionType.CREDIT,
            reason,
            orderId: orderId ? new Types.ObjectId(orderId) : undefined,
            bookingId: bookingId ? new Types.ObjectId(bookingId) : undefined,
            description,
            balanceAfterTransaction: wallet.pendingBalance,
        }], { session });

        return { wallet, transaction: transactionDocs[0] };
    }

    async requestWithdrawal(influencerId: string, amount: number, bankAccountId: string) {
        if (amount <= 0) throw new BadRequestException('Amount must be greater than zero');
        
        const wallet = await this.influencerWalletModel.findOne({ influencerId: new Types.ObjectId(influencerId) });
        if (!wallet || wallet.balance < amount) throw new BadRequestException('Insufficient balance');

        const withdrawal = await this.influencerWalletWithdrawModel.create({
            influencerId: new Types.ObjectId(influencerId),
            amount,
            bankAccountId: new Types.ObjectId(bankAccountId),
            status: InfluencerWithdrawalStatus.PENDING,
        });

        // Deduct from balance immediately on request
        wallet.balance -= amount;
        wallet.totalWithdrawn += amount;
        await wallet.save();

        return withdrawal;
    }

    async getWithdrawals(influencerId: string) {
        return this.influencerWalletWithdrawModel.find({ influencerId: new Types.ObjectId(influencerId) }).sort({ createdAt: -1 });
    }

    async updateWithdrawalStatus(withdrawalId: string, status: InfluencerWithdrawalStatus, transactionReference?: string, adminNote?: string) {
        const withdrawal = await this.influencerWalletWithdrawModel.findById(withdrawalId);
        if (!withdrawal) throw new NotFoundException('Withdrawal request not found');

        if (withdrawal.status !== InfluencerWithdrawalStatus.PENDING && withdrawal.status !== InfluencerWithdrawalStatus.APPROVED) {
            throw new BadRequestException(`Cannot update withdrawal from status ${withdrawal.status}`);
        }

        withdrawal.status = status;
        if (transactionReference) withdrawal.transactionReference = transactionReference;
        if (adminNote) withdrawal.adminNote = adminNote;

        await withdrawal.save();

        if (status === InfluencerWithdrawalStatus.REJECTED) {
            // Refund the balance
            const wallet = await this.influencerWalletModel.findOne({ influencerId: withdrawal.influencerId });
            if (wallet) {
                wallet.balance += withdrawal.amount;
                wallet.totalWithdrawn -= withdrawal.amount;
                await wallet.save();
            }
        } else if (status === InfluencerWithdrawalStatus.PROCESSED) {
            // Log a transaction record for the withdrawal when processed
            const wallet = await this.influencerWalletModel.findOne({ influencerId: withdrawal.influencerId });
            if (wallet) {
                await this.influencerWalletTransactionModel.create({
                    walletId: wallet._id,
                    influencerId: wallet.influencerId,
                    amount: withdrawal.amount,
                    type: InfluencerWalletTransactionType.DEBIT,
                    reason: InfluencerWalletTransactionReason.WITHDRAWAL,
                    description: `Withdrawal processed. Ref: ${transactionReference || 'N/A'}`,
                    balanceAfterTransaction: wallet.balance,
                });
            }
        }

        return withdrawal;
    }
}
