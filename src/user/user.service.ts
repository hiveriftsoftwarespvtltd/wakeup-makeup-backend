import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schema/user.schema';
import { Model, Types } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Media, MediaDocument } from 'src/document/schema/document.schema';
import { DocumentService } from 'src/document/document.service';

import { StorageFactory } from 'src/document/storage/storage.factory';
import { ApiResponse } from 'src/common/responses/api-response';
import {
  Product,
  ProductDocument,
  ProductStatus,
} from 'src/product/schema/product.schema';
import { AddressService } from 'src/address/address.service';
import { AddAddressDTO, UpdateAddressDTO } from 'src/address/dto/address.dto';
import {
  Wishlist,
  WishlistDocument,
} from 'src/wishlist/schema/wishlist.schema';
import { ShiprocketService } from 'src/shiprocket/shiprocket.service';
import { Address, AddressDocument } from 'src/address/schema/address.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Media.name) private mediaModel: Model<MediaDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Wishlist.name) private wishlistModel: Model<WishlistDocument>,
    @InjectModel(Address.name) private addressModel: Model<AddressDocument>,
    private documentService: DocumentService,
    private StorageFactory: StorageFactory,
    private addressService: AddressService,
    private shiprocketService: ShiprocketService,
  ) {}

  async create(dto: CreateUserDto) {
    return this.userModel.create(dto);
  }

  async findAll() {
    return this.userModel.find().select('-password');
  }

  async findById(id: string) {
    const user = await this.userModel.findById(id).select('-password');
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string) {
    const user = await this.userModel.findOne({ email });
    return user;
  }

  async updateUser(userId: string, dto: UpdateUserDto) {
    const user = await this.userModel
      .findById(userId)
      .select('email name phone role');
    if (!user) {
      throw new NotFoundException('User Not Found');
    }

    if (dto.name.trim()) user.name = dto.name;
    if (dto.phone.trim()) user.phone = dto.phone;

    await user.save();
    return ApiResponse.success('Your changes updated successfully', user, 200);
  }

  async removeUser(id: string) {
    const user = await this.userModel.findByIdAndDelete(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return { message: 'User deleted successfully' };
  }

  async deletAccount(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found ');
    }

    user.isDeleted = true;
    user.save();

    return ApiResponse.success('Your Account deleted Successfully', null, 200);
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!file) {
      throw new BadRequestException('File is required');
    }
    const response = await this.documentService.upload(file, 'avatar', userId);

    const newMedia = response;

    if (user.avatar) {
      const oldMedia = await this.mediaModel.findById(user.avatar);

      if (oldMedia) {
        const storage = this.StorageFactory.getStorage(oldMedia.storage);
        await storage.delete(oldMedia.publicId);
        await oldMedia.deleteOne();
      }
    }

    if (!newMedia || !newMedia._id) {
      throw new BadRequestException('Upload failed');
    }

    user.avatar = newMedia._id;
    await user.save();

    return ApiResponse.success(
      'User Avatar Changes Successfully',
      newMedia.url,
      200,
    );
  }

  async deleteUserAvatar(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.avatar) {
      throw new NotFoundException('Avatar not found for this user');
    }

    const media = await this.mediaModel.findById(user.avatar);
    if (media) {
      const storage = await this.StorageFactory.getStorage(media.storage);
      await storage.delete(media.publicId);
      await media.deleteOne();
    }

    user.avatar = undefined;
    await user.save();
    return ApiResponse.success('Avatar Deleted Successfully', 200);
  }

  async getUserAvatar(userId: string) {
    const user = await this.userModel.findById(userId).populate('avatar');

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.avatar) {
      throw new NotFoundException('User Avatar not found');
    }
    return ApiResponse.success('User avatar fetched successfully', user, 200);
  }

  // async fetchProducts(
  //   userId: string,
  //   category?: string,
  //   minPrice?: number,
  //   maxPrice?: number,
  // ) {
  //   const matchStage: any = {
  //     isDeleted: false,
  //     isActive: true,
  //     status: ProductStatus.ACTIVE,
  //   };

  //   const pipeline: any[] = [
  //     {
  //       $match: matchStage,
  //     },

  //     {
  //       $lookup: {
  //         from: 'categories',
  //         localField: 'categoryId',
  //         foreignField: '_id',
  //         as: 'category',
  //       },
  //     },

  //     {
  //       $unwind: {
  //         path: '$category',
  //         preserveNullAndEmptyArrays: true,
  //       },
  //     },

  //     ...(category
  //       ? [
  //           {
  //             $match: {
  //               'category.name': {
  //                 $regex: new RegExp(`^${category}$`, 'i'),
  //               },
  //             },
  //           },
  //         ]
  //       : []),

  //     {
  //       $lookup: {
  //         from: 'productvariants',
  //         localField: 'variants',
  //         foreignField: '_id',
  //         as: 'variants',
  //       },
  //     },

  //     ...(minPrice || maxPrice
  //       ? [
  //           {
  //             $match: {
  //               variants: {
  //                 $elemMatch: {
  //                   ...(minPrice && {
  //                     price: { $gte: Number(minPrice) },
  //                   }),
  //                   ...(maxPrice && {
  //                     price: { $lte: Number(maxPrice) },
  //                   }),
  //                 },
  //               },
  //             },
  //           },
  //         ]
  //       : []),

  //     {
  //       $lookup: {
  //         from: 'vendors',
  //         localField: 'vendorId',
  //         foreignField: '_id',
  //         as: 'vendor',
  //       },
  //     },

  //     {
  //       $unwind: {
  //         path: '$vendor',
  //         preserveNullAndEmptyArrays: true,
  //       },
  //     },

  //     {
  //       $lookup: {
  //         from: 'media',
  //         localField: 'variants.thumbnail',
  //         foreignField: '_id',
  //         as: 'thumbnails',
  //       },
  //     },

  //     // images
  //     {
  //       $lookup: {
  //         from: 'media',
  //         localField: 'variants.images',
  //         foreignField: '_id',
  //         as: 'images',
  //       },
  //     },

  //     {
  //       $project: {
  //         name: 1,
  //         slug: 1,
  //         description: 1,

  //         category: {
  //           _id: '$category._id',
  //           name: '$category.name',
  //         },

  //         vendor: {
  //           _id: '$vendor._id',
  //           businessName: '$vendor.businessName',
  //           vendorPincode: '$vendor.vendorPincode',
  //         },

  //         variants: {
  //           $map: {
  //             input: '$variants',
  //             as: 'variant',
  //             in: {
  //               _id: '$$variant._id',
  //               sku: '$$variant.sku',
  //               price: '$$variant.price',
  //               salesPrice: '$$variant.salesPrice',
  //               stock: '$$variant.stock',

  //               thumbnail: {
  //                 $arrayElemAt: [
  //                   {
  //                     $filter: {
  //                       input: '$thumbnails',
  //                       as: 'thumb',
  //                       cond: {
  //                         $eq: ['$$thumb._id', '$$variant.thumbnail'],
  //                       },
  //                     },
  //                   },
  //                   0,
  //                 ],
  //               },

  //               images: {
  //                 $filter: {
  //                   input: '$images',
  //                   as: 'image',
  //                   cond: {
  //                     $in: ['$$image._id', '$$variant.images'],
  //                   },
  //                 },
  //               },
  //             },
  //           },
  //         },
  //       },
  //     },
  //   ];

  //   const products = await this.productModel.aggregate(pipeline);

  //   let userPincode: string | null = null;

  //   if (userId) {
  //     const defaultAddress = await this.addressModel.findOne({
  //       user: new Types.ObjectId(userId),
  //     });

  //     if (defaultAddress) {
  //       userPincode = defaultAddress.pincode;
  //     }
  //   }

  //   const updatedProducts = await Promise.all(
  //     products.map(async (product: any) => {
  //       const variants = await Promise.all(
  //         product.variants.map(async (variant: any) => {
  //           let shipping: any = null;

  //           if (userPincode) {
  //             shipping =
  //               await this.shiprocketService.calculateShippingForVariant(
  //                 product.vendor?.vendorPincode,
  //                 userPincode,
  //                 variant,
  //                 0,
  //               );
  //           }

  //           return {
  //             ...variant,
  //             shipping,
  //           };
  //         }),
  //       );

  //       return {
  //         ...product,
  //         variants,
  //       };
  //     }),
  //   );

  //   return ApiResponse.success(
  //     'Products fetched successfully',
  //     updatedProducts,
  //   );
  // }

//   async fetchProducts(
//   userId: string,
//   category?: string,
//   minPrice?: number,
//   maxPrice?: number,
//   search?: string,
// ) {
//   const matchStage: any = {
//     isDeleted: false,
//     isActive: true,
//     status: ProductStatus.ACTIVE,
//   };

//   const pipeline: any[] = [
//     {
//       $match: matchStage,
//     },

//     // Category Lookup
//     {
//       $lookup: {
//         from: 'categories',
//         localField: 'categoryId',
//         foreignField: '_id',
//         as: 'category',
//       },
//     },

//     {
//       $unwind: {
//         path: '$category',
//         preserveNullAndEmptyArrays: true,
//       },
//     },

//     // Category Filter
//     ...(category
//       ? [
//           {
//             $match: {
//               'category.name': {
//                 $regex: category,
//                 $options: 'i',
//               },
//             },
//           },
//         ]
//       : []),

//     // Variants Lookup
//     {
//       $lookup: {
//         from: 'productvariants',
//         localField: 'variants',
//         foreignField: '_id',
//         as: 'variants',
//       },
//     },

//     // Search Filter
//     ...(search
//       ? [
//           {
//             $match: {
//               $or: [
//                 {
//                   name: {
//                     $regex: search,
//                     $options: 'i',
//                   },
//                 },
//                 {
//                   tags: {
//                     $elemMatch: {
//                       $regex: search,
//                       $options: 'i',
//                     },
//                   },
//                 },
//                 {
//                   'variants.sku': {
//                     $regex: search,
//                     $options: 'i',
//                   },
//                 },
//                 {
//                   'category.name': {
//                     $regex: search,
//                     $options: 'i',
//                   },
//                 },
//               ],
//             },
//           },
//         ]
//       : []),

//     // Price Filter (using offeredPrice)
//     ...(minPrice || maxPrice
//       ? [
//           {
//             $match: {
//               variants: {
//                 $elemMatch: {
//                   offeredPrice: {
//                     ...(minPrice
//                       ? { $gte: Number(minPrice) }
//                       : {}),
//                     ...(maxPrice
//                       ? { $lte: Number(maxPrice) }
//                       : {}),
//                   },
//                 },
//               },
//             },
//           },
//         ]
//       : []),

//     // Vendor Lookup
//     {
//       $lookup: {
//         from: 'vendors',
//         localField: 'vendorId',
//         foreignField: '_id',
//         as: 'vendor',
//       },
//     },

//     {
//       $unwind: {
//         path: '$vendor',
//         preserveNullAndEmptyArrays: true,
//       },
//     },

//     // Variant Thumbnails
//     {
//       $lookup: {
//         from: 'media',
//         localField: 'variants.thumbnail',
//         foreignField: '_id',
//         as: 'thumbnails',
//       },
//     },

//     // Variant Images
//     {
//       $lookup: {
//         from: 'media',
//         localField: 'variants.images',
//         foreignField: '_id',
//         as: 'images',
//       },
//     },

//     {
//       $project: {
//         name: 1,
//         slug: 1,
//         description: 1,
//         averageRating: 1,
//         totalReviews: 1,
//         isShippingApply: 1,

//         category: {
//           _id: '$category._id',
//           name: '$category.name',
//           label: '$category.label',
//           slug: '$category.slug',
//         },

//         vendor: {
//           _id: '$vendor._id',
//           businessName: '$vendor.businessName',
//           vendorPincode: '$vendor.vendorPincode',
//         },

//         variants: {
//           $map: {
//             input: '$variants',
//             as: 'variant',
//             in: {
//               _id: '$$variant._id',
//               sku: '$$variant.sku',

//               costPrice: '$$variant.costPrice',
//               salesPrice: '$$variant.salesPrice',
//               offeredPrice: '$$variant.offeredPrice',

//               stock: '$$variant.stock',

//               weight: '$$variant.weight',
//               length: '$$variant.length',
//               width: '$$variant.width',
//               height: '$$variant.height',

//               attributes: '$$variant.attributes',

//               thumbnail: {
//                 $arrayElemAt: [
//                   {
//                     $filter: {
//                       input: '$thumbnails',
//                       as: 'thumb',
//                       cond: {
//                         $eq: [
//                           '$$thumb._id',
//                           '$$variant.thumbnail',
//                         ],
//                       },
//                     },
//                   },
//                   0,
//                 ],
//               },

//               images: {
//                 $filter: {
//                   input: '$images',
//                   as: 'image',
//                   cond: {
//                     $in: [
//                       '$$image._id',
//                       '$$variant.images',
//                     ],
//                   },
//                 },
//               },
//             },
//           },
//         },
//       },
//     },
//   ];

//   const products = await this.productModel.aggregate(pipeline);

//   let userPincode: string | null = null;

//   if (userId) {
//     const defaultAddress = await this.addressModel.findOne({
//       user: new Types.ObjectId(userId),
//     });

//     if (defaultAddress) {
//       userPincode = defaultAddress.pincode;
//     }
//   }

//   const updatedProducts = await Promise.all(
//     products.map(async (product: any) => {
//       const variants = await Promise.all(
//         product.variants.map(async (variant: any) => {
//           let shipping:any = null;

//           if (
//             userPincode &&
//             product.vendor?.vendorPincode &&
//             product.isShippingApply
//           ) {
//             shipping =
//               await this.shiprocketService.calculateShippingForVariant(
//                 product.vendor.vendorPincode,
//                 userPincode,
//                 variant,
//                 0,
//               );
//           }

//           return {
//             ...variant,
//             shipping,
//           };
//         }),
//       );

//       return {
//         ...product,
//         variants,
//       };
//     }),
//   );

//   return ApiResponse.success(
//     'Products fetched successfully',
//     updatedProducts,
//   );
// }

async fetchProducts(
  userId: string,
  category?: string,
  minPrice?: number,
  maxPrice?: number,
  search?: string,
  page = 1,
  limit = 10,
) {
  page = Math.max(1, Number(page) || 1);
  limit = Math.max(1, Number(limit) || 10);

  const skip = (page - 1) * limit;

  const matchStage: any = {
    isDeleted: false,
    isActive: true,
    status: ProductStatus.ACTIVE,
  };

  const pipeline: any[] = [
    {
      $match: matchStage,
    },

    // Category Lookup
    {
      $lookup: {
        from: 'categories',
        localField: 'categoryId',
        foreignField: '_id',
        as: 'category',
      },
    },

    {
      $unwind: {
        path: '$category',
        preserveNullAndEmptyArrays: true,
      },
    },

    // Category Filter
    ...(category
      ? [
          {
            $match: {
              'category.name': {
                $regex: category,
                $options: 'i',
              },
            },
          },
        ]
      : []),

    // Variants Lookup
    {
      $lookup: {
        from: 'productvariants',
        localField: 'variants',
        foreignField: '_id',
        as: 'variants',
      },
    },

    // Search Filter
    ...(search
      ? [
          {
            $match: {
              $or: [
                {
                  name: {
                    $regex: search,
                    $options: 'i',
                  },
                },
                {
                  tags: {
                    $elemMatch: {
                      $regex: search,
                      $options: 'i',
                    },
                  },
                },
                {
                  'category.name': {
                    $regex: search,
                    $options: 'i',
                  },
                },
                {
                  'variants.sku': {
                    $regex: search,
                    $options: 'i',
                  },
                },
              ],
            },
          },
        ]
      : []),

    // Offered Price Filter
    ...(minPrice || maxPrice
      ? [
          {
            $match: {
              variants: {
                $elemMatch: {
                  offeredPrice: {
                    ...(minPrice
                      ? { $gte: Number(minPrice) }
                      : {}),
                    ...(maxPrice
                      ? { $lte: Number(maxPrice) }
                      : {}),
                  },
                },
              },
            },
          },
        ]
      : []),

    // Vendor Lookup
    {
      $lookup: {
        from: 'vendors',
        localField: 'vendorId',
        foreignField: '_id',
        as: 'vendor',
      },
    },

    {
      $unwind: {
        path: '$vendor',
        preserveNullAndEmptyArrays: true,
      },
    },

    // Thumbnail Lookup
    {
      $lookup: {
        from: 'media',
        localField: 'variants.thumbnail',
        foreignField: '_id',
        as: 'thumbnails',
      },
    },

    // Images Lookup
    {
      $lookup: {
        from: 'media',
        localField: 'variants.images',
        foreignField: '_id',
        as: 'images',
      },
    },

    {
      $project: {
        name: 1,
        slug: 1,
        description: 1,
        averageRating: 1,
        totalReviews: 1,
        isShippingApply: 1,
        createdAt: 1,

        category: {
          _id: '$category._id',
          name: '$category.name',
          label: '$category.label',
          slug: '$category.slug',
        },

        vendor: {
          _id: '$vendor._id',
          businessName: '$vendor.businessName',
          vendorPincode: '$vendor.vendorPincode',
        },

        variants: {
          $filter: {
            input: {
              $map: {
                input: '$variants',
                as: 'variant',
                in: {
                  _id: '$$variant._id',
                  sku: '$$variant.sku',

                  costPrice: '$$variant.costPrice',
                  salesPrice: '$$variant.salesPrice',
                  offeredPrice: '$$variant.offeredPrice',

                  stock: '$$variant.stock',

                  weight: '$$variant.weight',
                  length: '$$variant.length',
                  width: '$$variant.width',
                  height: '$$variant.height',

                  attributes: '$$variant.attributes',

                  thumbnail: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: '$thumbnails',
                          as: 'thumb',
                          cond: {
                            $eq: [
                              '$$thumb._id',
                              '$$variant.thumbnail',
                            ],
                          },
                        },
                      },
                      0,
                    ],
                  },

                  images: {
                    $filter: {
                      input: '$images',
                      as: 'image',
                      cond: {
                        $in: [
                          '$$image._id',
                          '$$variant.images',
                        ],
                      },
                    },
                  },
                },
              },
            },

            // Return only matching variants when price filter is applied
            as: 'variant',
            cond:
              minPrice || maxPrice
                ? {
                    $and: [
                      ...(minPrice
                        ? [
                            {
                              $gte: [
                                '$$variant.offeredPrice',
                                Number(minPrice),
                              ],
                            },
                          ]
                        : []),
                      ...(maxPrice
                        ? [
                            {
                              $lte: [
                                '$$variant.offeredPrice',
                                Number(maxPrice),
                              ],
                            },
                          ]
                        : []),
                    ],
                  }
                : true,
          },
        },
      },
    },

    // Remove products having no variants after filtering
    ...(minPrice || maxPrice
      ? [
          {
            $match: {
              'variants.0': { $exists: true },
            },
          },
        ]
      : []),

    {
      $sort: {
        createdAt: -1,
      },
    },

    {
      $facet: {
        data: [
          {
            $skip: skip,
          },
          {
            $limit: limit,
          },
        ],

        totalCount: [
          {
            $count: 'count',
          },
        ],
      },
    },
  ];

  const result = await this.productModel.aggregate(pipeline);

  const products = result?.[0]?.data || [];

  const total =
    result?.[0]?.totalCount?.[0]?.count || 0;

  const totalPages = Math.ceil(total / limit);

  let userPincode: string | null = null;

  if (userId) {
    const defaultAddress = await this.addressModel.findOne({
      user: new Types.ObjectId(userId),
    });

    if (defaultAddress) {
      userPincode = defaultAddress.pincode;
    }
  }

  const updatedProducts = await Promise.all(
    products.map(async (product: any) => {
      const variants = await Promise.all(
        product.variants.map(async (variant: any) => {
          let shipping: any = null;

          if (
            userPincode &&
            product.vendor?.vendorPincode &&
            product.isShippingApply
          ) {
            try {
              shipping =
                await this.shiprocketService.calculateShippingForVariant(
                  product.vendor.vendorPincode,
                  userPincode,
                  variant,
                  0,
                );
            } catch (error) {
              shipping = null;
            }
          }

          return {
            ...variant,
            shipping,
          };
        }),
      );

      return {
        ...product,
        variants,
      };
    }),
  );

  return ApiResponse.success(
    'Products fetched successfully',
    {
      products: updatedProducts,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    },
  );
}
  async fetchProductDetails(userId: string, productId: string) {
    const product = await this.productModel
      .findById(new Types.ObjectId(productId))
      .populate('categoryId')
      .populate('vendorId')
      .populate({
        path: 'variants',
        populate: [
          {
            path: 'thumbnail',
            select:'_id url publicId'
          },
          {
            path: 'images',
            select:'_id url publicId'
          }
        ],
      })
      .lean();
    if (!product) {
      throw new NotFoundException('Product Not Found');
    }

    let vendor: any = null;
    vendor = product.vendorId;

    if (userId) {
      const wishlist = await this.wishlistModel.findOne({
        user: new Types.ObjectId(userId),
        'items.product': new Types.ObjectId(productId),
      });

      product['isWishlisted'] = !!wishlist;
    }

    let userPincode: string | null = null;

    if (userId) {
      const defaultAddress = await this.addressModel.findOne({
        user: new Types.ObjectId(userId),
        
      });

      if (defaultAddress) {
        userPincode = defaultAddress.pincode;
      }
    }

    const updatedVariants = await Promise.all(
      product.variants.map(async (variant: any) => {
        let shipping: any = null;

        if (userPincode) {
          shipping = await this.shiprocketService.calculateShippingForVariant(
            vendor.vendorPincode,
            userPincode,
            variant,
            0,
          );
        }

        return {
          ...variant,
          shipping,
        };
      }),
    );

    product['variants'] = updatedVariants;

    return ApiResponse.success('Product Details Fetched!', product);
  }

  async addAddress(dto: AddAddressDTO, userId: string) {
    return await this.addressService.addAddress(dto, userId);
  }

  async fetchAddresses(userId: string) {
    return await this.addressService.fetchAddress(userId);
  }

  async fetchAddressDetails(userId: string, addressId: string) {
    return await this.addressService.fetchAddressDetails(userId, addressId);
  }

  async updateAddress(
    dto: UpdateAddressDTO,
    userId: string,
    addressId: string,
  ) {
    return await this.addressService.updateAddress(dto, userId, addressId);
  }

  async deleteAddress(userId: string, addressId: string) {
    return await this.addressService.deleteAddress(userId, addressId);
  }
}
