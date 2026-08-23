import { registerDecorator, ValidationOptions } from 'class-validator';
import { isUlid } from '../ulid';

export function IsUlid(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    registerDecorator({
      name: 'isUlid',
      target: target.constructor,
      propertyName: propertyKey.toString(),
      options: validationOptions,
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' && isUlid(value),
      },
    });
  };
}
