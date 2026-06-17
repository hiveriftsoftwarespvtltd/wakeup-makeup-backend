import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DistributorWalletDocument, DistributorWallet } from '../../schema/distributor/distributor.wallet.schema';
import { DistributorWalletTransactionDocument, DistributorWalletTransaction } from '../../schema/distributor/distributor.wallet.transactions';
import { DistributorWalletWithdrawDocument, DistributorWalletWithdraw, DistributorWithdrawalStatus } from '../../schema/distributor/distributor.wallet.withdraw.schema';

@Injectable()
export class DistributorWalletService {
    constructor(
        @InjectModel(DistributorWallet.name) private readonly distributorWalletModel: Model<DistributorWalletDocument>,
        @InjectModel(DistributorWalletTransaction.name) private readonly distributorWalletTransactionModel: Model<DistributorWalletTransactionDocument>,
        @InjectModel(DistributorWalletWithdraw.name) private readonly distributorWalletWithdrawModel: Model<DistributorWalletWithdrawDocument>,
    ) {}

    async getBalance(distributorId: string) {
        const wallet = await this.distributorWalletModel.findOne({ distributorId: new Types.ObjectId(distributorId) });
        if (!wallet) throw new NotFoundException('Wallet not found');
        return { balance: wallet.balance, totalEarnings: wallet.totalEarnings };
    }

    async getTransactions(distributorId: string) {
        return this.distributorWalletTransactionModel.find({ distributorId: new Types.ObjectId(distributorId) }).sort({ createdAt: -1 });
    }

    async requestWithdrawal(distributorId: string, amount: number, bankAccountId: string) {
        if (amount <= 0) throw new BadRequestException('Amount must be greater than zero');
        
        const wallet = await this.distributorWalletModel.findOne({ distributorId: new Types.ObjectId(distributorId) });
        if (!wallet || wallet.balance < amount) throw new BadRequestException('Insufficient balance');

        const withdrawal = await this.distributorWalletWithdrawModel.create({
            distributorId: new Types.ObjectId(distributorId),
            amount,
            bankAccountId: new Types.ObjectId(bankAccountId),
            status: DistributorWithdrawalStatus.PENDING,
        });

        // Deduct from balance immediately on request
        wallet.balance -= amount;
        wallet.totalWithdrawn += amount;
        await wallet.save();

        return withdrawal;
    }

    async getWithdrawals(distributorId: string) {
        return this.distributorWalletWithdrawModel.find({ distributorId: new Types.ObjectId(distributorId) }).sort({ createdAt: -1 });
    }
}
