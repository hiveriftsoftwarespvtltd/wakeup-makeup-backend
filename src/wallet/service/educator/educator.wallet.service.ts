import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EducatorWalletDocument, EducatorWallet } from '../../schema/educator/educator.wallet.schema';
import { EducatorWalletTransactionDocument, EducatorWalletTransaction } from '../../schema/educator/educator.wallet.transactions';
import { EducatorWalletWithdrawDocument, EducatorWalletWithdraw, EducatorWithdrawalStatus } from '../../schema/educator/educator.wallet.withdraw.schema';
import { EducatorWalletTransactionType, EducatorWalletTransactionReason } from '../../schema/educator/educator.wallet.transactions';

@Injectable()
export class EducatorWalletService {
    constructor(
        @InjectModel(EducatorWallet.name) private readonly educatorWalletModel: Model<EducatorWalletDocument>,
        @InjectModel(EducatorWalletTransaction.name) private readonly educatorWalletTransactionModel: Model<EducatorWalletTransactionDocument>,
        @InjectModel(EducatorWalletWithdraw.name) private readonly educatorWalletWithdrawModel: Model<EducatorWalletWithdrawDocument>,
    ) { }

    async initializeWallet(educatorId: string) {
        const existing = await this.educatorWalletModel.findOne({ educatorId: new Types.ObjectId(educatorId) });
        if (!existing) {
            await this.educatorWalletModel.create({ educatorId: new Types.ObjectId(educatorId) });
        }
    }

    async getBalance(educatorId: string) {
        const wallet = await this.educatorWalletModel.findOne({ educatorId: new Types.ObjectId(educatorId) });
        if (!wallet) throw new NotFoundException('Wallet not found');
        return { balance: wallet.balance, pendingBalance: wallet.pendingBalance, totalEarnings: wallet.totalEarnings };
    }

    async getTransactions(educatorId: string) {
        return this.educatorWalletTransactionModel.find({ educatorId: new Types.ObjectId(educatorId) }).sort({ createdAt: -1 });
    }

    async getAllWallets() {
        return this.educatorWalletModel.find().populate('educatorId', 'name email').sort({ createdAt: -1 });
    }

    async addBalance(educatorId: string, amount: number, reason: EducatorWalletTransactionReason, description?: string, coursePurchaseId?: string, session?: any) {
        if (amount <= 0) throw new BadRequestException('Amount must be greater than zero');

        let wallet = session
            ? await this.educatorWalletModel.findOne({ educatorId: new Types.ObjectId(educatorId) }).session(session)
            : await this.educatorWalletModel.findOne({ educatorId: new Types.ObjectId(educatorId) });

        if (!wallet) {
            const walletDocs = await this.educatorWalletModel.create([{
                educatorId: new Types.ObjectId(educatorId),
                balance: 0,
                pendingBalance: 0,
                totalEarnings: 0,
                totalWithdrawn: 0
            }], { session });
            wallet = walletDocs[0];
        }

        wallet.pendingBalance += amount;
        await wallet.save({ session });

        const transactionDocs = await this.educatorWalletTransactionModel.create([{
            walletId: wallet._id,
            educatorId: new Types.ObjectId(educatorId),
            amount,
            type: EducatorWalletTransactionType.CREDIT,
            reason,
            coursePurchaseId: coursePurchaseId ? new Types.ObjectId(coursePurchaseId) : undefined,
            description,
            balanceAfterTransaction: wallet.balance,
        }], { session });

        return { wallet, transaction: transactionDocs[0] };
    }

    async requestWithdrawal(educatorId: string, amount: number, bankAccountId: string) {
        if (amount <= 0) throw new BadRequestException('Amount must be greater than zero');

        const wallet = await this.educatorWalletModel.findOne({ educatorId: new Types.ObjectId(educatorId) });
        if (!wallet || wallet.balance < amount) throw new BadRequestException('Insufficient balance');

        const withdrawal = await this.educatorWalletWithdrawModel.create({
            educatorId: new Types.ObjectId(educatorId),
            amount,
            bankAccountId: new Types.ObjectId(bankAccountId),
            status: EducatorWithdrawalStatus.PENDING,
        });

        // Deduct from balance immediately on request
        wallet.balance -= amount;
        wallet.totalWithdrawn += amount;
        await wallet.save();

        return withdrawal;
    }

    async getWithdrawals(educatorId: string) {
        return this.educatorWalletWithdrawModel.find({ educatorId: new Types.ObjectId(educatorId) }).sort({ createdAt: -1 });
    }

    async updateWithdrawalStatus(withdrawalId: string, status: EducatorWithdrawalStatus, transactionReference?: string, adminNote?: string) {
        const withdrawal = await this.educatorWalletWithdrawModel.findById(withdrawalId);
        if (!withdrawal) throw new NotFoundException('Withdrawal request not found');

        if (withdrawal.status !== EducatorWithdrawalStatus.PENDING && withdrawal.status !== EducatorWithdrawalStatus.APPROVED) {
            throw new BadRequestException(`Cannot update withdrawal from status ${withdrawal.status}`);
        }

        withdrawal.status = status;
        if (transactionReference) withdrawal.transactionReference = transactionReference;
        if (adminNote) withdrawal.adminNote = adminNote;

        await withdrawal.save();

        if (status === EducatorWithdrawalStatus.REJECTED) {
            // Refund the balance
            const wallet = await this.educatorWalletModel.findOne({ educatorId: withdrawal.educatorId });
            if (wallet) {
                wallet.balance += withdrawal.amount;
                wallet.totalWithdrawn -= withdrawal.amount;
                await wallet.save();
            }
        } else if (status === EducatorWithdrawalStatus.PROCESSED) {
            // Log a transaction record for the withdrawal when processed
            const wallet = await this.educatorWalletModel.findOne({ educatorId: withdrawal.educatorId });
            if (wallet) {
                await this.educatorWalletTransactionModel.create({
                    walletId: wallet._id,
                    educatorId: wallet.educatorId,
                    amount: withdrawal.amount,
                    type: EducatorWalletTransactionType.DEBIT,
                    reason: EducatorWalletTransactionReason.WITHDRAWAL,
                    description: `Withdrawal processed. Ref: ${transactionReference || 'N/A'}`,
                    balanceAfterTransaction: wallet.balance,
                });
            }
        }

        return withdrawal;
    }
}
