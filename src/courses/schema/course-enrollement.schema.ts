import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";


export enum EnrollmentStatus {
    ACTIVE = 'ACTIVE',
    COMPLETED = 'COMPLETED',
    REFUNDED = 'REFUNDED',
}

export type CourseEnrollmentDocument = CourseEnrollment & Document

@Schema({ timestamps: true })
export class CourseEnrollment {
    @Prop({
        type: Types.ObjectId,
        ref: 'User',
        required: true,
    })
    learnerId: Types.ObjectId;

    @Prop({
        type: Types.ObjectId,
        ref: 'Course',
        required: true,
    })
    courseId: Types.ObjectId;

    @Prop({
        enum: EnrollmentStatus,
        default: EnrollmentStatus.ACTIVE,
    })
    status: EnrollmentStatus;

    @Prop({ default: 0 })
    progressPercentage: number;

    @Prop()
    completedAt: Date;
}

export const CourseEnrollmentSchema = SchemaFactory.createForClass(CourseEnrollment)