import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";



export enum CourseStatus {
    DRAFT = 'DRAFT',
    PUBLISHED = 'PUBLISHED',
    REJECTED = 'REJECTED',
    ARCHIVED = 'ARCHIVED',
}

export enum CourseLevel {
    BEGINNER = 'BEGINNER',
    INTERMEDIATE = 'INTERMEDIATE',
    ADVANCED = 'ADVANCED',
}

export enum CourseLanguage {
    HINDI = "HINDI",
    ENGLISH = "ENGLISH"
}

export type CourseDocument = Course & Document

@Schema({ timestamps: true })
export class Course {
    @Prop({
        type: Types.ObjectId,
        ref: 'Educator',
        required: true,
    })
    educatorId!: Types.ObjectId;

    @Prop({ required: true })
    title!: string;

    @Prop()
    subtitle!: string;

    @Prop()
    description!: string;

    @Prop({
        type: Types.ObjectId,
        ref: 'Media'
    })
    thumbnail!: Types.ObjectId;

    @Prop({
        type: Types.ObjectId,
        ref: 'CourseCategory'
    })
    categoryId!: Types.ObjectId;

    @Prop({
        type: [String],
        default: [],
        lowercase: true
    })
    tags!: string[]


    @Prop({
        enum: CourseLevel,
        default: CourseLevel.BEGINNER,
    })
    level: string; // Beginner, Intermediate, Advanced

    @Prop({ default: 0 })
    totalLessons: number;

    @Prop({ default: 0 })
    totalDurationInMinutes: number;

    @Prop({
        enum: CourseLanguage,
        default: CourseLanguage.HINDI,
    })
    language: CourseLanguage;

    @Prop({ default: 0 })
    costPrice: number;

    @Prop({ default: 0 })
    sellingPrice: number;

    @Prop({ default: 0 })
    offeredPrice: number;

    @Prop({ default: false })
    isFree: boolean;

    @Prop({
        enum: CourseStatus,
        default: CourseStatus.DRAFT,
    })
    status: CourseStatus;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ default: false })
    isDeleted: boolean;
}

export const CourseSchema = SchemaFactory.createForClass(Course)