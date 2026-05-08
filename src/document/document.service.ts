import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DocumentType, Media } from './schema/document.schema';
import { Model } from 'mongoose';
import { StorageProvider } from './storage/storage.interface';
import { CloudinaryStorage } from './storage/cloudinary.storage';
import { LocalStorage } from './storage/local.storage';
import { ApiResponse } from 'src/common/responses/api-response';

@Injectable()
export class DocumentService {
    private storage:StorageProvider;
    private storageType: 'local' | 'cloudinary' | 's3'
    constructor(@InjectModel(Media.name) private mediaModel:Model<Media>){
        const type = process.env.STORAGE_USED

        if(type === 'cloudinary'){
            this.storage= new CloudinaryStorage()
        }else if(type === 'local'){
            this.storage = new LocalStorage()
        }else{
            throw new Error("Invaid Storage Type Provided")
        }
        this.storageType = type
    }

    private getType(mime: string): DocumentType {
    if (mime.startsWith('image')) return DocumentType.IMAGE;
    if (mime.startsWith('video')) return DocumentType.VIDEO;
    return DocumentType.DOCUMENT;
  }

    async upload(file:Express.Multer.File,folder:string,userId?:string,vendorId?:string){
        if(!file){
            throw new BadRequestException("File is required")
        }

        const uploaded = await this.storage.upload(file,folder)
        const media = await this.mediaModel.create({
            ...uploaded,
            folder,
            uploadedBy:userId,
            type:this.getType(file.mimetype),
            storage: this.storageType,
            vendor:vendorId
        })

        return media
    }

    async uploadMultiplFiles(files:Express.Multer.File[],folder:string,userId?:string){
        if(!files || files.length === 0){
            throw new BadRequestException("Files are required")
        }

        const uploadMedia = await Promise.all(
            files.map(async(file)=>{
                const uploaded = await this.storage.upload(file,folder)

                return this.mediaModel.create({
                    ...uploaded,
                    folder,uploadedBy:userId,type:this.getType(file.mimetype),storage:this.storageType
                })
            })
        )

        return ApiResponse.success("Files Uploaded Successfully",uploadMedia)
    }

    async deleteMedia(id:string){
        const media = await this.mediaModel.findById(id)
        if(!media){
            throw new NotFoundException("Media not found")
        }
        await this.storage.delete(media.publicId)
        await media.deleteOne()

        return ApiResponse.success("Media Deleted Successfully",200)
    }

    async findAll(){
        const media = await this.mediaModel.find().sort({createdAt:-1})
        return ApiResponse.success("Media fetched Successfully",media)
    }

    async findUnique(id:string){
        const media = await this.mediaModel.findById(id)
        if(!media){
            throw new NotFoundException("Media Not Found")
        }
        return ApiResponse.success("Media Fetched Successfully",media)
    }

    async replace(id:string,file:Express.Multer.File){
        const media = await this.mediaModel.findById(id)
        if(!media){
            throw new NotFoundException("Media Not Found")
        }

        await this.storage.delete(media.publicId)

        const uploaded = await this.storage.upload(file,media.folder)

        Object.assign(media,uploaded)

        await media.save()

        return ApiResponse.success("Media Updated Successfully",media)
    }
}
