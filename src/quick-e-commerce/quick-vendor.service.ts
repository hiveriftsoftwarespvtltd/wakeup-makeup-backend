import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Vendor, VendorDocument } from "src/vendor/schema/vendor.schema";
import { VendorQuickOrder, VendorOrderDocument } from "./schema/quick-vendor-order.schema";

import { UpdateQuickCommerceDto, QuickVendorDashboardFilterDto } from "./dto/quick-vendor.dto";

@Injectable()
export class QuickVendorService {
    constructor(
      @InjectModel(Vendor.name) private vendorModel: Model<VendorDocument>,
      @InjectModel(VendorQuickOrder.name) private vendorOrderModel: Model<VendorOrderDocument>,
    ) {}

    async updateQuickCommerceDetails(userId: string, updateDto: UpdateQuickCommerceDto) {
        const vendor = await this.vendorModel.findOne({ ownerId: new Types.ObjectId(userId) });
        if (!vendor) {
          throw new NotFoundException('Vendor not found');
        }
    
        if (!vendor.quickCommerce) {
          vendor.quickCommerce = {} as any;
        }
    
        Object.assign(vendor.quickCommerce, updateDto);
        await vendor.save();
    
        return {
          message: 'Quick commerce details updated successfully',
          data: vendor.quickCommerce,
        };
    }

    async getDashboardData(userId: string, filters: QuickVendorDashboardFilterDto) {
        const vendor = await this.vendorModel.findOne({ ownerId: new Types.ObjectId(userId) });
        if (!vendor) {
          throw new NotFoundException('Vendor not found');
        }
    
        const query: any = { vendorId: vendor._id };
    
        if (filters.status) {
          query.status = filters.status;
        }
    
        if (filters.startDate || filters.endDate) {
          query.createdAt = {};
          if (filters.startDate) {
            query.createdAt.$gte = new Date(filters.startDate);
          }
          if (filters.endDate) {
            query.createdAt.$lte = new Date(filters.endDate);
          }
        }
    
        const orders = await this.vendorOrderModel.find(query).sort({ createdAt: -1 }).exec();
        
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    
        return {
          message: 'Dashboard data retrieved successfully',
          data: {
            stats: {
              totalOrders,
              totalRevenue,
            },
            orders,
          },
        };
    }
}
