import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { IsIn } from 'class-validator';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { SETTING_KEYS, SettingsService } from './settings.service';
import type { SettingKey } from './settings.service';

class SettingKeyParam {
  @IsIn(SETTING_KEYS)
  key!: SettingKey;
}

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  findAll() {
    return this.settingsService.findAll();
  }

  @Get(':key')
  findByKey(@Param() params: SettingKeyParam) {
    return this.settingsService.findByKey(params.key);
  }

  @Put(':key')
  update(@Param() params: SettingKeyParam, @Body() body: UpdateSettingDto) {
    return this.settingsService.update(params.key, body.value);
  }
}
