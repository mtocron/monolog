import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { environment } from '../config/environment';

export const databaseOptions: TypeOrmModuleOptions = {
  type: 'postgres',
  host: environment.databaseHost,
  port: environment.databasePort,
  username: environment.databaseUser,
  password: environment.databasePassword,
  database: environment.databaseName,
  autoLoadEntities: true,
  synchronize: false,
  retryAttempts: 10,
  retryDelay: 3000,
};
