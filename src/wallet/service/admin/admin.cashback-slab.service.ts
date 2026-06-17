import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CashbackSlabDocument, CashbackSlab } from '../../schema/cashback/cashbacks.slabs.schema';
import { CreateCashbackSlabDto, UpdateCashbackSlabDto } from '../../dto/admin.cashback-slab.dto';
import { ApiResponse } from 'src/common/responses/api-response';

@Injectable()
export class AdminCashbackSlabService {
    constructor(
        @InjectModel(CashbackSlab.name) private readonly cashbackSlabModel: Model<CashbackSlabDocument>,
    ) { }

    async createSlab(dto: CreateCashbackSlabDto) {
        const slab = await this.cashbackSlabModel.create(dto);
        return ApiResponse.success('Cashback slab created successfully', slab);
    }

    async getSlabs() {
        const slabs = await this.cashbackSlabModel.find().sort({ minValue: 1 });
        return ApiResponse.success('Cashback slabs retrieved successfully', slabs);
    }

    async getSlabById(id: string) {
        const slab = await this.cashbackSlabModel.findById(id);
        if (!slab) throw new NotFoundException('Cashback slab not found');
        return ApiResponse.success('Cashback slab retrieved successfully', slab);
    }

    async updateSlab(id: string, dto: UpdateCashbackSlabDto) {
        const slab = await this.cashbackSlabModel.findByIdAndUpdate(
            id,
            { $set: dto },
            { new: true, runValidators: true }
        );
        if (!slab) throw new NotFoundException('Cashback slab not found');
        return ApiResponse.success('Cashback slab updated successfully', slab);
    }

    async deleteSlab(id: string) {
        const slab = await this.cashbackSlabModel.findByIdAndDelete(id);
        if (!slab) throw new NotFoundException('Cashback slab not found');
        return ApiResponse.success('Cashback slab deleted successfully', null);
    }
}
