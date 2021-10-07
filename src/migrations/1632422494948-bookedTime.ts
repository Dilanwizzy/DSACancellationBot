import {MigrationInterface, QueryRunner} from "typeorm";

export class bookedTime1632422494948 implements MigrationInterface {
    name = 'bookedTime1632422494948'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "bookedTime" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "booked_date" TIMESTAMP NOT NULL, "earliest_date" TIMESTAMP NOT NULL, "user_id" character varying NOT NULL, "auto_book" boolean NOT NULL DEFAULT true, "booked_preferred_location" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_0697f2d17a76eddc70486aac63b" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "bookedTime"`);
    }

}
