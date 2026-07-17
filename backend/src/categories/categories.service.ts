import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Tree structure: শুধু root categories (parentId = null),
   * প্রতিটার সাথে subCategories nested হয়ে আসে।
   * Admin panel ও frontend navigation এ ব্যবহার হবে।
   */
  async findAll() {
    return this.prisma.category.findMany({
      where: { parentId: null },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { products: true } },
        subCategories: {
          orderBy: { name: 'asc' },
          include: {
            _count: { select: { products: true } },
            // 3rd level দরকার হলে এখানে আরেকটা subCategories include করো
          },
        },
      },
    });
  }

  /**
   * Flat list: সব categories (parent + sub) একই array তে।
   * Product form এর category dropdown এ ব্যবহার হবে।
   * parent এর name সহ আসে যাতে "Electronics > Phones" style label বানানো যায়।
   */
  async findAllFlat() {
    return this.prisma.category.findMany({
      orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
      include: {
        _count: { select: { products: true } },
        parent: { select: { id: true, name: true } },
      },
    });
  }

  async findOne(id: string) {
    const cat = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true } },
        subCategories: { orderBy: { name: 'asc' } },
        _count: { select: { products: true } },
      },
    });
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  async create(dto: CreateCategoryDto) {
    // Name/slug uniqueness check
    const existing = await this.prisma.category.findFirst({
      where: { OR: [{ slug: dto.slug }, { name: dto.name }] },
    });
    if (existing) throw new ConflictException('Category with this name or slug already exists');

    // parentId দেওয়া হলে সেটা valid কিনা check করো
    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({ where: { id: dto.parentId } });
      if (!parent) throw new NotFoundException('Parent category not found');
      // একটা sub-category কে parent বানানো prevent করতে চাইলে:
      if (parent.parentId) {
        throw new BadRequestException('Cannot create a sub-category under another sub-category (max 2 levels)');
      }
    }

    return this.prisma.category.create({ data: dto });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);

    // নিজেকে নিজের parent বানানো prevent করো
    if (dto.parentId === id) {
      throw new BadRequestException('A category cannot be its own parent');
    }

    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({ where: { id: dto.parentId } });
      if (!parent) throw new NotFoundException('Parent category not found');
      if (parent.parentId) {
        throw new BadRequestException('Cannot nest under another sub-category (max 2 levels)');
      }
    }

    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const cat = await this.findOne(id);

    // Sub-categories থাকলে delete block করো
    if (cat.subCategories && cat.subCategories.length > 0) {
      throw new BadRequestException(
        `Cannot delete: this category has ${cat.subCategories.length} sub-categor${cat.subCategories.length === 1 ? 'y' : 'ies'}. Delete them first.`,
      );
    }

    return this.prisma.category.delete({ where: { id } });
  }
}
