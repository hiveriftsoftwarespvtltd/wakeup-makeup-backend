import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guad';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { UserRole } from 'src/user/schema/user.schema';
import { AdminDashboardService } from './admin.dashboard.service';

@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller('admin-dashboard')
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}
  @Get('overview')
  async adminOverview() {
    return await this.adminDashboardService.getAdminOverview();
  }

  @Get('revenue-trend')
  async adminRevenueTrend(@Query('days') days: number) {
    return await this.adminDashboardService.getRevenueTrend(days);
  }

  @Get('top-vendors')
  async topVendors(@Query('limit') limit:number){
    return this.adminDashboardService.TopVendors(limit)
  }

  @Get('top-categories')
  async topCategories(@Query('limit') limit:number){
    return this.adminDashboardService.topCategories(limit)
  }

  @Get('order-status-analytics')
  async orderStatusAnalytics(){
     return this.adminDashboardService.orderStatusAnalytics()
  }

  @Get('category-distribution')
  async categoryDistribution(){
    return this.adminDashboardService.categoryDistribution()
  }

  @Get('order-status-graph')
  async orderStatusGraph(){
    return this.adminDashboardService.orderStatusGraph()
  }

  @Get('monthly-analytics')
  async monthlyAnalytics(@Query('year') year:number){
    return this.adminDashboardService.monthlyAnalytics(year)
  }

  @Get('yearly-analytics')
  async yearlyAnalytics(){
    return this.adminDashboardService.yearlyAnalytics()
  }

  @Get('analytics-graph')
  async analyticsGraph(@Query('year') year:number){
    return this.adminDashboardService.analyticsGraph(year)
  }

  @Get('top-vendors-graph')
  async topVendorsGraph(@Query('limit') limit:number){
    return this.adminDashboardService.topVendorsGraph(limit)
  }
}
