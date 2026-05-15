import {
    IsDate,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { OrderStatus, PaymentStatus } from 'src/order/schema/order.schema';



export class UpdateOrderDTO {
  @IsOptional()
  @IsEnum(OrderStatus)
  orderStatus?: OrderStatus;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?:PaymentStatus

  @IsOptional()
  @IsString()
  trackingId?: string;

  @IsOptional()
  @IsString()
  cancellationReason?: string;

  @IsOptional()
  @IsDateString()
  estimatedDeliveryDate?: Date;

  @IsOptional()
  @IsDate()
  cancelledAt?:string

  @IsOptional()
  @IsDate()
  deliveredAt?:string
}