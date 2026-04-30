import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {MongooseModule} from '@nestjs/mongoose'
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { VendorModule } from './vendor/vendor.module';
import { DocumentModule } from './document/document.module';
import { ProductModule } from './product/product.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal:true
    }),
    MongooseModule.forRootAsync({
      inject:[ConfigService],
      useFactory:(configService:ConfigService)=>{
        const node_env = configService.get<string>('NODE_ENV');

        const uri = node_env === 'development' ? configService.get('LOCAL_MONGO_URI') : configService.get('MONGO_URI')
        if(!uri){
          throw new Error("MNGO_URI NOT FOUND IN ENV")
        }
        return {uri}
      }
    }),
    UserModule,
    AuthModule,
    VendorModule,
    DocumentModule,
    ProductModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
