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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiResponse } from 'src/common/responses/api-response';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guad';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/user/schema/user.schema';
import {
  UpdateVendorDTO,
  updateVendorPayoutDTO,
  vendorPayDTO,
} from './dto/vendor.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateCategoryDTO, UpdateCategoryDTO } from './dto/category.dto';
import { InfluencerService } from 'src/influencer/influencer.service';
import {
  CreateInfluencerDto,
  createSlabDTO,
  UpdateSlabDTO,
} from 'src/influencer/dto/influencer.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(
    private adminService: AdminService,
    private influencerService: InfluencerService,
  ) { }

  @Get('vendors')
  async getAllVendors(@Query('page') page: number, @Query('limit') limit: number) {
    return await this.adminService.fetchAllVendors(page, limit);
  }

  @Get('users')
  async getAllUsers(@Query('page') page: number, @Query('limit') limit: number) {
    return await this.adminService.fetchAllUsers(page, limit);
  }

  @Get('pending-vendors')
  async fetAllPendingVendors(@Query('page') page: number, @Query('limit') limit: number) {
    return this.adminService.fetchPendingVendors(page, limit);
  }

  @Get('products')
  async fetAllProducts(@Query('page') page: number, @Query('limit') limit: number) {
    return this.adminService.fetchProducts(page, limit);
  }

  @Get('orders')
  async fetchAllOrders(@Query('page') page: number, @Query('limit') limit: number) {
    return this.adminService.fetchAllOrders(page, limit);
  }

  @Delete('delete-all-products')
  async deleteAllProducts() {
    return await this.adminService.deleteAllProducts();
  }

  @Delete('delete-all-categories')
  async deleteAllCategories() {
    return this.adminService.deleteAllCategories();
  }

  @Post('create-category')
  @UseInterceptors(FileInterceptor('file'))
  createCategory(
    @UploadedFile()
    file: any,

    @Req()
    req: any,

    @Body()
    dto: CreateCategoryDTO,
  ) {
    return this.adminService.createCategory(dto, file, req.user._id);
  }

  @Get('fetch-categories')
  async getAllCategories() {
    return await this.adminService.fetchAllCategories();
  }

  @Get('vendor-payouts')
  async allVendorPayouts(
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    return this.adminService.allVendorPayouts(limit, page, status, month, year);
  }

  @Get('vendor-payouts/:vendorId')
  async vendorPayoutDetails(
    @Param('vendorId') vendorId: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    return this.adminService.vendorPayoutDetails(
      vendorId,
      limit,
      page,
      status,
      month,
      year,
    );
  }

  @Post('create-influencer-commission-slab')
  createInfluencerCommissonSlab(@Body() dto: createSlabDTO) {
    return this.influencerService.createSlab(dto);
  }

  @Get('influencer-commissions')
  async allInfluencerCommissions(
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    return await this.adminService.allInfluencerCommission(
      +limit,
      +page,
      status,
      month ? +month : undefined,
      year ? +year : undefined,
    );
  }

  @Post('send-influencer-invitation-link')
  async sendInfluencerInvitationLink(@Body('email') email: string, @Body('name') name: string, @Req() req: any) {
    return await this.influencerService.sendInfluencerInvitationLink(email, name, req.user._id)
  }

  //  @Post('onboard-influencer')
  //   create(@Body() dto: CreateInfluencerDto) {
  //     return this.influencerService.create(dto);
  //   }

  @Get('all-influencer-commission-slabs')
  getAllCommissionSlabs(@Query('page') page: number, @Query('limit') limit: number) {
    return this.influencerService.getAllCommissionSlabs(page, limit);
  }

  // @Post('vendor-payout/settle')
  // settleVendorPayout(@Body() dto: SettleVendorPayoutDto) {
  //   return this.payoutService.settleVendorPayout(dto);
  // }

  @Get('influencer-commissions/:influencerId')
  async influencerCommissionDetails(
    @Param('influencerId') influencerId: string,

    @Query('month') month?: number,

    @Query('year') year?: number,
  ) {
    return this.adminService.influencerCommissionDetails(
      influencerId,
      month,
      year,
    );
  }

  @Put('update-commission-slab/:slabId')
  updateCommissonSlab(
    @Param('slabId') slabId: string,
    @Body() dto: UpdateSlabDTO,
  ) {
    return this.influencerService.updateSlab(slabId, dto);
  }

  @Get('slab-details/:slabId')
  slabDetails(@Param('slabId') slabId: string) {
    return this.influencerService.getCommissionSlabDetails(slabId);
  }

  @Delete('delete-slab/:slabId')
  deleteSlab(@Param('slabId') slabId: string) {
    return this.influencerService.deleteSlab(slabId);
  }

  // @Get('vendor-payout/:vendorId')
  // async vendorPayoutDetails(
  //   @Param('vendorId') vendorId: string,
  //   @Query('page') page: number,
  //   @Query('limit') limit: number,
  //   @Query('status') status: string,
  //   @Query('fromDate') fromDate: any,
  //   @Query('toDate') toDate: any,
  // ) {
  //   return this.adminService.vendorPayoutDetails(
  //     vendorId,
  //     page,
  //     limit,
  //     fromDate,
  //     toDate,
  //     status,
  //   );
  // }

  // @Post('vendor-pays/:vendorId')
  // async payVendor(
  //   @Req() req: any,
  //   @Param('vendorId') vendorId: string,
  //   @Body() dto: vendorPayDTO,
  // ) {
  //   return await this.adminService.payVendorPayouts(
  //     req.user._id,
  //     vendorId,
  //     dto,
  //   );
  // }

  @Put('update-vendor-payout-status/:vendorId')
  async updateVendorPayoutStatus(
    @Param('vendorId') vendorId: string,
    @Body() dto: updateVendorPayoutDTO,
  ) {
    return await this.adminService.updateVendorPayoutStatus(vendorId, dto);
  }
  @Get('fetch-catoegry/:categoryId')
  async fetchCategoryDetails(@Param('categoryId') categoryId: string) {
    return this.adminService.fetchCategoryDetails(categoryId);
  }

  @Delete('delete-category/:categoryId')
  async deleteCategory(@Param('categoryId') categoryId: string) {
    return await this.adminService.deleteCategory(categoryId);
  }

  @Put('update-category/:id')
  @UseInterceptors(FileInterceptor('file'))
  updateCategory(
    @Param('id') id: string,

    @UploadedFile()
    file: any,

    @Req()
    req: any,

    @Body()
    dto: UpdateCategoryDTO,
  ) {
    return this.adminService.updateCategory(dto, file, req.user._id, id);
  }

  @Get('orderDetails/:id')
  async orderDetails(@Param('id') id: string) {
    return this.adminService.fetchOrderDetails(id);
  }

  @Delete('order-delete/:id')
  async deleteOrder(@Param('id') id: string) {
    return this.adminService.deleteOrder(id);
  }

  @Get('vendors/:id')
  async vendorDetails(@Param('id') id: string) {
    return await this.adminService.fetchVendorDetails(id);
  }

  @Get('users/:id')
  async userDetails(@Param('id') id: string) {
    return await this.adminService.fetchUserDetails(id);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return await this.adminService.deleteUser(id);
  }

  @Delete('vendors/:id')
  async deleteVendor(@Param('id') id: string) {
    return await this.adminService.deleteVendor(id);
  }

  @Delete('delete-influencer/:id')
  async deleteInfluencer(@Param('id') id: string) {
    return await this.adminService.deleteInfluencer(id);
  }

  @Delete('delete-educator/:id')
  async deleteEducator(@Param('id') id: string) {
    return await this.adminService.deleteEducator(id);
  }

  @Delete('delete-service-provider/:id')
  async deleteServiceProvider(@Param('id') id: string) {
    return await this.adminService.deleteServiceProvider(id);
  }

  @Patch('vendor-update/:vendorId')
  async updateVendor(
    @Param('vendorId') vendorId: string,
    @Body() dto: UpdateVendorDTO,
  ) {
    return this.adminService.updateVendorDetails(dto, vendorId);
  }

  @Patch('vendors/toggle-active/:id')
  async toogleActiveVendor(@Param('id') id: string) {
    return await this.adminService.toggleActiveVendor(id);
  }

  @Patch('users/toggle-active/:id')
  async toggleActiveUser(@Param('id') id: string) {
    return await this.adminService.toggleActiveUser(id);
  }

  @Patch('accept-vendor/:id')
  async acceptVendorRequest(@Param('id') id: string) {
    return await this.adminService.acceptPendingVendor(id);
  }

  @Patch('reject-vendor/:id')
  async rejectVendorRequest(@Param('id') id: string) {
    return await this.adminService.rejectPendingVendor(id);
  }

  @Delete('delete-product/:vendorId/:productId')
  async deleteProduct(
    @Param('vendorId') vendorId: string,
    @Param('productId') productId: string,
  ) {
    return await this.adminService.deleteVendorProduct(vendorId, productId);
  }

  @Patch('restore-user/:id')
  async restoreUser(@Param('id') id: string) {
    return await this.adminService.restoreUser(id);
  }

  @Patch('restore-vendor/:id')
  async restoreVendor(@Param('id') id: string) {
    return await this.adminService.restoreVendor(id);
  }

  @Patch('restore-influencer/:id')
  async restoreInfluencer(@Param('id') id: string) {
    return await this.adminService.restoreInfluencer(id);
  }

  @Patch('restore-educator/:id')
  async restoreEducator(@Param('id') id: string) {
    return await this.adminService.restoreEducator(id);
  }

  @Patch('restore-service-provider/:id')
  async restoreServiceProvider(@Param('id') id: string) {
    return await this.adminService.restoreServiceProvider(id);
  }

  @Get('cloudinary-storage-size')
  async getCloudinaryStorageSize() {
    const data = await this.adminService.getCloudinaryStorageSize();
    return ApiResponse.success('Storage size fetched successfully', data);
  }
}
