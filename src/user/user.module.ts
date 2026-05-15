import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schema/user.schema';
import { Media, MediaSchema } from 'src/document/schema/document.schema';
import { DocumentModule } from 'src/document/document.module';
import { Product, ProductSchema } from 'src/product/schema/product.schema';
import { AddressModule } from 'src/address/address.module';
import { Wishlist, WishlistSchema } from 'src/wishlist/schema/wishlist.schema';

@Module({
  imports:[
    MongooseModule.forFeature([{name:User.name,schema:UserSchema}]),
    MongooseModule.forFeature([{name:Media.name,schema:MediaSchema}]),
    MongooseModule.forFeature([{name:Product.name,schema:ProductSchema}]),
    MongooseModule.forFeature([{name:Wishlist.name,schema:WishlistSchema}]),
    DocumentModule,
    AddressModule
  ],
  providers: [UserService],
  controllers: [UserController],
  exports:[UserService,MongooseModule]
})
export class UserModule {}
