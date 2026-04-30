import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schema/user.schema';
import { Media, MediaSchema } from 'src/document/schema/document.schema';
import { DocumentModule } from 'src/document/document.module';

@Module({
  imports:[
    MongooseModule.forFeature([{name:User.name,schema:UserSchema}]),
    MongooseModule.forFeature([{name:Media.name,schema:MediaSchema}]),
    DocumentModule
  ],
  providers: [UserService],
  controllers: [UserController],
  exports:[UserService,MongooseModule]
})
export class UserModule {}
