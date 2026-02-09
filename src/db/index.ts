import {Pool} from "pg";

export const pool = new Pool({
  user: "postgres",
  host: "localhost",
  port: 5432,
  database: "geo_app",
})
