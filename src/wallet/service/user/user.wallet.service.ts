import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserWalletDocument, UserWallet } from '../../schema/user/user.wallet.schema';
import { WalletTransactionDocument, WalletTransaction, WalletTransactionType, WalletTransactionReason } from '../../schema/user/user.wallet.transactions';
import { UserWalletTopupDocument, UserWalletTopup, WalletTopupStatus } from '../../schema/user/user.wallet.topup.schema';

@Injectable()
export class UserWalletService {
    constructor(
        @InjectModel(UserWallet.name) private readonly userWalletModel: Model<UserWalletDocument>,
        @InjectModel(WalletTransaction.name) private readonly walletTransactionModel: Model<WalletTransactionDocument>,
        @InjectModel(UserWalletTopup.name) private readonly userWalletTopupModel: Model<UserWalletTopupDocument>,
    ) {}

    async getBalance(userId: string) {
        const wallet = await this.userWalletModel.findOne({ userId: new Types.ObjectId(userId) });
        if (!wallet) throw new NotFoundException('Wallet not found');
        return { balance: wallet.balance, totalCredits: wallet.totalCredits, totalDebits: wallet.totalDebits };
    }

    async getTransactions(userId: string) {
        return this.walletTransactionModel.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 });
    }

    async initiateTopup(userId: string, amount: number) {
        if (amount <= 0) throw new BadRequestException('Amount must be greater than zero');
        
        // Mock order ID creation - in real scenario, this comes from a payment gateway
        const orderId = 'ORDER_' + Date.now(); 
        
        const topup = await this.userWalletTopupModel.create({
            userId: new Types.ObjectId(userId),
            amount,
            orderId,
            status: WalletTopupStatus.PENDING,
        });

        return topup;
    }

    async addBalance(userId: string, amount: number, reason: WalletTransactionReason, description?: string) {
        if (amount <= 0) throw new BadRequestException('Amount must be greater than zero');
        
        const wallet = await this.userWalletModel.findOne({ userId: new Types.ObjectId(userId) });
        if (!wallet) throw new NotFoundException('Wallet not found');

        wallet.balance += amount;
        wallet.totalCredits += amount;
        await wallet.save();

        const transaction = await this.walletTransactionModel.create({
            walletId: wallet._id,
            userId: new Types.ObjectId(userId),
            amount,
            type: WalletTransactionType.CREDIT,
            reason: reason,
            description,
            balanceAfterTransaction: wallet.balance,
        });

        return { wallet, transaction };
    }
}
