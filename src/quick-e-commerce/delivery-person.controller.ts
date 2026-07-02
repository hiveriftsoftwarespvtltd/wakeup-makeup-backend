import { Controller, Post, Get, Put, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { DeliveryPersonService } from './delivery-person.service';
import { CreateDeliveryPersonDto, UpdateDeliveryPersonDto } from './dto/delivery-person.dto';

import { JwtAuthGuard } from 'src/auth/jwt-auth.guad';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/user/schema/user.schema';

@Controller('vendor')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.VENDOR)
export class DeliveryPersonController {
  constructor(private readonly deliveryPersonService: DeliveryPersonService) { }

  @Post('add-delivery-person')
  async createDeliveryPerson(@Body() dto: CreateDeliveryPersonDto, @Req() req: any) {
    return this.deliveryPersonService.createDeliveryPerson(req.user.vendorId, dto);
  }

  @Get('delivery-persons')
  async getDeliveryPersons(@Req() req: any) {
    return this.deliveryPersonService.getDeliveryPersons(req.user.vendorId);
  }

  @Put('update-delivery-person/:id')
  async updateDeliveryPerson(
    @Param('id') id: string,
    @Body() dto: UpdateDeliveryPersonDto,
    @Req() req: any,
  ) {
    return this.deliveryPersonService.updateDeliveryPerson(req.user.vendorId, id, dto);
  }

  @Delete('delete-delivery-person/:id')
  async deleteDeliveryPerson(@Param('id') id: string, @Req() req: any) {
    return this.deliveryPersonService.deleteDeliveryPerson(req.user.vendorId, id);
  }
}
