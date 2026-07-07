import { Controller, Put, Body, Param, Req, UseGuards } from '@nestjs/common';
import { QuickOrderService } from './quick-delivery-order.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guad';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/user/schema/user.schema';
import { MarkOrderDeliveredDto } from './dto/vendor-order-update.dto';
import { GetVendorOrdersDto } from './dto/vendor-order-update.dto';
import { UpdateDeliveryPersonStatusDto } from './dto/delivery-person.dto';
import { DeliveryPersonService } from './delivery-person.service';
import { Get, Query, UseInterceptors, UploadedFiles, BadRequestException } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('delivery-person/quick-order')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DELIVERY_PERSON)
export class DeliveryPersonQuickOrderController {
    constructor(
        private readonly quickOrderService: QuickOrderService,
        private readonly deliveryPersonService: DeliveryPersonService
    ) {}

    @Get('list')
    async getAssignedOrders(@Req() req: any, @Query() query: GetVendorOrdersDto) {
        return this.quickOrderService.getDeliveryPersonOrders(
            req.user._id,
            query.page || 1,
            query.limit || 10,
            query.status
        );
    }

    @Put('update-status')
    async updateStatus(@Req() req: any, @Body() dto: UpdateDeliveryPersonStatusDto) {
        return this.deliveryPersonService.updateStatus(
            req.user._id,
            dto.status,
            dto.location
        );
    }

    @Put(':id/deliver')
    @UseInterceptors(FilesInterceptor('deliveryProofImages', 4))
    async markOrderDelivered(@Req() req: any, @Param('id') orderId: string, @Body() dto: MarkOrderDeliveredDto, @UploadedFiles() files: Express.Multer.File[]) {
        if (!files || files.length === 0) {
            throw new BadRequestException('At least one delivery proof image is required');
        }
        return this.quickOrderService.markVendorOrderAsDelivered(
            orderId,
            files,
            req.user._id,
            'DELIVERY_PERSON'
        );
    }
}
