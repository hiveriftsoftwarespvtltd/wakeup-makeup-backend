import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';

@Module({
  imports:[
    UserModule,
    
    JwtModule.registerAsync({
      inject:[ConfigService],
      useFactory:(configSercice:ConfigService)=>{
        const secret = configSercice.get<string>('JWT_SECRET')
        if(!secret){
          throw new Error("JWT_SECRET not defined in env")
        }
        return {
          secret,
          signOptions:{
            expiresIn:'7d'
          }
        }
      }
    })
  ],
  providers: [AuthService,JwtStrategy],
  controllers: [AuthController],
  exports:[AuthService]
})
export class AuthModule {}
