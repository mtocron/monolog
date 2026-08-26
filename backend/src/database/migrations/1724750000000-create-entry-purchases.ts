import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEntryPurchases1724750000000 implements MigrationInterface {
  name = 'CreateEntryPurchases1724750000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE entry_purchases (id varchar(26) PRIMARY KEY, entry_id varchar(26) NOT NULL REFERENCES entries(id), purchase_id varchar(26) NOT NULL REFERENCES purchases(id), created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE (entry_id, purchase_id))`,
    );
    await queryRunner.query(
      `CREATE TABLE entry_purchases_log (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, source_id varchar(26) NOT NULL, operation varchar(6) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE')), entry_id varchar(26) NOT NULL, purchase_id varchar(26) NOT NULL, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL, logged_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    );
    await queryRunner.query(
      'CREATE INDEX idx_entry_purchases_log_source_id_id ON entry_purchases_log (source_id, id)',
    );
    await queryRunner.query(
      `CREATE FUNCTION fn_entry_purchases_log() RETURNS TRIGGER AS $$ BEGIN INSERT INTO entry_purchases_log (source_id, operation, entry_id, purchase_id, created_at, updated_at) VALUES (NEW.id, TG_OP, NEW.entry_id, NEW.purchase_id, NEW.created_at, NEW.updated_at); RETURN NEW; END; $$ LANGUAGE plpgsql`,
    );
    await queryRunner.query(
      'CREATE TRIGGER trg_entry_purchases_log AFTER INSERT OR UPDATE ON entry_purchases FOR EACH ROW EXECUTE FUNCTION fn_entry_purchases_log()',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP TRIGGER trg_entry_purchases_log ON entry_purchases',
    );
    await queryRunner.query('DROP FUNCTION fn_entry_purchases_log');
    await queryRunner.query('DROP TABLE entry_purchases_log');
    await queryRunner.query('DROP TABLE entry_purchases');
  }
}
