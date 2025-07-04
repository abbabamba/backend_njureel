import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class AddMedicalRecordToUser1742913199048 implements MigrationInterface {
  name = 'AddMedicalRecordToUser1742913199048'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Création de la table medical_record si elle n'existe pas déjà
    await queryRunner.createTable(new Table({
      name: 'medical_record',
      columns: [
        {
          name: 'recordId',
          type: 'int',
          isPrimary: true,
          isGenerated: true,
          generationStrategy: 'increment',
        },
        {
          name: 'bloodType',
          type: 'varchar',
          isNullable: true,
        },
        {
          name: 'allergies',
          type: 'varchar',
          isNullable: true,
        },
        {
          name: 'chronicDiseases',
          type: 'varchar',
          isNullable: true,
        },
        {
          name: 'treatments',
          type: 'varchar',
          isNullable: true,
        },
      ],
    }), true);

    // Ajout de la colonne medicalRecordRecordId dans user
    await queryRunner.query(`
      ALTER TABLE "user"
      ADD "medicalRecordRecordId" integer
    `);

    // Création de la clé étrangère entre user.medicalRecordRecordId -> medical_record.recordId
    await queryRunner.createForeignKey("user", new TableForeignKey({
      columnNames: ["medicalRecordRecordId"],
      referencedColumnNames: ["recordId"],
      referencedTableName: "medical_record",
      onDelete: "CASCADE",
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("user");
    const foreignKey = table?.foreignKeys.find(
      fk => fk.columnNames.includes("medicalRecordRecordId")
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey("user", foreignKey);
    }

    await queryRunner.query(`
      ALTER TABLE "user"
      DROP COLUMN "medicalRecordRecordId"
    `);

    await queryRunner.dropTable("medical_record");
  }
}
