import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAppSettings1724450000000 implements MigrationInterface {
  name = 'CreateAppSettings1724450000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE app_settings (id varchar(26) PRIMARY KEY, key varchar NOT NULL UNIQUE, value text, description text, created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    );
    await queryRunner.query(
      `CREATE TABLE app_settings_log (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, source_id varchar(26) NOT NULL, operation varchar(6) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE')), key varchar NOT NULL, value text, description text, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL, logged_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    );
    await queryRunner.query(
      'CREATE INDEX idx_app_settings_log_source_id_id ON app_settings_log (source_id, id)',
    );
    await queryRunner.query(
      `CREATE FUNCTION fn_app_settings_log() RETURNS TRIGGER AS $$ BEGIN INSERT INTO app_settings_log (source_id, operation, key, value, description, created_at, updated_at) VALUES (NEW.id, TG_OP, NEW.key, NEW.value, NEW.description, NEW.created_at, NEW.updated_at); RETURN NEW; END; $$ LANGUAGE plpgsql`,
    );
    await queryRunner.query(
      `CREATE TRIGGER trg_app_settings_log AFTER INSERT OR UPDATE ON app_settings FOR EACH ROW EXECUTE FUNCTION fn_app_settings_log()`,
    );
    await queryRunner.query(
      `INSERT INTO app_settings (id, key, value, description) VALUES ('01J00000000000000000000000', 'image.root_path', '/data/monolog/images', 'Image storage root path'), ('01J00000000000000000000001', 'appearance.theme', 'light', 'Selected color theme')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP TRIGGER trg_app_settings_log ON app_settings',
    );
    await queryRunner.query('DROP FUNCTION fn_app_settings_log');
    await queryRunner.query('DROP TABLE app_settings_log');
    await queryRunner.query('DROP TABLE app_settings');
  }
}
