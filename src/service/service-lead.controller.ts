import { Controller, Get, Delete, Param, UseGuards, Req, Post, Body } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guad';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/user/schema/user.schema';
import { ServiceLeadService } from './service-lead.service';
import { BookLeadDTO } from './dto/service.dto';

@Controller('service-leads')
export class ServiceLeadController {
  constructor(private readonly serviceLeadService: ServiceLeadService) { }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getAllLeadsForAdmin() {
    return this.serviceLeadService.getAllLeadsForAdmin();
  }

  @Get('provider/my-leads')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SERVICE_PROVIDER)
  getLeadsForProvider(@Req() req: any) {
    return this.serviceLeadService.getLeadsForProvider(req.user._id);
  }

  @Delete('admin/delete-lead/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  deleteLeadByUser(@Req() req: any, @Param('id') leadId: string) {
    return this.serviceLeadService.deleteLeadByAdmin(req.user._id, leadId);
  }

  @Post('apply/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SERVICE_PROVIDER)
  applyToLead(@Req() req: any, @Param('id') leadId: string) {
    return this.serviceLeadService.applyToLead(req.user._id, leadId);
  }

  @Post('book/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SERVICE_PROVIDER)
  bookLead(@Req() req: any, @Param('id') leadId: string, @Body() dto: BookLeadDTO) {
    return this.serviceLeadService.bookLead(req.user._id, leadId, dto);
  }
}
