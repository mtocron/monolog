import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEntryTables1724550000000 implements MigrationInterface {
  name = 'CreateEntryTables1724550000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE entries (id varchar(26) PRIMARY KEY, content text NOT NULL, recorded_at timestamptz NOT NULL, emotion varchar, weather varchar, location varchar, created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    );
    await queryRunner.query(
      `CREATE TABLE entry_images (id varchar(26) PRIMARY KEY, entry_id varchar(26) NOT NULL REFERENCES entries(id), file_path text NOT NULL, original_file_name text NOT NULL, sort_order integer NOT NULL, created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    );
    await queryRunner.query(
      `CREATE TABLE tags (id varchar(26) PRIMARY KEY, name varchar NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    );
    await queryRunner.query(
      `CREATE TABLE entry_tags (id varchar(26) PRIMARY KEY, entry_id varchar(26) NOT NULL REFERENCES entries(id), tag_id varchar(26) NOT NULL REFERENCES tags(id), created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE (entry_id, tag_id))`,
    );

    await queryRunner.query(
      `CREATE TABLE entries_log (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, source_id varchar(26) NOT NULL, operation varchar(6) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE')), content text NOT NULL, recorded_at timestamptz NOT NULL, emotion varchar, weather varchar, location varchar, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL, logged_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    );
    await queryRunner.query(
      `CREATE TABLE entry_images_log (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, source_id varchar(26) NOT NULL, operation varchar(6) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE')), entry_id varchar(26) NOT NULL, file_path text NOT NULL, original_file_name text NOT NULL, sort_order integer NOT NULL, created_at timestamptz NOT NULL, logged_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    );
    await queryRunner.query(
      `CREATE TABLE tags_log (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, source_id varchar(26) NOT NULL, operation varchar(6) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE')), name varchar NOT NULL, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL, logged_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    );
    await queryRunner.query(
      `CREATE TABLE entry_tags_log (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, source_id varchar(26) NOT NULL, operation varchar(6) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE')), entry_id varchar(26) NOT NULL, tag_id varchar(26) NOT NULL, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL, logged_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    );

    await queryRunner.query(
      'CREATE INDEX idx_entries_log_source_id_id ON entries_log (source_id, id)',
    );
    await queryRunner.query(
      'CREATE INDEX idx_entry_images_log_source_id_id ON entry_images_log (source_id, id)',
    );
    await queryRunner.query(
      'CREATE INDEX idx_tags_log_source_id_id ON tags_log (source_id, id)',
    );
    await queryRunner.query(
      'CREATE INDEX idx_entry_tags_log_source_id_id ON entry_tags_log (source_id, id)',
    );

    await queryRunner.query(
      `CREATE FUNCTION fn_entries_log() RETURNS TRIGGER AS $$ BEGIN INSERT INTO entries_log (source_id, operation, content, recorded_at, emotion, weather, location, created_at, updated_at) VALUES (NEW.id, TG_OP, NEW.content, NEW.recorded_at, NEW.emotion, NEW.weather, NEW.location, NEW.created_at, NEW.updated_at); RETURN NEW; END; $$ LANGUAGE plpgsql`,
    );
    await queryRunner.query(
      `CREATE FUNCTION fn_entry_images_log() RETURNS TRIGGER AS $$ BEGIN INSERT INTO entry_images_log (source_id, operation, entry_id, file_path, original_file_name, sort_order, created_at) VALUES (NEW.id, TG_OP, NEW.entry_id, NEW.file_path, NEW.original_file_name, NEW.sort_order, NEW.created_at); RETURN NEW; END; $$ LANGUAGE plpgsql`,
    );
    await queryRunner.query(
      `CREATE FUNCTION fn_tags_log() RETURNS TRIGGER AS $$ BEGIN INSERT INTO tags_log (source_id, operation, name, created_at, updated_at) VALUES (NEW.id, TG_OP, NEW.name, NEW.created_at, NEW.updated_at); RETURN NEW; END; $$ LANGUAGE plpgsql`,
    );
    await queryRunner.query(
      `CREATE FUNCTION fn_entry_tags_log() RETURNS TRIGGER AS $$ BEGIN INSERT INTO entry_tags_log (source_id, operation, entry_id, tag_id, created_at, updated_at) VALUES (NEW.id, TG_OP, NEW.entry_id, NEW.tag_id, NEW.created_at, NEW.updated_at); RETURN NEW; END; $$ LANGUAGE plpgsql`,
    );

    await queryRunner.query(
      'CREATE TRIGGER trg_entries_log AFTER INSERT OR UPDATE ON entries FOR EACH ROW EXECUTE FUNCTION fn_entries_log()',
    );
    await queryRunner.query(
      'CREATE TRIGGER trg_entry_images_log AFTER INSERT OR UPDATE ON entry_images FOR EACH ROW EXECUTE FUNCTION fn_entry_images_log()',
    );
    await queryRunner.query(
      'CREATE TRIGGER trg_tags_log AFTER INSERT OR UPDATE ON tags FOR EACH ROW EXECUTE FUNCTION fn_tags_log()',
    );
    await queryRunner.query(
      'CREATE TRIGGER trg_entry_tags_log AFTER INSERT OR UPDATE ON entry_tags FOR EACH ROW EXECUTE FUNCTION fn_entry_tags_log()',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TRIGGER trg_entry_tags_log ON entry_tags');
    await queryRunner.query('DROP TRIGGER trg_tags_log ON tags');
    await queryRunner.query(
      'DROP TRIGGER trg_entry_images_log ON entry_images',
    );
    await queryRunner.query('DROP TRIGGER trg_entries_log ON entries');
    await queryRunner.query('DROP FUNCTION fn_entry_tags_log');
    await queryRunner.query('DROP FUNCTION fn_tags_log');
    await queryRunner.query('DROP FUNCTION fn_entry_images_log');
    await queryRunner.query('DROP FUNCTION fn_entries_log');
    await queryRunner.query('DROP TABLE entry_tags_log');
    await queryRunner.query('DROP TABLE tags_log');
    await queryRunner.query('DROP TABLE entry_images_log');
    await queryRunner.query('DROP TABLE entries_log');
    await queryRunner.query('DROP TABLE entry_tags');
    await queryRunner.query('DROP TABLE entry_images');
    await queryRunner.query('DROP TABLE tags');
    await queryRunner.query('DROP TABLE entries');
  }
}
