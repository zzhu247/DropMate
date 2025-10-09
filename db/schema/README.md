# DropMate Database Schema

Run the files in numeric order to provision a brand-new PostgreSQL instance.
Each script is idempotent and safe to re-run in development environments.

```
psql $DATABASE_URL -f db/schema/00_extensions.sql
psql $DATABASE_URL -f db/schema/01_enums.sql
psql $DATABASE_URL -f db/schema/02_tables_core.sql
psql $DATABASE_URL -f db/schema/03_tables_commerce.sql
psql $DATABASE_URL -f db/schema/04_tables_fulfillment.sql
psql $DATABASE_URL -f db/schema/05_tables_messaging.sql
psql $DATABASE_URL -f db/schema/06_tables_operations.sql
psql $DATABASE_URL -f db/schema/07_indexes.sql
psql $DATABASE_URL -f db/schema/08_partitioning.sql
```

> NOTE: Partition and retention policies assume PostgreSQL 16+ with superuser or rds_superuser privileges. Adjust the generated partition statements for managed providers that restrict DDL.

