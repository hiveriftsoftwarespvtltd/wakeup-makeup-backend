import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Cart, CartDocument } from './schema/cart.schema';

import { Model, Types } from 'mongoose';

import {
  Product,
  ProductDocument,
  ProductStatus,
} from 'src/product/schema/product.schema';

import {
  ProductVariant,
  ProductVariantDocument,
} from 'src/product/schema/product-variant.schema';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name)
    private cartModel: Model<CartDocument>,

    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,

    @InjectModel(ProductVariant.name)
    private productVariantModel: Model<ProductVariantDocument>,
  ) {}

  async addToCart(
    userId: string,
    productId: string,
    variantId: string,
    quantity: number = 1,
  ) {

    if (quantity <= 0) {
      throw new BadRequestException(
        'Quantity must be greater than 0',
      );
    }

    const product = await this.productModel.findOne({
      _id: productId,
      isDeleted: false,
      isActive: true,
      status: ProductStatus.ACTIVE,
    });

    if (!product) {
      throw new NotFoundException(
        'Product not found',
      );
    }

    const variant =
      await this.productVariantModel.findOne({
        _id: variantId,
        productId: product._id,
        isActive: true,
      });

    if (!variant) {
      throw new NotFoundException(
        'Variant not found',
      );
    }

    if (variant.stock < quantity) {
      throw new BadRequestException(
        'Insufficient stock',
      );
    }

    let cart = await this.cartModel.findOne({
      user: userId,
    });

    if (!cart) {
      cart = await this.cartModel.create({
        user: userId,
        items: [],
      });
    }

    const existingItem = cart.items.find(
      (item) =>
        item.product.toString() === productId &&
        item.variant.toString() === variantId,
    );

    if (existingItem) {

      const updatedQty =
        existingItem.quantity + quantity;

      if (updatedQty > variant.stock) {
        throw new BadRequestException(
          'Quantity exceeds stock',
        );
      }

      existingItem.quantity = updatedQty;

    } else {

      cart.items.push({
        product: new Types.ObjectId(productId),
        variant: new Types.ObjectId(variantId),
        quantity,
      } as any);
    }

    await cart.save();

    return await this.fetchUserCart(userId);
  }

  async fetchUserCart(userId: string) {

    const cart = await this.cartModel
      .findOne({ user: userId })
      .populate({
        path: 'items.product',
        populate: {
          path: 'categoryId',
        },
      })
      .populate({
        path: 'items.variant',
        populate: [
          {
            path: 'thumbnail',
          },
          {
            path: 'images',
          },
        ],
      });

    return cart || { items: [] };
  }

  async clearUserCart(userId: string) {

    const cart = await this.cartModel.findOne({
      user: userId,
    });

    if (!cart) {
      throw new NotFoundException(
        'Cart not found',
      );
    }

    cart.items = [];

    await cart.save();

    return {
      message: 'Cart cleared successfully',
    };
  }

  async removeItemFromCart(
    userId: string,
    variantId: string,
  ) {

    const cart = await this.cartModel.findOne({
      user: userId,
    });

    if (!cart) {
      throw new NotFoundException(
        'Cart not found',
      );
    }

    const existingItem = cart.items.find(
      (item) =>
        item.variant.toString() === variantId,
    );

    if (!existingItem) {
      throw new NotFoundException(
        'Item not found in cart',
      );
    }

    cart.items = cart.items.filter(
      (item) =>
        item.variant.toString() !== variantId,
    );

    await cart.save();

    return await this.fetchUserCart(userId);
  }

  async decreaseItemQuantity(
    userId: string,
    variantId: string,
    quantity: number = 1,
  ) {

    if (quantity <= 0) {
      throw new BadRequestException(
        'Quantity must be greater than 0',
      );
    }

    const cart = await this.cartModel.findOne({
      user: userId,
    });

    if (!cart) {
      throw new NotFoundException(
        'Cart not found',
      );
    }

    const cartItem = cart.items.find(
      (item) =>
        item.variant.toString() === variantId,
    );

    if (!cartItem) {
      throw new NotFoundException(
        'Item not found in cart',
      );
    }

    cartItem.quantity -= quantity;

    if (cartItem.quantity <= 0) {

      cart.items = cart.items.filter(
        (item) =>
          item.variant.toString() !== variantId,
      );
    }

    await cart.save();

    return await this.fetchUserCart(userId);
  }
}