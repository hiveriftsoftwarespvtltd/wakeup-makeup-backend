import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Course, CourseSchema } from './schema/course.schema';
import { CourseCategory, CourseCategorySchema } from './schema/course-category.schema'
import { LessonProgress, LessonProgressSchema } from './schema/course-lesson-progress.schema';
import { CourseEnrollment, CourseEnrollmentSchema } from './schema/course-enrollement.schema';
import { CourseLesson, CourseLessonSchema } from './schema/course-lesson.schema';
import { CoursePurchase, CoursePurchaseSchema } from './schema/course-purchase.schema';
import { CourseSection, CourseSectionSchema } from './schema/course-section.schema';
import { Educator, EducatorSchema } from './schema/educator.schema';
import { CourseAttachment, CourseAttachmentSchema } from './schema/course-attachments.schema';
import { DocumentModule } from 'src/document/document.module';
import { User, UserSchema } from 'src/user/schema/user.schema';
import { CashbackSlab, CashbackSlabSchema } from 'src/wallet/schema/cashback/cashbacks.slabs.schema';
import { CommissionRate, CommissionRateSchema } from 'src/admin/schema/commission-rate.schema';
import { EducatorController } from './educator.controller';
import { EducatorService } from './educator.service';
import { CourseSectionController } from './course-section.controller';
import { CourseSectionService } from './course-section.service';
import { CourseLessonController } from './course-lesson.controller';
import { CourseLessonService } from './course-lesson.service';
import { CourseEnrollmentController } from './course-enrollment.controller';
import { CourseEnrollmentService } from './course-enrollment.service';
import { CourseAttachmentController } from './course-attachment.controller';
import { CourseAttachmentService } from './course-attachment.service';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { WalletModule } from 'src/wallet/wallet.module';
import { LearnerController } from './learner.controller';
import { LearnerService } from './learner.service';
import { InfluencerModule } from 'src/influencer/influencer.module';

@Module({
  imports: [MongooseModule.forFeature([
    { name: Course.name, schema: CourseSchema },
    { name: CourseCategory.name, schema: CourseCategorySchema },
    { name: CourseLesson.name, schema: CourseLessonSchema },
    { name: LessonProgress.name, schema: LessonProgressSchema },
    { name: CourseEnrollment.name, schema: CourseEnrollmentSchema },
    { name: CoursePurchase.name, schema: CoursePurchaseSchema },
    { name: CourseSection.name, schema: CourseSectionSchema },
    { name: Educator.name, schema: EducatorSchema },
    { name: CourseAttachment.name, schema: CourseAttachmentSchema },
    { name: User.name, schema: UserSchema },
    { name: CashbackSlab.name, schema: CashbackSlabSchema },
    { name: CommissionRate.name, schema: CommissionRateSchema },
  ]), DocumentModule, WalletModule, InfluencerModule],
  controllers: [CoursesController, EducatorController, CourseSectionController, CourseLessonController, CourseEnrollmentController, CourseAttachmentController, DashboardController, LearnerController],
  providers: [CoursesService, EducatorService, CourseSectionService, CourseLessonService, CourseEnrollmentService, CourseAttachmentService, DashboardService, LearnerService],
  exports: [CoursesService, EducatorService, CourseSectionService, CourseLessonService, CourseEnrollmentService, CourseAttachmentService, DashboardService, LearnerService, MongooseModule]
})


export class CoursesModule { }
