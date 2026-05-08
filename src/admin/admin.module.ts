import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Vendor, VendorSchema } from 'src/vendor/schema/vendor.schema';
import { Mongoose } from 'mongoose';
import { User, UserSchema } from 'src/user/schema/user.schema';
import { Category, CategorySchema } from 'src/product/schema/category.schema';
import { Product, ProductSchema } from 'src/product/schema/product.schema';

@Module({
  imports:[
    MongooseModule.forFeature([{name:Vendor.name,schema:VendorSchema}]),
    MongooseModule.forFeature([{name:User.name,schema:UserSchema}]),
    MongooseModule.forFeature([{name:Category.name,schema:CategorySchema}]),
    MongooseModule.forFeature([{name:Product.name,schema:ProductSchema}])

],
  providers: [AdminService],
  controllers: [AdminController]
})
export class AdminModule {}
