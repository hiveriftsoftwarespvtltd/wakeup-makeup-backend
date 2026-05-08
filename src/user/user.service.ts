import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schema/user.schema';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Media, MediaDocument } from 'src/document/schema/document.schema';
import { DocumentService } from 'src/document/document.service';

import { StorageFactory } from 'src/document/storage/storage.factory';
import { ApiResponse } from 'src/common/responses/api-response';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Media.name) private mediaModel: Model<MediaDocument>,
    private documentService: DocumentService,
    private StorageFactory: StorageFactory,
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
    const user = await this.userModel.findById(userId).select('email name phone role');
    if (!user) {
      throw new NotFoundException('User Not Found');
    }

    if (dto.name.trim()) user.name = dto.name;
    if (dto.phone.trim()) user.phone = dto.phone;

    await user.save();
    return ApiResponse.success(
      'Your changes updated successfully',
      user,
      200,
    );
  }

  async removeUser(id: string) {
    const user = await this.userModel.findByIdAndDelete(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return { message: 'User deleted successfully' };
  }

  async deletAccount(userId:string){
    const user = await this.userModel.findById(userId)
    if(!user){
      throw new NotFoundException("User not found ")
    }

    user.isDeleted = true
    user.save()

    return ApiResponse.success(
      'Your Account deleted Successfully',
      null,
      200,
    );
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
      throw new NotFoundException('Vatar not found for this user');
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
}
