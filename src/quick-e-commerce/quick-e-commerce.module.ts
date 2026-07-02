import { Module } from '@nestjs/common';
import { QuickECommerceService } from './quick-e-commerce.service';
import { QuickECommerceController } from './quick-e-commerce.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from 'src/product/schema/product.schema';
import { Category, CategorySchema } from 'src/product/schema/category.schema';
import { User, UserSchema } from 'src/user/schema/user.schema';
import { Address, AddressSchema } from 'src/address/schema/address.schema';
import { Vendor, VendorSchema } from 'src/vendor/schema/vendor.schema';
import { ProductVariant, ProductVariantSchema } from 'src/product/schema/product-variant.schema';
import { DeliveryPerson, DeliveryPersonSchema } from './schema/delivery-person.schema';
import { DeliveryPersonService } from './delivery-person.service';
import { DeliveryPersonController } from './delivery-person.controller';
import { QuickVendorController } from './quick-vendor.controller';
import { QuickVendorService } from './quick-vendor.service';
import { QuickAdminController } from './quick-admin.controller';
import { QuickAdminService } from './quick-admin.service';
import { VendorQuickOrder, VendorOrderSchema } from './schema/quick-vendor-order.schema';
import { QuickOrder, QuickOrderSchema } from './schema/quick-order.schema';
import { QuickDeliveryCart, QuickDeliveryCartSchema } from './schema/quick-delivery-cart';
import { QuickDeliveryCartController } from './quick-delivery-cart.controller';
import { QuickDeliveryCartService } from './quick-delivery-cart.service';

@Module({
  imports: [MongooseModule.forFeature([
    { name: Product.name, schema: ProductSchema }, 
    { name: Category.name, schema: CategorySchema }, 
    { name: User.name, schema: UserSchema }, 
    { name: Address.name, schema: AddressSchema },
    { name: Vendor.name, schema: VendorSchema },
    { name: ProductVariant.name, schema: ProductVariantSchema },
    { name: DeliveryPerson.name, schema: DeliveryPersonSchema },
    { name: VendorQuickOrder.name, schema: VendorOrderSchema },
    { name: QuickOrder.name, schema: QuickOrderSchema },
    { name: QuickDeliveryCart.name, schema: QuickDeliveryCartSchema }
  ])],
  providers: [
    QuickECommerceService, 
    DeliveryPersonService,
    QuickVendorService,
    QuickAdminService,
    QuickDeliveryCartService
  ],
  controllers: [
    QuickECommerceController, 
    DeliveryPersonController,
    QuickVendorController,
    QuickAdminController,
    QuickDeliveryCartController
  ]
})
export class QuickECommerceModule { }
