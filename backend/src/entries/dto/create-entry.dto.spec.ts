import 'reflect-metadata';
import { validate } from 'class-validator';
import { CreateEntryDto } from './create-entry.dto';

describe('CreateEntryDto', () => {
  const validEntry = (overrides: Partial<CreateEntryDto> = {}) =>
    Object.assign(new CreateEntryDto(), {
      content: '記録',
      recordedAt: new Date(),
      ...overrides,
    });

  it.each(['happy', 'calm', 'sad', 'angry', 'anxious', 'tired', 'excited'])(
    'accepts the selectable emotion %s',
    async (emotion) => {
      await expect(
        validate(validEntry({ emotion: emotion as CreateEntryDto['emotion'] })),
      ).resolves.toHaveLength(0);
    },
  );

  it.each(['sunny_cloudy', 'sunny_rainy', 'cloudy_rainy'])(
    'accepts the combined weather %s',
    async (weather) => {
      await expect(
        validate(validEntry({ weather: weather as CreateEntryDto['weather'] })),
      ).resolves.toHaveLength(0);
    },
  );

  it('rejects an unsupported weather value', async () => {
    await expect(
      validate(validEntry({ weather: 'sunny_snowy' as never })),
    ).resolves.toHaveLength(1);
  });
});
