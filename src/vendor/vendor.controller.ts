import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { VendorService } from './vendor.service';
import { createVendorDTO } from './dto/create-vendor.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guad';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/user/schema/user.schema';


@UseGuards(JwtAuthGuard,RolesGuard)
@Roles(UserRole.VENDOR)
@Controller('vendor')
export class VendorController {
  constructor(private vendorService: VendorService) {}

  
  @Post()
  async registerVendor(@Body() dto: createVendorDTO, @Req() req: any) {
    return this.vendorService.registerVendor(dto, req.user._id);
  }

  //  @UseGuards(JwtAuthGuard,RolesGuard)
  // @Roles(UserRole.ADMIN)
  // @Get()

  // async getAllVendors() {
  //   return await this.vendorService.getAllVendors();
  // }

  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles(UserRole.VENDOR)
  @Get('vendor-details')
  async vendorDetails(@Req() req:any){
    return await this.vendorService.getVendorDetails(req.user._id,req.user.vendorId)
  }
}
