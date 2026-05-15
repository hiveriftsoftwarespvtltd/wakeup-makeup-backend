import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { InfluencerService } from './influencer.service';
import { CreateInfluencerDto, UpdateInfluencerDto } from './dto/influencer.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guad';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/user/schema/user.schema';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('influencers')
export class InfluencerController {
  constructor(private readonly influencerService: InfluencerService) {}

  @Post('onboard-influencer')
  create(@Body() dto: CreateInfluencerDto) {
    return this.influencerService.create(dto);
  }

  @Get('all-influencers')
  findAll() {
    return this.influencerService.findAll();
  }

  @Get('influencer-details/:id')
  findOne(@Param('id') id: string) {
    return this.influencerService.findOne(id);
  }

  @Put('update-influencer/:id')
  updateInfluencer(@Param('id') id: string, @Body() dto: UpdateInfluencerDto) {
    return this.influencerService.updateInfluencer(id, dto);
  }

  @Delete('delete-influencer/:id')
  udeleteInfluencer(@Param('id') id: string) {
    return this.influencerService.deleteInfluencer(id);
  }
}
