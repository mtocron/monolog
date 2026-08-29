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
import { CreateEntryDto } from './dto/create-entry.dto';
import { CreateTagDto } from './dto/create-tag.dto';
import { EntryIdParamDto } from './dto/entry-id-param.dto';
import { EntryImageParamDto } from './dto/entry-image-param.dto';
import { EntryTagParamDto } from './dto/entry-tag-param.dto';
import { EntryPurchaseParamDto } from './dto/entry-purchase-param.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { SearchEntriesDto } from './dto/search-entries.dto';
import { EntriesService } from './entries.service';
import type { UploadedEntryImage } from './image-upload';

@Controller()
export class EntriesController {
  constructor(private readonly entriesService: EntriesService) {}

  @Get('entries') findAll(@Query() query: SearchEntriesDto) {
    return this.entriesService.findAll(query);
  }
  @Get('entries/:id') findOne(@Param() params: EntryIdParamDto) {
    return this.entriesService.findOne(params.id);
  }
  @Post('entries') create(@Body() body: CreateEntryDto) {
    return this.entriesService.create(body);
  }
  @Put('entries/:id') update(
    @Param() params: EntryIdParamDto,
    @Body() body: UpdateEntryDto,
  ) {
    return this.entriesService.update(params.id, body);
  }
  @Delete('entries/:id') @HttpCode(204) async remove(
    @Param() params: EntryIdParamDto,
  ): Promise<void> {
    await this.entriesService.remove(params.id);
  }

  @Post('entries/:id/images')
  @UseInterceptors(FilesInterceptor('images', 10))
  uploadImages(
    @Param() params: EntryIdParamDto,
    @UploadedFiles() files: UploadedEntryImage[] | undefined,
  ) {
    return this.entriesService.addImages(params.id, files ?? []);
  }

  @Get('entries/:entryId/images/:imageId')
  async getImage(
    @Param() params: EntryImageParamDto,
    @Res() response: Response,
  ): Promise<void> {
    const image = await this.entriesService.getImage(
      params.entryId,
      params.imageId,
    );
    response.type(image.mimeType).sendFile(image.absolutePath);
  }

  @Delete('entries/:entryId/images/:imageId') @HttpCode(204) async removeImage(
    @Param() params: EntryImageParamDto,
  ): Promise<void> {
    await this.entriesService.removeImage(params.entryId, params.imageId);
  }

  @Get('tags') findAllTags() {
    return this.entriesService.findAllTags();
  }
  @Post('tags') createTag(@Body() body: CreateTagDto) {
    return this.entriesService.createTag(body);
  }
  @Post('entries/:entryId/tags/:tagId') attachTag(
    @Param() params: EntryTagParamDto,
  ) {
    return this.entriesService.attachTag(params.entryId, params.tagId);
  }
  @Delete('entries/:entryId/tags/:tagId') @HttpCode(204) async detachTag(
    @Param() params: EntryTagParamDto,
  ): Promise<void> {
    await this.entriesService.detachTag(params.entryId, params.tagId);
  }
  @Post('entries/:entryId/purchases/:purchaseId')
  attachPurchase(@Param() params: EntryPurchaseParamDto) {
    return this.entriesService.attachPurchase(
      params.entryId,
      params.purchaseId,
    );
  }

  @Delete('entries/:entryId/purchases/:purchaseId')
  @HttpCode(204)
  async detachPurchase(@Param() params: EntryPurchaseParamDto): Promise<void> {
    await this.entriesService.detachPurchase(params.entryId, params.purchaseId);
  }
}
