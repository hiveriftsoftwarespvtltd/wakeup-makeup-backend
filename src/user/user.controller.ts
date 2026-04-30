import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guad';

@Controller('user')
export class UserController {
    constructor(private userService:UserService){}

    @Get()
    findAll(){
        return this.userService.findAll()
    }

    @Post()
    createUser(@Body() dto:CreateUserDto){
        return this.userService.create(dto)
    }

     @Post('avatar')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file'))
    uploadAvatar(
        @UploadedFile() file:Express.Multer.File,
        @Req() req:any
    ){
        return this.userService.uploadAvatar(req.user._id,file)
    }

    @Delete('delete-avatar')
    @UseGuards(JwtAuthGuard)
    deleteAvatar(
        @Req() req:any
    ){
        return this.userService.deleteUserAvatar(req.user._id)
    }

    @Get('get-user-avatar')
    @UseGuards(JwtAuthGuard)
    getUserAvatar(@Req() req:any){
        return this.userService.getUserAvatar(req.user._id)
    }
    
    @Get(':id')
    findOne(@Param('id') id:string){
        return this.userService.findById(id)
    }

    @Patch(':id')
    updateUser(@Param('id') id:string, @Body() dto:UpdateUserDto){
        return this.userService.updateUser(id,dto)
    }

    @Delete(':id')
    deleteUser(@Param('id') id:string){
        return this.userService.removeUser(id)
    }

   
}
