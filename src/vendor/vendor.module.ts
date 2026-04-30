import { Module } from '@nestjs/common';
import { VendorService } from './vendor.service';
import { VendorController } from './vendor.controller';

@Module({
  providers: [VendorService],
  controllers: [VendorController]
})
export class VendorModule {}
