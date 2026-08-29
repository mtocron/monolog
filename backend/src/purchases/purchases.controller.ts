import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { PurchaseIdParamDto } from './dto/purchase-id-param.dto';
import { PurchaseImageParamDto } from './dto/purchase-image-param.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import type { UploadedPurchaseImage } from './image-upload';
import { PurchasesService } from './purchases.service';
import { SearchPurchasesDto } from './dto/search-purchases.dto';
@Controller()
export class PurchasesController {
  constructor(private readonly purchases: PurchasesService) {}
  @Get('purchases') findAll(@Query() query: SearchPurchasesDto) {
    return this.purchases.findAll(query);
  }
  @Get('purchases/:id') findOne(@Param() params: PurchaseIdParamDto) {
    return this.purchases.findOne(params.id);
  }
  @Post('purchases') create(@Body() body: CreatePurchaseDto) {
    return this.purchases.create(body);
  }
  @Put('purchases/:id') update(
    @Param() params: PurchaseIdParamDto,
    @Body() body: UpdatePurchaseDto,
  ) {
    return this.purchases.update(params.id, body);
  }
  @Delete('purchases/:id') @HttpCode(204) async remove(
    @Param() params: PurchaseIdParamDto,
  ): Promise<void> {
    await this.purchases.remove(params.id);
  }
  @Get('purchase-categories') findCategories() {
    return this.purchases.findAllCategories();
  }
  @Post('purchases/:id/images')
  @UseInterceptors(FilesInterceptor('images', 10))
  addImages(
    @Param() params: PurchaseIdParamDto,
    @UploadedFiles() files: UploadedPurchaseImage[] | undefined,
  ) {
    return this.purchases.addImages(params.id, files ?? []);
  }
  @Get('purchases/:purchaseId/images/:imageId')
  async getImage(
    @Param() params: PurchaseImageParamDto,
    @Res() response: Response,
  ): Promise<void> {
    const image = await this.purchases.getImage(
      params.purchaseId,
      params.imageId,
    );
    response.type(image.mimeType).sendFile(image.absolutePath);
  }
  @Delete('purchases/:purchaseId/images/:imageId')
  @HttpCode(204)
  async removeImage(@Param() params: PurchaseImageParamDto): Promise<void> {
    await this.purchases.removeImage(params.purchaseId, params.imageId);
  }
}
