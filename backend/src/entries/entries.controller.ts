import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CreateEntryDto } from './dto/create-entry.dto';
import { CreateTagDto } from './dto/create-tag.dto';
import { EntryIdParamDto } from './dto/entry-id-param.dto';
import { EntryTagParamDto } from './dto/entry-tag-param.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { EntriesService } from './entries.service';

@Controller()
export class EntriesController {
  constructor(private readonly entriesService: EntriesService) {}

  @Get('entries') findAll() {
    return this.entriesService.findAll();
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
}
