function required(name: string, fallback: string): string {
  const value = process.env[name] ?? fallback;
  if (value.trim().length === 0) {
    throw new Error(`${name} must not be empty`);
  }
  return value;
}

function port(name: string, fallback: number): number {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error(`${name} must be a valid port number`);
  }
  return value;
}

export const environment = {
  databaseHost: required('DATABASE_HOST', 'localhost'),
  databasePort: port('DATABASE_PORT', 5432),
  databaseName: required('DATABASE_NAME', 'monolog'),
  databaseUser: required('DATABASE_USER', 'monolog'),
  databasePassword: required('DATABASE_PASSWORD', 'monolog'),
  backendPort: port('BACKEND_PORT', 3000),
};
