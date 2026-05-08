import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Product, ProductDocument } from './schema/product.schema';
import { Model } from 'mongoose';
import { ProductVariant, ProductVariantDocument } from './schema/product-variant.schema';
import { Category, CategoryDocument } from './schema/category.schema';
import { CreateCategory } from './dto/create-category.dto';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { Media, MediaDocument } from 'src/document/schema/document.schema';
import { DocumentService } from 'src/document/document.service';
import { StorageFactory } from 'src/document/storage/storage.factory';
import { ApiResponse } from 'src/common/responses/api-response';

@Injectable()
export class ProductService {
    constructor(@InjectModel(Product.name) private productModel:Model<ProductDocument>, @InjectModel(ProductVariant.name) private productVariantModel:Model<ProductVariantDocument>,@InjectModel(Category.name) private categoryModel:Model<CategoryDocument>,@InjectModel(Media.name) private mediaModel:Model<MediaDocument>,private documentService: DocumentService,
        private StorageFactory: StorageFactory,){}

    async CreateCategory(dto:CreateCategory,file:Express.Multer.File,userId:string,vendorId:string){
        if(!vendorId){
            throw new ForbiddenException("Your account is not verified yet")
        }
        const isCategoryExist = await this.categoryModel.findOne({vendorId,$or:[{name:dto.name},{slug:dto.slug}]})
        if(isCategoryExist){
            throw new ConflictException("Category exist with same name or slug")
        }

        let mediaId
        if(file){
            const mediaResponse = await this.documentService.upload(file,"category",userId,vendorId)
            mediaId = mediaResponse._id
        }

        

        const newcategory = await this.categoryModel.create({
            ...dto,
            vendorId,
            image:mediaId
        })

        return ApiResponse.success("Category Create Successfully",newcategory)

    }

    async fetchVendorCategories(vendorId:string){
        if(!vendorId){
            throw new ForbiddenException("Your account is not verified yet")
        }
        const categories = await this.categoryModel.find({vendorId}).lean()
        return categories
    }

    async deleteVendorCategory(vendorId:string,categoryId:string){
        if(!vendorId){
            throw new ForbiddenException("Your account is not verified yet")
        }
        const category = await this.categoryModel.findById(categoryId)
        if(!category){
            throw new NotFoundException("Category not found")
        }

        await category.deleteOne()
        return ApiResponse.success("Category Deleted Successfully",null)

    }

    async createProduct(vendorId:string){
        if(!vendorId){
            throw new ForbiddenException("Your account is not verified yet")
        }
        
    }
}

