import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { OptionalAuthGuard } from 'src/auth/optional-auth.guards';
import { UserService } from './user.service';
import { InfluencerService } from 'src/influencer/influencer.service';
import { CreateInfluencerDto } from 'src/influencer/dto/influencer.dto';

@UseGuards(OptionalAuthGuard)
@Controller('public-user')
export class PublicUserController {
  constructor(private userService: UserService,private influencerService:InfluencerService) {}

 @Get('products')
async fetchProducts(
  @Req() req: any,
  @Query('category') category?: string,
  @Query('minPrice') minPrice?: number,
  @Query('maxPrice') maxPrice?: number,
  @Query('search') search?: string,
  @Query('page') page = 1,
  @Query('limit') limit = 10,
) {
  return this.userService.fetchProducts(
    req.user?._id,
    category,
    Number(minPrice),
    Number(maxPrice),
    search,
    Number(page),
    Number(limit),
  );
}

@Post('onboard-influencer')
    create(@Body() dto: CreateInfluencerDto) {
      return this.influencerService.create(dto);
    }

@Get('influencer-slabs')
async influencerSlabs(){
  return await this.influencerService.getAllCommissionSlabs()
}

  @Get('product-details/:id')
  async fetchProductdetails(@Req() req: any, @Param('id') id: string) {
    return await this.userService.fetchProductDetails(req.user?._id, id);
  }
}
