import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";


export type CourseLessonDocument = CourseLesson & Document
@Schema({ timestamps: true })
export class CourseLesson {
    @Prop({
        type: Types.ObjectId,
        ref: 'Course',
        required: true,
    })
    courseId!: Types.ObjectId;

    @Prop({
        type: Types.ObjectId,
        ref: 'CourseSection',
        required: true,
    })
    sectionId!: Types.ObjectId;

    @Prop({ required: true })
    title!: string;

    @Prop()
    description!: string;

    @Prop({ required: true })
    videoUrl!: string;

    @Prop()
    videoId?: string;

    @Prop({ default: 0 })
    durationInSeconds!: number;

    @Prop({ required: true })
    order!: number;

    @Prop({ default: false })
    isPreview!: boolean;
}

export const CourseLessonSchema = SchemaFactory.createForClass(CourseLesson)