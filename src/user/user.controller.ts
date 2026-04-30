import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

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
    
    @Get(':id')
    findOne(@Param('id') id:string){
        return this.userService.findById(id)
    }

    @Patch(':id')
    updateUser(@Param('id') id:string, @Body() dto:UpdateUserDto){
        return this.userService.updateUser(id,dto)
    }

    @Delete('id')
    deleteUser(@Param('id') id:string){
        return this.userService.removeUser(id)
    }

}
