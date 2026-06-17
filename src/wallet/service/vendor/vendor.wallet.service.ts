import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { VendorWalletDocument, VendorWallet } from '../../schema/vendor/vendor.wallet.schema';
import { VendorWalletTransactionDocument, VendorWalletTransaction } from '../../schema/vendor/vendor.wallet.transactions';
import { VendorWalletWithdrawDocument, VendorWalletWithdraw, VendorWithdrawalStatus } from '../../schema/vendor/vendor.wallet.withdraw.schema';
import { VendorWalletTransactionType, VendorWalletTransactionReason } from '../../schema/vendor/vendor.wallet.transactions';

@Injectable()
export class VendorWalletService {
    constructor(
        @InjectModel(VendorWallet.name) private readonly vendorWalletModel: Model<VendorWalletDocument>,
        @InjectModel(VendorWalletTransaction.name) private readonly vendorWalletTransactionModel: Model<VendorWalletTransactionDocument>,
        @InjectModel(VendorWalletWithdraw.name) private readonly vendorWalletWithdrawModel: Model<VendorWalletWithdrawDocument>,
    ) { }

    async initializeWallet(vendorId: string) {
        const existing = await this.vendorWalletModel.findOne({ vendorId: new Types.ObjectId(vendorId) });
        if (!existing) {
            await this.vendorWalletModel.create({ vendorId: new Types.ObjectId(vendorId) });
        }
    }

    async getBalance(vendorId: string) {
        const wallet = await this.vendorWalletModel.findOne({ vendorId: new Types.ObjectId(vendorId) });
        if (!wallet) throw new NotFoundException('Wallet not found');
        return { balance: wallet.balance, pendingBalance: wallet.pendingBalance, totalEarnings: wallet.totalEarnings };
    }

    async getTransactions(vendorId: string) {
        return this.vendorWalletTransactionModel.find({ vendorId: new Types.ObjectId(vendorId) }).sort({ createdAt: -1 });
    }

    async getAllWallets() {
        return this.vendorWalletModel.find().populate('vendorId', 'businessName email').sort({ createdAt: -1 });
    }

    async addBalance(vendorId: string, amount: number, reason: VendorWalletTransactionReason, description?: string, orderId?: string, session?: any) {
        if (amount <= 0) throw new BadRequestException('Amount must be greater than zero');

        let wallet = session
            ? await this.vendorWalletModel.findOne({ vendorId: new Types.ObjectId(vendorId) }).session(session)
            : await this.vendorWalletModel.findOne({ vendorId: new Types.ObjectId(vendorId) });

        if (!wallet) {
            const walletDocs = await this.vendorWalletModel.create([{
                vendorId: new Types.ObjectId(vendorId),
                balance: 0,
                pendingBalance: 0,
                totalEarnings: 0,
                totalWithdrawn: 0
            }], { session });
            wallet = walletDocs[0];
        }

        wallet.pendingBalance += amount;
        await wallet.save({ session });

        const transactionDocs = await this.vendorWalletTransactionModel.create([{
            walletId: wallet._id,
            vendorId: new Types.ObjectId(vendorId),
            amount,
            type: VendorWalletTransactionType.CREDIT,
            reason,
            orderId: orderId ? new Types.ObjectId(orderId) : undefined,
            description,
            balanceAfterTransaction: wallet.balance,
        }], { session });

        return { wallet, transaction: transactionDocs[0] };
    }

    async requestWithdrawal(vendorId: string, amount: number, bankAccountId: string) {
        if (amount <= 0) throw new BadRequestException('Amount must be greater than zero');

        const wallet = await this.vendorWalletModel.findOne({ vendorId: new Types.ObjectId(vendorId) });
        if (!wallet || wallet.balance < amount) throw new BadRequestException('Insufficient balance');

        const withdrawal = await this.vendorWalletWithdrawModel.create({
            vendorId: new Types.ObjectId(vendorId),
            amount,
            bankAccountId: new Types.ObjectId(bankAccountId),
            status: VendorWithdrawalStatus.PENDING,
        });

        // Deduct from balance immediately on request
        wallet.balance -= amount;
        wallet.totalWithdrawn += amount;
        await wallet.save();

        return withdrawal;
    }

    async getWithdrawals(vendorId: string) {
        return this.vendorWalletWithdrawModel.find({ vendorId: new Types.ObjectId(vendorId) }).sort({ createdAt: -1 });
    }

    async updateWithdrawalStatus(withdrawalId: string, status: VendorWithdrawalStatus, transactionReference?: string, adminNote?: string) {
        const withdrawal = await this.vendorWalletWithdrawModel.findById(withdrawalId);
        if (!withdrawal) throw new NotFoundException('Withdrawal request not found');

        if (withdrawal.status !== VendorWithdrawalStatus.PENDING && withdrawal.status !== VendorWithdrawalStatus.APPROVED) {
            throw new BadRequestException(`Cannot update withdrawal from status ${withdrawal.status}`);
        }

        withdrawal.status = status;
        if (transactionReference) withdrawal.transactionReference = transactionReference;
        if (adminNote) withdrawal.adminNote = adminNote;

        await withdrawal.save();

        if (status === VendorWithdrawalStatus.REJECTED) {
            // Refund the balance
            const wallet = await this.vendorWalletModel.findOne({ vendorId: withdrawal.vendorId });
            if (wallet) {
                wallet.balance += withdrawal.amount;
                wallet.totalWithdrawn -= withdrawal.amount;
                await wallet.save();
            }
        } else if (status === VendorWithdrawalStatus.PROCESSED) {
            // Log a transaction record for the withdrawal when processed
            const wallet = await this.vendorWalletModel.findOne({ vendorId: withdrawal.vendorId });
            if (wallet) {
                await this.vendorWalletTransactionModel.create({
                    walletId: wallet._id,
                    vendorId: wallet.vendorId,
                    amount: withdrawal.amount,
                    type: VendorWalletTransactionType.DEBIT,
                    reason: VendorWalletTransactionReason.WITHDRAWAL,
                    description: `Withdrawal processed. Ref: ${transactionReference || 'N/A'}`,
                    balanceAfterTransaction: wallet.balance,
                });
            }
        }

        return withdrawal;
    }
}
