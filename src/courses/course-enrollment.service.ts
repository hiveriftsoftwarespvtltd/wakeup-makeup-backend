import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { CourseEnrollment, CourseEnrollmentDocument, EnrollmentStatus } from './schema/course-enrollement.schema';
import { LessonProgress, LessonProgressDocument } from './schema/course-lesson-progress.schema';
import { CourseLesson, CourseLessonDocument } from './schema/course-lesson.schema';
import { Course, CourseDocument } from './schema/course.schema';
import { EnrollCourseDTO, PurchaseCourseDTO, UpdateLessonProgressDTO } from './dto/course-enrollment.dto';
import { ApiResponse } from 'src/common/responses/api-response';
import { CoursePurchase, CoursePurchaseDocument, CoursePurchaseStatus } from './schema/course-purchase.schema';
import { UserWalletService } from 'src/wallet/service/user/user.wallet.service';
import { EducatorWalletService } from 'src/wallet/service/educator/educator.wallet.service';
import { CashbackSlab, CashbackSlabDocument, CashbackType } from 'src/wallet/schema/cashback/cashbacks.slabs.schema';
import { PaymentMethod } from 'src/order/schema/order.schema';
import { WalletTransactionReason } from 'src/wallet/schema/user/user.wallet.transactions';
import { EducatorWalletTransactionReason } from 'src/wallet/schema/educator/educator.wallet.transactions';
import {
    CommissionRate,
    CommissionRateDocument,
    CommissionEntityType,
    CommissionOn,
} from 'src/admin/schema/commission-rate.schema';
import { AffiliateTrackingService } from 'src/influencer/affiliate-tracking.service';
import { CouponService } from 'src/coupon/coupon.service';

@Injectable()
export class CourseEnrollmentService {
    constructor(
        @InjectModel(CourseEnrollment.name) private courseEnrollmentModel: Model<CourseEnrollmentDocument>,
        @InjectModel(LessonProgress.name) private lessonProgressModel: Model<LessonProgressDocument>,
        @InjectModel(CourseLesson.name) private courseLessonModel: Model<CourseLessonDocument>,
        @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
        @InjectModel(CoursePurchase.name) private coursePurchaseModel: Model<CoursePurchaseDocument>,
        @InjectModel(CashbackSlab.name) private cashbackSlabModel: Model<CashbackSlabDocument>,
        @InjectModel(CommissionRate.name) private commissionRateModel: Model<CommissionRateDocument>,
        private userWalletService: UserWalletService,
        private educatorWalletService: EducatorWalletService,
        @InjectConnection() private connection: Connection,
        private affiliateTrackingService: AffiliateTrackingService,
        private couponService: CouponService,
    ) { }

    async enrollUser(learnerId: string, dto: EnrollCourseDTO) {
        const course = await this.courseModel.findOne({ _id: new Types.ObjectId(dto.courseId), isDeleted: false });
        if (!course) {
            throw new NotFoundException('Course not found');
        }

        const existingEnrollment = await this.courseEnrollmentModel.findOne({
            learnerId: new Types.ObjectId(learnerId),
            courseId: new Types.ObjectId(dto.courseId)
        });

        if (existingEnrollment) {
            throw new BadRequestException('User is already enrolled in this course');
        }

        if (!course.isFree) {
            throw new BadRequestException("Course is not free to enroll. Please purchase the course to enroll.");
        }

        const enrollment = await this.courseEnrollmentModel.create({
            learnerId: new Types.ObjectId(learnerId),
            courseId: new Types.ObjectId(dto.courseId),
            status: EnrollmentStatus.ACTIVE,
            progressPercentage: 0
        });

        return ApiResponse.success('Enrolled successfully', enrollment);
    }

    async purchaseCourse(learnerId: string, dto: PurchaseCourseDTO) {
        const session = await this.connection.startSession();
        try {
            session.startTransaction();

            const course = await this.courseModel.findOne({ _id: new Types.ObjectId(dto.courseId), isDeleted: false })
                .populate('educatorId')
                .session(session);
            if (!course) {
                throw new NotFoundException('Course not found');
            }

            const educator: any = course.educatorId;

            // ── Resolve commission from admin CommissionRate schema ───────────────
            const DEFAULT_COMMISSION_RATE = 25;
            const DEFAULT_COMMISSION_ON = CommissionOn.SALEVALUE; // courses are revenue-based

            const commissionDoc = await this.commissionRateModel.findOne().session(session);
            const educatorSlab = commissionDoc?.commissions?.find(
                (s) => s.entityType === CommissionEntityType.EDUCATOR,
            );

            const platformCommissionRate =
                educatorSlab?.commissionPercentage ?? DEFAULT_COMMISSION_RATE;
            const platformCommissionOn =
                educatorSlab?.commissionOn ?? DEFAULT_COMMISSION_ON;

            const existingPurchase = await this.coursePurchaseModel.findOne({
                learnerId: new Types.ObjectId(learnerId),
                courseId: new Types.ObjectId(dto.courseId),
                status: CoursePurchaseStatus.PAID
            }).session(session);

            if (existingPurchase) {
                throw new BadRequestException('User has already purchased this course');
            }

            let walletAmountUsed = 0;
            let totalAmount = course.offeredPrice > 0 ? course.offeredPrice : course.sellingPrice;

            let appliedCoupon: any = null;
            let discountAmount = 0;

            if (dto.couponCode) {
                const couponRes = await this.couponService.validateCouponForAmount(
                    learnerId,
                    dto.couponCode,
                    totalAmount,
                    educator._id.toString()
                );
                appliedCoupon = couponRes.coupon;
                discountAmount = couponRes.discount;
                totalAmount -= discountAmount;
            }

            const isPaid = dto.paymentMethod !== PaymentMethod.CASH_ON_DELIVERY;

            if (dto.paymentMethod === PaymentMethod.WALLET || dto.paymentMethod === PaymentMethod.WALLET_PLUS_ONLINE) {
                const userWallet = await this.userWalletService.getBalance(learnerId);

                if (dto.paymentMethod === PaymentMethod.WALLET) {
                    if (userWallet.balance < totalAmount) {
                        throw new BadRequestException('Insufficient wallet balance to cover the course purchase');
                    }
                    walletAmountUsed = totalAmount;
                } else if (dto.paymentMethod === PaymentMethod.WALLET_PLUS_ONLINE) {
                    if (userWallet.balance <= 0) {
                        throw new BadRequestException('Insufficient wallet balance');
                    }
                    walletAmountUsed = Math.min(userWallet.balance, totalAmount);
                }

                if (walletAmountUsed > 0) {
                    await this.userWalletService.deductBalance(
                        learnerId,
                        walletAmountUsed,
                        WalletTransactionReason.COURSE_PAYMENT,
                        `Payment for Course ${course.title}`,
                        session
                    );
                }
            }

            // Choose commission base
            let commissionBase: number;
            if (platformCommissionOn === CommissionOn.PROFITVALUE) {
                const costPrice = course.costPrice ?? 0;
                commissionBase = Math.max(0, totalAmount - costPrice);
            } else {
                commissionBase = totalAmount;
            }

            const platformCommissionAmount = Number(((commissionBase * platformCommissionRate) / 100).toFixed(2));
            const educatorEarnings = parseFloat((totalAmount - platformCommissionAmount).toFixed(2));

            const [purchase] = await this.coursePurchaseModel.create([{
                learnerId: new Types.ObjectId(learnerId),
                courseId: new Types.ObjectId(dto.courseId),
                amount: totalAmount,
                paymentMethod: dto.paymentMethod,
                walletAmountUsed,
                status: CoursePurchaseStatus.PAID,
                isSettled: false,
                platformCommissionRate,
                platformCommissionOn,
                platformCommissionAmount,
                couponId: appliedCoupon ? appliedCoupon._id : undefined,
                couponCode: appliedCoupon ? appliedCoupon.code : undefined,
                discountAmount: discountAmount,
                paymentMeta: {
                    cashbackAwarded: false
                }
            }], { session });

            if (appliedCoupon) {
                await this.couponService.recordCourseCouponUsage(learnerId, appliedCoupon._id.toString(), purchase._id.toString(), session);
            }

            // Enroll user immediately on purchase
            await this.courseEnrollmentModel.create([{
                learnerId: new Types.ObjectId(learnerId),
                courseId: new Types.ObjectId(dto.courseId),
                status: EnrollmentStatus.ACTIVE,
                progressPercentage: 0
            }], { session });

            // Educator wallet earnings
            await this.educatorWalletService.addBalance(
                educator._id.toString(),
                educatorEarnings,
                EducatorWalletTransactionReason.COURSE_PURCHASE_EARNING,
                `Earnings for Course Purchase: ${course.title} (Platform Fee: ${platformCommissionAmount})`,
                purchase._id.toString(),
                session
            );

            // Cashback logic
            if (isPaid) {
                const applicableSlab = await this.cashbackSlabModel.findOne({
                    isActive: true,
                    minValue: { $lte: totalAmount },
                    maxValue: { $gte: totalAmount }
                }).session(session);

                if (applicableSlab) {
                    let cashbackAmount = 0;
                    if (applicableSlab.cashbackType === CashbackType.PERCENTAGE) {
                        cashbackAmount = (totalAmount * applicableSlab.cashbackValue) / 100;
                        if (applicableSlab.maxCashback && applicableSlab.maxCashback > 0 && cashbackAmount > applicableSlab.maxCashback) {
                            cashbackAmount = applicableSlab.maxCashback;
                        }
                    } else {
                        cashbackAmount = applicableSlab.cashbackValue;
                    }

                    if (cashbackAmount > 0) {
                        await this.userWalletService.addBalance(
                            learnerId,
                            cashbackAmount,
                            WalletTransactionReason.CASHBACK,
                            `Cashback for Course Purchase ${course.title}`,
                            session
                        );
                        purchase.paymentMeta.cashbackAwarded = true;
                        await purchase.save({ session });
                    }
                }
            }

            await this.affiliateTrackingService.createPendingCommission(learnerId, 'COURSE', purchase._id, totalAmount);
            if (purchase.status === CoursePurchaseStatus.PAID) {
                await this.affiliateTrackingService.updateCommissionStatus(purchase._id, 'COURSE', 'PAID');
            }

            await session.commitTransaction();
            return ApiResponse.success('Course purchased successfully', purchase);
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            await session.endSession();
        }
    }

    async getEnrollmentDetails(learnerId: string, courseId: string) {
        const enrollment = await this.courseEnrollmentModel.findOne({
            learnerId: new Types.ObjectId(learnerId),
            courseId: new Types.ObjectId(courseId)
        }).lean();

        if (!enrollment) {
            throw new NotFoundException('Enrollment not found');
        }

        const progress = await this.lessonProgressModel.find({
            learnerId: new Types.ObjectId(learnerId),
            courseId: new Types.ObjectId(courseId)
        }).lean();

        return ApiResponse.success('Course progress retrieved', { enrollment, progress });
    }

    async getUserEnrollments(learnerId: string) {
        const enrollments = await this.courseEnrollmentModel
            .find({
                learnerId: new Types.ObjectId(learnerId)
            })
            .populate({
                path: 'courseId',
                select: 'title thumbnail level isDeleted',
                populate: [
                    {
                        path: 'educatorId',
                        select: 'fullName profileImage'
                    },
                    {
                        path: 'thumbnail',
                        select: '_id url publicId'
                    }
                ]
            })
            .sort({ createdAt: -1 })
            .lean();

        return ApiResponse.success(
            'User enrollments retrieved',
            enrollments
        );
    }

    async updateLessonProgress(learnerId: string, dto: UpdateLessonProgressDTO) {
        const session = await this.connection.startSession();
        try {
            session.startTransaction();

            const enrollment = await this.courseEnrollmentModel.findOne({
                learnerId: new Types.ObjectId(learnerId),
                courseId: new Types.ObjectId(dto.courseId)
            }).session(session);

            if (!enrollment) {
                throw new NotFoundException('Enrollment not found');
            }

            let progress = await this.lessonProgressModel.findOne({
                learnerId: new Types.ObjectId(learnerId),
                lessonId: new Types.ObjectId(dto.lessonId)
            }).session(session);

            if (!progress) {
                progress = new this.lessonProgressModel({
                    learnerId: new Types.ObjectId(learnerId),
                    courseId: new Types.ObjectId(dto.courseId),
                    lessonId: new Types.ObjectId(dto.lessonId),
                    watchedDurationInSeconds: dto.watchedDurationInSeconds || 0,
                    isCompleted: dto.isCompleted || false,
                    completedAt: dto.isCompleted ? new Date() : undefined
                });
            } else {
                if (dto.watchedDurationInSeconds !== undefined) {
                    progress.watchedDurationInSeconds = dto.watchedDurationInSeconds;
                }
                if (dto.isCompleted !== undefined && !progress.isCompleted && dto.isCompleted) {
                    progress.isCompleted = true;
                    progress.completedAt = new Date();
                }
            }

            await progress.save({ session });

            // Recalculate progress percentage
            const totalLessons = await this.courseLessonModel.countDocuments({ courseId: new Types.ObjectId(dto.courseId) }).session(session);

            if (totalLessons > 0) {
                const completedLessons = await this.lessonProgressModel.countDocuments({
                    learnerId: new Types.ObjectId(learnerId),
                    courseId: new Types.ObjectId(dto.courseId),
                    isCompleted: true
                }).session(session);

                const percentage = Math.round((completedLessons / totalLessons) * 100);
                enrollment.progressPercentage = percentage;

                if (percentage === 100 && enrollment.status !== EnrollmentStatus.COMPLETED) {
                    enrollment.status = EnrollmentStatus.COMPLETED;
                    enrollment.completedAt = new Date();
                }

                await enrollment.save({ session });
            }

            await session.commitTransaction();
            return ApiResponse.success('Lesson progress updated', { progress, progressPercentage: enrollment.progressPercentage });
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            await session.endSession();
        }
    }
}
