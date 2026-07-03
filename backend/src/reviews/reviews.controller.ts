import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Optional } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, UpdateReviewDto } from './dto/review.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Reviews')
@Controller('products/:productId/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  getProductReviews(@Param('productId') productId: string) {
    return this.reviewsService.getProductReviews(productId);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  createReview(
    @CurrentUser() user: any,
    @Param('productId') productId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(user.id, productId, dto);
  }

  @Patch(':reviewId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  updateReview(
    @CurrentUser() user: any,
    @Param('reviewId') reviewId: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.updateReview(user.id, reviewId, dto);
  }

  @Delete(':reviewId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  deleteReview(@CurrentUser() user: any, @Param('reviewId') reviewId: string) {
    return this.reviewsService.deleteReview(user.id, reviewId, user.role === 'ADMIN');
  }
}
