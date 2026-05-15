import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guad';


@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
    constructor(private cartService:CartService){}

    @Get('fetch-user-cart')
    async fetchUserCart(@Req() req:any){
        return this.cartService.fetchUserCart(req.user._id)
    }

    @Delete('clear-cart')
    async clearCart(@Req() req:any){
        return this.cartService.clearUserCart(req.user._id)
    }

    @Post('add-to-cart/:id')
    async addToCart(@Req() req:any,@Param('id') id:string, @Body('quantity') quantity:number,@Body('productId') productId:string){
        return this.cartService.addToCart(req.user._id,productId,id,quantity)
    }

    @Put('decrease-item-from-cart/:id')
    async decreaseItemFromCart(@Req() req:any,@Param('id') id:string){
        return this.cartService.decreaseItemQuantity(req.user._id,id)
    }

    @Put('remove-item-from-cart/:id')
    async removeItemFromCart(@Req() req:any,@Param('id') id:string){
        return this.cartService.removeItemFromCart(req.user._id,id)
    }

}
