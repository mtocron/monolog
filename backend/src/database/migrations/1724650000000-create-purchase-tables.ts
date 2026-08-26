import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePurchaseTables1724650000000 implements MigrationInterface {
  name = 'CreatePurchaseTables1724650000000';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE purchase_categories (id varchar(26) PRIMARY KEY, name varchar NOT NULL UNIQUE, sort_order integer NOT NULL, created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    );
    await queryRunner.query(
      `CREATE TABLE purchases (id varchar(26) PRIMARY KEY, name varchar NOT NULL, purchase_category_id varchar(26) NOT NULL REFERENCES purchase_categories(id), purchased_at date NOT NULL, price integer NOT NULL CHECK (price >= 0), shop varchar, description text, created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    );
    await queryRunner.query(
      `CREATE TABLE purchase_images (id varchar(26) PRIMARY KEY, purchase_id varchar(26) NOT NULL REFERENCES purchases(id), file_path text NOT NULL, original_file_name text NOT NULL, sort_order integer NOT NULL, created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    );
    await queryRunner.query(
      `CREATE TABLE purchase_categories_log (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, source_id varchar(26) NOT NULL, operation varchar(6) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE')), name varchar NOT NULL, sort_order integer NOT NULL, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL, logged_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    );
    await queryRunner.query(
      `CREATE TABLE purchases_log (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, source_id varchar(26) NOT NULL, operation varchar(6) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE')), name varchar NOT NULL, purchase_category_id varchar(26) NOT NULL, purchased_at date NOT NULL, price integer NOT NULL, shop varchar, description text, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL, logged_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    );
    await queryRunner.query(
      `CREATE TABLE purchase_images_log (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, source_id varchar(26) NOT NULL, operation varchar(6) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE')), purchase_id varchar(26) NOT NULL, file_path text NOT NULL, original_file_name text NOT NULL, sort_order integer NOT NULL, created_at timestamptz NOT NULL, logged_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    );
    for (const table of ['purchase_categories', 'purchases', 'purchase_images'])
      await queryRunner.query(
        `CREATE INDEX idx_${table}_log_source_id_id ON ${table}_log (source_id, id)`,
      );
    await queryRunner.query(
      `CREATE FUNCTION fn_purchase_categories_log() RETURNS TRIGGER AS $$ BEGIN INSERT INTO purchase_categories_log (source_id, operation, name, sort_order, created_at, updated_at) VALUES (NEW.id, TG_OP, NEW.name, NEW.sort_order, NEW.created_at, NEW.updated_at); RETURN NEW; END; $$ LANGUAGE plpgsql`,
    );
    await queryRunner.query(
      `CREATE FUNCTION fn_purchases_log() RETURNS TRIGGER AS $$ BEGIN INSERT INTO purchases_log (source_id, operation, name, purchase_category_id, purchased_at, price, shop, description, created_at, updated_at) VALUES (NEW.id, TG_OP, NEW.name, NEW.purchase_category_id, NEW.purchased_at, NEW.price, NEW.shop, NEW.description, NEW.created_at, NEW.updated_at); RETURN NEW; END; $$ LANGUAGE plpgsql`,
    );
    await queryRunner.query(
      `CREATE FUNCTION fn_purchase_images_log() RETURNS TRIGGER AS $$ BEGIN INSERT INTO purchase_images_log (source_id, operation, purchase_id, file_path, original_file_name, sort_order, created_at) VALUES (NEW.id, TG_OP, NEW.purchase_id, NEW.file_path, NEW.original_file_name, NEW.sort_order, NEW.created_at); RETURN NEW; END; $$ LANGUAGE plpgsql`,
    );
    for (const table of ['purchase_categories', 'purchases', 'purchase_images'])
      await queryRunner.query(
        `CREATE TRIGGER trg_${table}_log AFTER INSERT OR UPDATE ON ${table} FOR EACH ROW EXECUTE FUNCTION fn_${table}_log()`,
      );
    const categories = [
      '食事',
      '日用品',
      '家電',
      'ガジェット',
      '服',
      '本',
      'ゲーム',
      'サブスク',
      '交通',
      '旅行',
      '医療',
      'その他',
    ];
    for (const [index, name] of categories.entries())
      await queryRunner.query(
        `INSERT INTO purchase_categories (id, name, sort_order) VALUES ($1, $2, $3)`,
        [
          `01J000000000000000000000${String(index + 1).padStart(2, '0')}`,
          name,
          index + 1,
        ],
      );
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of ['purchase_images', 'purchases', 'purchase_categories'])
      await queryRunner.query(`DROP TRIGGER trg_${table}_log ON ${table}`);
    for (const table of ['purchase_images', 'purchases', 'purchase_categories'])
      await queryRunner.query(`DROP FUNCTION fn_${table}_log`);
    for (const table of [
      'purchase_images_log',
      'purchases_log',
      'purchase_categories_log',
      'purchase_images',
      'purchases',
      'purchase_categories',
    ])
      await queryRunner.query(`DROP TABLE ${table}`);
  }
}
