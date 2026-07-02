import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QuickDeliveryCart, QuickDeliveryCartDocument } from './schema/quick-delivery-cart';
import { AddToCartDto, DecreaseCartItemDto, RemoveCartItemDto } from './dto/quick-delivery-cart.dto';
import { Product, ProductDocument } from 'src/product/schema/product.schema';
import { ProductVariant, ProductVariantDocument } from 'src/product/schema/product-variant.schema';

@Injectable()
export class QuickDeliveryCartService {
  constructor(
    @InjectModel(QuickDeliveryCart.name) private cartModel: Model<QuickDeliveryCartDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(ProductVariant.name) private variantModel: Model<ProductVariantDocument>,
  ) { }

  async getCart(userId: string) {
    let cart = await this.cartModel
      .findOne({ user: new Types.ObjectId(userId) })
      .populate('items.product','_id name slug description')
      .populate({
        path: 'items.variant',
        select: '_id productId attributes salesPrice offeredPrice stock',
        populate: {
          path: "thumbnail",
          select: "_id publicId url"
        }
      })
      // .populate('items.variant')
      .exec();

    if (!cart) {
      cart = await this.cartModel.create({ user: new Types.ObjectId(userId), items: [] });
    }

    return {
      message: 'Cart retrieved successfully',
      data: cart,
    };
  }

  async addOrUpdateItem(userId: string, dto: AddToCartDto) {
    const product = await this.productModel.findById(dto.productId);
    if (!product || product.isDeleted || !product.isActive) {
      throw new NotFoundException('Product not found or unavailable');
    }

    const variant = await this.variantModel.findOne({
      _id: new Types.ObjectId(dto.variantId),
      productId: new Types.ObjectId(dto.productId),
      isDeleted: false,
      isActive: true,
    });

    if (!variant) {
      throw new NotFoundException('Product variant not found or unavailable');
    }

    let cart = await this.cartModel.findOne({ user: new Types.ObjectId(userId) });
    if (!cart) {
      cart = await this.cartModel.create({ user: new Types.ObjectId(userId), items: [] });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === dto.productId && item.variant.toString() === dto.variantId
    );

    const qtyToAdd = dto.quantity || 1;

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += qtyToAdd;
    } else {
      cart.items.push({
        product: new Types.ObjectId(dto.productId),
        variant: new Types.ObjectId(dto.variantId),
        quantity: qtyToAdd,
      });
    }

    await cart.save();

    return {
      message: 'Item added to cart successfully',
      data: cart,
    };
  }

  async decreaseItem(userId: string, dto: DecreaseCartItemDto) {
    const cart = await this.cartModel.findOne({ user: new Types.ObjectId(userId) });
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === dto.productId && item.variant.toString() === dto.variantId
    );

    if (existingItemIndex > -1) {
      if (cart.items[existingItemIndex].quantity > 1) {
        cart.items[existingItemIndex].quantity -= 1;
      } else {
        cart.items.splice(existingItemIndex, 1);
      }
      await cart.save();
    }

    return {
      message: 'Cart item decreased successfully',
      data: cart,
    };
  }

  async removeItem(userId: string, dto: RemoveCartItemDto) {
    const cart = await this.cartModel.findOne({ user: new Types.ObjectId(userId) });
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    cart.items = cart.items.filter(
      (item) => !(item.product.toString() === dto.productId && item.variant.toString() === dto.variantId)
    );

    await cart.save();

    return {
      message: 'Item removed from cart successfully',
      data: cart,
    };
  }

  async clearCart(userId: string) {
    const cart = await this.cartModel.findOne({ user: new Types.ObjectId(userId) });
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    cart.items = [];
    await cart.save();

    return {
      message: 'Cart cleared successfully',
      data: cart,
    };
  }
}
