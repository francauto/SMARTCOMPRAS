import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { PoolOptions } from "mysql2/typings/mysql/lib/Pool";

dotenv.config();

const poolOptions: PoolOptions = {
  host: process.env.MYSQL_HOST,
  port: parseInt(process.env.MYSQL_PORT || "3311", 10),
  user: process.env.DB_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  charset: "utf8mb4",
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true,
};

const pool = mysql.createPool(poolOptions);

export default pool;
