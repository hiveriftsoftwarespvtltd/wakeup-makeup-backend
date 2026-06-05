import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { InfluencerWalletDocument, InfluencerWallet } from '../../schema/influencer/influencer.wallet.schema';
import { InfluencerWalletTransactionDocument, InfluencerWalletTransaction } from '../../schema/influencer/influencer.wallet.transactions';
import { InfluencerWalletWithdrawDocument, InfluencerWalletWithdraw, InfluencerWithdrawalStatus } from '../../schema/influencer/influencer.wallet.withdraw.schema';

@Injectable()
export class InfluencerWalletService {
    constructor(
        @InjectModel(InfluencerWallet.name) private readonly influencerWalletModel: Model<InfluencerWalletDocument>,
        @InjectModel(InfluencerWalletTransaction.name) private readonly influencerWalletTransactionModel: Model<InfluencerWalletTransactionDocument>,
        @InjectModel(InfluencerWalletWithdraw.name) private readonly influencerWalletWithdrawModel: Model<InfluencerWalletWithdrawDocument>,
    ) {}

    async getBalance(influencerId: string) {
        const wallet = await this.influencerWalletModel.findOne({ influencerId: new Types.ObjectId(influencerId) });
        if (!wallet) throw new NotFoundException('Wallet not found');
        return { balance: wallet.balance, totalEarnings: wallet.totalEarnings };
    }

    async getTransactions(influencerId: string) {
        return this.influencerWalletTransactionModel.find({ influencerId: new Types.ObjectId(influencerId) }).sort({ createdAt: -1 });
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
}
