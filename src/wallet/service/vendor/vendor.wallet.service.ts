import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { VendorWalletDocument, VendorWallet } from '../../schema/vendor/vendor.wallet.schema';
import { VendorWalletTransactionDocument, VendorWalletTransaction } from '../../schema/vendor/vendor.wallet.transactions';
import { VendorWalletWithdrawDocument, VendorWalletWithdraw, VendorWithdrawalStatus } from '../../schema/vendor/vendor.wallet.withdraw.schema';

@Injectable()
export class VendorWalletService {
    constructor(
        @InjectModel(VendorWallet.name) private readonly vendorWalletModel: Model<VendorWalletDocument>,
        @InjectModel(VendorWalletTransaction.name) private readonly vendorWalletTransactionModel: Model<VendorWalletTransactionDocument>,
        @InjectModel(VendorWalletWithdraw.name) private readonly vendorWalletWithdrawModel: Model<VendorWalletWithdrawDocument>,
    ) {}

    async getBalance(vendorId: string) {
        const wallet = await this.vendorWalletModel.findOne({ vendorId: new Types.ObjectId(vendorId) });
        if (!wallet) throw new NotFoundException('Wallet not found');
        return { balance: wallet.balance, pendingBalance: wallet.pendingBalance, totalEarnings: wallet.totalEarnings };
    }

    async getTransactions(vendorId: string) {
        return this.vendorWalletTransactionModel.find({ vendorId: new Types.ObjectId(vendorId) }).sort({ createdAt: -1 });
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
}
