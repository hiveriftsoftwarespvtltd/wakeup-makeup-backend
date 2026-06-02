import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt-auth.guad";
import { Roles } from "src/auth/roles.decorator";
import { RolesGuard } from "src/auth/roles.guard";
import { UserRole } from "src/user/schema/user.schema";


@UseGuards(JwtAuthGuard,RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin-service')

export class AdminServiceController{
    // constructor(private ){}
}
