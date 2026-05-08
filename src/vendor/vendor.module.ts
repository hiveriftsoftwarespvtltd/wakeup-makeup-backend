import { Module } from '@nestjs/common';
import { VendorService } from './vendor.service';
import { VendorController } from './vendor.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Vendor, VendorSchema } from './schema/vendor.schema';
import { User, UserSchema } from 'src/user/schema/user.schema';

@Module({
  imports:[MongooseModule.forFeature([{name:Vendor.name,schema:VendorSchema}]),MongooseModule.forFeature([{name:User.name,schema:UserSchema}])],
  providers: [VendorService],
  controllers: [VendorController]
})
export class VendorModule {}
