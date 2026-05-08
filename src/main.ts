import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/responses/response.interceptor';
import { GlobalExceptionFilter } from './common/responses/exception-filter';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));
  app.setGlobalPrefix('/api/v1')
  app.useGlobalInterceptors(new ResponseInterceptor())
  app.useGlobalFilters(new GlobalExceptionFilter())
  app.enableCors()
  await app.listen(process.env.PORT ?? 3000);

  console.log(`backedn running on ${process.env.PORT ?? 3000}`)
}
bootstrap();
