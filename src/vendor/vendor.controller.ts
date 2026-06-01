import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { VendorService } from './vendor.service';
import { createVendorDTO } from './dto/create-vendor.dto';
// import { updateVendorDTO } from './dto/update-vendor.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guad';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/user/schema/user.schema';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { updateVendorDTO } from './dto/update-vendor-dto';
import { UpdateOrderDTO } from './dto/order.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.VENDOR)
@Controller('vendor')
export class VendorController {
  constructor(private vendorService: VendorService) {}

  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'logo', maxCount: 1 },
      { name: 'banner', maxCount: 1 },
    ]),
  )
  @Post()
  async registerVendor(
    @Body() dto: createVendorDTO,
    @UploadedFiles()
    files: {
      logo?: Express.Multer.File[];
      banner?: Express.Multer.File[];
    },
    @Req() req: any,
  ) {
    
    return this.vendorService.registerVendor(
      dto,
      req.user._id,
      files,
    );
  }

  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'logo', maxCount: 1 },
      { name: 'banner', maxCount: 1 },
    ]),
  )
  @Put()
  async updateVendor(
    @Body() dto: updateVendorDTO,
    @UploadedFiles()
    files: {
      logo?: Express.Multer.File[];
      banner?: Express.Multer.File[];
    },
    @Req() req: any,
  ) {
    return this.vendorService.updateVendorDetails(
      dto,
      req.user._id,
      req.user.vendorId,
      files,
    );
  }

  @Get('overview')
  async dashboardOverview(@Req() req:any){
    return this.vendorService.overview(req.user.vendorId)
  }

  @Get('top-products')
  async dashboardRevenue(@Req() req:any){
    return this.vendorService.topSellingProducts(req.user.vendorId)
  }

  @Get('order-graph')
  orderGraph(@Req() req:any,@Query('days') days:number){
    return this.vendorService.orderGraph(req.user.vendorId,days)
  }

  @Get('top-categories')
  topCategories(@Req() req:any){
    return this.vendorService.topCategories(req.user.vendorId)
  }

  @Get('order-comparison')
  orderComparison(@Req() req:any){
    return this.vendorService.orderComparison(req.user.vendorId)
  }
  @Get('vendor-details')
  async vendorDetails(@Req() req: any) {
    return await this.vendorService.getVendorDetails(
      req.user._id,
      req.user.vendorId,
    );
  }

  @Get('vendor-products')
  async vendorProducts(@Req() req:any){
    return await this.vendorService.vendorProducts(req.user._id,req.user.vendorId)
  }

  @Get('vendor-categories')
  async vendorCategories(@Req() req:any){
    return await this.vendorService.vendorCategories(req.user._id,req.user.vendorId)
  }

  @Get('vendor-orders')
  async vendorOrders(@Req() req:any){
    return this.vendorService.vendorOrders(req.user.vendorId)
  }

  @Delete("delete-all-products")
  async deleteAllProducts(@Req() req:any){
    return await this.vendorService.deleteAllVendorProducts(req.user.vendorId)
  }

  @Get('vendor-orders/:id')
  async vendorOrdersDetails(@Req() req:any,@Param('id') id:string){
    return this.vendorService.orderDetails(req.user.vendorId,id)
  }

  @Put('update-order/:id')
  updateOrder(@Body() dto:UpdateOrderDTO,@Param('id') id:string,@Req() req:any){
    return this.vendorService.updateOrder(dto,id,req.user.vendorId)
  }
}