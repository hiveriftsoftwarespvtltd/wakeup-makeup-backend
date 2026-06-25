import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { InfluencerService } from './influencer.service';
import { CreateInfluencerDto, UpdateInfluencerDto } from './dto/influencer.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guad';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/user/schema/user.schema';
import { InfluencerStatus } from './schema/influencer.schema';

@Controller('influencers')
export class InfluencerController {
  constructor(private readonly influencerService: InfluencerService) { }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  // @Post('onboard-influencer')
  // create(@Body() dto: CreateInfluencerDto) {
  //   return this.influencerService.create(dto);
  // }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('all-influencers')
  findAll(@Query('page') page: number, @Query('limit') limit: number) {
    return this.influencerService.findAll(page, limit);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('influencer-details/:id')
  findOne(@Param('id') id: string) {
    return this.influencerService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put('update-influencer/:id')
  updateInfluencer(@Param('id') id: string, @Body() dto: UpdateInfluencerDto) {
    return this.influencerService.updateInfluencer(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete('delete-influencer/:id')
  udeleteInfluencer(@Param('id') id: string) {
    return this.influencerService.deleteInfluencer(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INFLUENCER)
  @Get('overview')
  overView(@Req() req: any) {
    return this.influencerService.overview(req.user.influencerId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INFLUENCER)
  @Get('analytics')
  analytics(@Req() req: any, @Query('days') days: number) {
    return this.influencerService.influencerAnalytics(req.user.influencerId, days)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('influencer-requests')
  async getInfluencerRequests(@Query('page') page: number, @Query('limit') limit: number) {
    return await this.influencerService.getAllPendingInfluencersRequests(page, limit)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put('update-influencer-status/:influencerId')
  async updateInfluencerStatus(@Param('influencerId') influencerId: string, @Body('status') status: InfluencerStatus) {
    return await this.influencerService.changeInfluencerStatus(influencerId, status)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INFLUENCER)
  @Post('send-influencer-invitation-link')
  async sendInfluencerInvitationLink(@Body('email') email: string, @Body('name') name: string, @Req() req: any) {
    return await this.influencerService.sendInfluencerInvitationLink(email, name, req.user._id)
  }

}
