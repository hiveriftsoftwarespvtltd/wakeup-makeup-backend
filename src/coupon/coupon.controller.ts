import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';

import { CouponService } from './coupon.service';
import { CreateCouponDto, UpdateCouponDTO } from './dto/coupon.dto';


@Controller('coupons')
export class CouponController {
  constructor(
    private readonly couponService: CouponService,
  ) {}

  @Get("all")
  getAllCoupons(){
    return this.couponService.getAllCoupons()
  }

  @Post("create-coupon")
  create(@Body() dto: CreateCouponDto) {
    return this.couponService.create(dto);
  }

  @Get('validate')
  validate(
    @Query('code') code: string,
    @Query('total') total: number,
  ) {
    return this.couponService.validateCoupon(
      code,
      Number(total),
    );
  }

  @Get('coupon-detail/:id')
  couponDetails(@Param('id') id:string){
    return this.couponService.couponDetails(id)
  }

  @Put('update-coupon/:id')
  updateCoupon(@Param('id') id:string, @Body() dto:UpdateCouponDTO){
    return this.couponService.updateCoupon(dto,id)
  }

  @Delete('delete-coupon/:id')
  deleteCoupon(@Param('id') id:string){
    return this.couponService.deleteCoupon(id)
  }

}