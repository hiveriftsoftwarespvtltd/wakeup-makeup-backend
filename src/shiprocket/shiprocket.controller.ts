import { Controller, Post } from '@nestjs/common';
import { ShiprocketService } from './shiprocket.service';

@Controller('shiprocket')
export class ShiprocketController {
    constructor(private shipRocketService:ShiprocketService){}

    @Post('get-auth-token')
    async getShiprocketToken(){
        await this.shipRocketService.getAuthToken()
    }
}
