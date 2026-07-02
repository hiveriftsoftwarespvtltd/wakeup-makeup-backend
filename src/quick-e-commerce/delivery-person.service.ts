import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DeliveryPerson, DeliveryPersonDocument } from './schema/delivery-person.schema';
import { CreateDeliveryPersonDto, UpdateDeliveryPersonDto } from './dto/delivery-person.dto';

import { filteredObject } from 'src/utils/helper';

@Injectable()
export class DeliveryPersonService {
  constructor(
    @InjectModel(DeliveryPerson.name) private deliveryPersonModel: Model<DeliveryPersonDocument>,
  ) { }

  async createDeliveryPerson(vendorId: string, dto: CreateDeliveryPersonDto) {

    const deliveryPerson = new this.deliveryPersonModel({
      ...dto,
      vendorId: new Types.ObjectId(vendorId),
    });
    return await deliveryPerson.save();
  }

  async getDeliveryPersons(vendorId: string) {
    return await this.deliveryPersonModel.find({
      vendorId: new Types.ObjectId(vendorId),
      isDeleted: false,
    });
  }

  async updateDeliveryPerson(vendorId: string, id: string, dto: UpdateDeliveryPersonDto) {
    const filteredFields = filteredObject(dto)
    const updated = await this.deliveryPersonModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), vendorId: new Types.ObjectId(vendorId), isDeleted: false },
      { $set: filteredFields },
      { new: true }
    );
    if (!updated) {
      throw new NotFoundException('Delivery person not found');
    }
    return updated;
  }

  async deleteDeliveryPerson(vendorId: string, id: string) {
    const deleted = await this.deliveryPersonModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), vendorId: new Types.ObjectId(vendorId), isDeleted: false },
      { $set: { isDeleted: true, isActive: false } },
      { new: true }
    );
    if (!deleted) {
      throw new NotFoundException('Delivery person not found');
    }
    return { message: 'Delivery person deleted successfully' };
  }
}
