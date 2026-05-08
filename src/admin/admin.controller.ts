import { Controller, Delete, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guad';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/user/schema/user.schema';


@UseGuards(JwtAuthGuard,RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
    constructor(private adminService:AdminService){}

    @Get('vendors')
    async getAllVendors(){
        return await this.adminService.fetchAllVendors()
    }

    @Get('users')
    async getAllUsers(){
        return await this.adminService.fetchAllUsers()
    }

    @Get('pending-vendors')
    async fetAllPendingVendors(){
        return this.adminService.fetchPendingVendors()
    }

    @Get('vendors/:id')
    async vendorDetails(@Param('id') id:string ){
        return await this.adminService.fetchVendorDetails(id)
    }

    @Get('users/:id')
    async userDetails(@Param('id') id:string){
        return await this.adminService.fetchUserDetails(id)
    }

    @Delete('users/:id')
    async deleteUser(@Param('id') id:string){
        return await this.adminService.deleteUser(id)
    }

    @Delete('vendors/:id')
    async deleteVendor(@Param('id') id:string){
        return await this.adminService.deleteVendor(id)
    }

    @Patch('vendors/toggle-active/:id')
    async toogleActiveVendor(@Param('id') id:string){
        return await this.adminService.toggleActiveVendor(id)
    }

    @Patch('users/toggle-active/:id')
    async toggleActiveUser(@Param('id') id:string){
        return await this.adminService.toggleActiveUser(id)
    }

    @Patch('accept-vendor/:id')
    async acceptVendorRequest(@Param('id') id:string){
        return await this.adminService.acceptPendingVendor(id)
    }

    @Patch('reject-vendor/:id')
    async rejectVendorRequest(@Param('id') id:string){
        return await this.adminService.rejectPendingVendor(id)
    }
}
