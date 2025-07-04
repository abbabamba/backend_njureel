import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCancellationReason1745586288519 implements MigrationInterface {
    name = 'AddCancellationReason1745586288519'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vital_signs" DROP CONSTRAINT "PK_a8cb911d0f8baaeb63728e17f95"`);
        await queryRunner.query(`ALTER TABLE "vital_signs" ADD CONSTRAINT "PK_7981ddeb8cf72e9d2d273633e64" PRIMARY KEY ("signId")`);
        await queryRunner.query(`ALTER TABLE "vital_signs" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "appointment" ADD "cancellationReason" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointment" DROP COLUMN "cancellationReason"`);
        await queryRunner.query(`ALTER TABLE "vital_signs" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "vital_signs" DROP CONSTRAINT "PK_7981ddeb8cf72e9d2d273633e64"`);
        await queryRunner.query(`ALTER TABLE "vital_signs" ADD CONSTRAINT "PK_a8cb911d0f8baaeb63728e17f95" PRIMARY KEY ("id", "signId")`);
    }

}
