import { Type } from "class-transformer";
import { IsBoolean, IsEnum, IsMongoId, IsNumber, IsOptional } from "class-validator";
import { PaymentMethod } from "src/order/schema/order.schema";

export class EnrollCourseDTO {
    @IsMongoId()
    courseId: string;
}

export class PurchaseCourseDTO {
    @IsMongoId()
    courseId: string;

    @IsEnum(PaymentMethod)
    paymentMethod: PaymentMethod;
}

export class UpdateLessonProgressDTO {
    @IsMongoId()
    courseId: string;

    @IsMongoId()
    lessonId: string;

    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isCompleted?: boolean;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    watchedDurationInSeconds?: number;
}
