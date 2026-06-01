import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ReviewService } from './user-review.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guad';
import { CreateReviewDto, UpdateReviewDto } from './dto/reviewDTO';



@Controller('reviews')
export class ReviewController {
  constructor(
    private readonly reviewService: ReviewService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createReview(
    @Req() req: any,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewService.createReview(
      req.user._id,
      dto,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateReview(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewService.updateReview(
      req.user._id,
      id,
      dto,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteReview(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.reviewService.deleteReview(
      req.user._id,
      id,
    );
  }

  @Get('product/:productId')
  async getProductReviews(
    @Param('productId') productId: string,
  ) {
    return this.reviewService.getProductReviews(
      productId,
    );
  }
}