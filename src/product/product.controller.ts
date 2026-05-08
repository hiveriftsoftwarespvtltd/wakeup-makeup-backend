import { Body, Controller, Delete, Get, Param, Post, Req, UploadedFile, UploadedFiles, UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateCategory } from './dto/create-category.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guad';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/user/schema/user.schema';

@UseGuards(JwtAuthGuard,RolesGuard)
@Roles(UserRole.VENDOR)
@Controller('product')
export class ProductController {
    constructor(private productService:ProductService){}

    @Post('create-category')
    
    createCategory(@UploadedFile() file:Express.Multer.File, @Req() req:any,@Body() dto:CreateCategory){
        console.log("Request",req.user)
        return this.productService.CreateCategory(dto,file,req.user._id,req.user.vendorId)
    }

    @Get('fetch-categories')
    fetchCategories(@Req() req:any){
       
        return this.productService.fetchVendorCategories(req.user.vendorId)
    }

    @Delete('delete-category/:id')
    deleteCategory(@Param('id') id:string,@Req() req:any){
        return this.productService.deleteVendorCategory(req.user.vendorId,id)
    }

}
