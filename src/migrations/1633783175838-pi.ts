import {MigrationInterface, QueryRunner} from "typeorm";

export class pi1633783175838 implements MigrationInterface {
    name = 'pi1633783175838'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "bookedTime" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "booked_date" TIMESTAMP NOT NULL, "earliest_date" TIMESTAMP NOT NULL, "user_id" character varying NOT NULL, "auto_book" boolean NOT NULL DEFAULT true, "location" character varying NOT NULL DEFAULT 'NEED_LOCATION', "booked_preferred_location" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_0697f2d17a76eddc70486aac63b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "proxies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "ip_address" character varying NOT NULL, "port" character varying NOT NULL, "protocol" character varying NOT NULL DEFAULT 'HTTPS', "username" character varying NOT NULL, "password" character varying NOT NULL, "hasbeen_used" boolean NOT NULL DEFAULT false, "is_deleted" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_6d4918ca61131569b4dfc0843ad" UNIQUE ("ip_address"), CONSTRAINT "PK_c66b4253ef600a915c610015093" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "tasks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "instances" character varying, "product" character varying, "website" character varying NOT NULL, "size" character varying NOT NULL, "quantity" character varying NOT NULL, CONSTRAINT "UQ_ec9be08a8a192f0e518d2e17e34" UNIQUE ("website"), CONSTRAINT "UQ_c17b4cd7fefeb7ab29d628a4e19" UNIQUE ("size"), CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "first_name" character varying, "last_name" character varying, "username" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "tasks"`);
        await queryRunner.query(`DROP TABLE "proxies"`);
        await queryRunner.query(`DROP TABLE "bookedTime"`);
    }

}
