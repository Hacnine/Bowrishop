import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInquiryDto, RespondInquiryDto } from './dto/inquiry.dto';
import { EmailService } from '../email/email.service';
import { InquiryStatus } from '@prisma/client';

@Injectable()
export class InquiriesService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async create(dto: CreateInquiryDto, userId?: string) {
    return this.prisma.inquiry.create({
      data: { ...dto, userId },
    });
  }

  async findAll(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where = status ? { status: status as InquiryStatus } : {};
    const [inquiries, total] = await Promise.all([
      this.prisma.inquiry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.inquiry.count({ where }),
    ]);
    return { inquiries, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async respond(id: string, dto: RespondInquiryDto) {
    const inquiry = await this.prisma.inquiry.findUnique({ where: { id } });
    if (!inquiry) throw new NotFoundException('Inquiry not found');

    const updated = await this.prisma.inquiry.update({
      where: { id },
      data: {
        response: dto.response,
        status: (dto.status as InquiryStatus) || 'RESOLVED',
      },
    });

    this.emailService
      .sendInquiryResponse(inquiry.email, inquiry.name, inquiry.subject, dto.response)
      .catch(console.error);

    return updated;
  }
}

