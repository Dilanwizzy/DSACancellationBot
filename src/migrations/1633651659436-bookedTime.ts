import {MigrationInterface, QueryRunner} from "typeorm";

export class bookedTime1633651659436 implements MigrationInterface {
    name = 'bookedTime1633651659436'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."bookedTime" ADD "location" character varying NOT NULL DEFAULT 'NEED_LOCATION'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."bookedTime" DROP COLUMN "location"`);
    }

}
