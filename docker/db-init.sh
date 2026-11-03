#!/bin/bash
set -e

mysql -uroot -p"$MYSQL_ROOT_PASSWORD" <<SQL
CREATE DATABASE IF NOT EXISTS pedidos_test;
GRANT ALL PRIVILEGES ON pedidos_test.* TO '$MYSQL_USER'@'%';
SQL

mysql -uroot -p"$MYSQL_ROOT_PASSWORD" pedidos < /schema/schema.sql
mysql -uroot -p"$MYSQL_ROOT_PASSWORD" pedidos_test < /schema/schema.sql