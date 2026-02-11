const sql = require("mssql");

let pool;

function getConfig() {
  return {
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    server: process.env.SQL_SERVER,
    database: process.env.SQL_DATABASE,
    options: { encrypt: true }
  };
}

function clampInt(value, def, min, max) {
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n)) return def;
  return Math.min(Math.max(n, min), max);
}

module.exports = async function (context, req) {
  try {
    const top = clampInt(req.query.top, 50, 1, 200);
    const skip = clampInt(req.query.skip, 0, 0, 1000000);

    if (!pool) pool = await sql.connect(getConfig());

    const countResult = await pool.request().query(`
      SELECT COUNT_BIG(1) AS Total
      FROM dbo.FormSubmissions
    `);
    const total = Number(countResult.recordset?.[0]?.Total ?? 0);

    const result = await pool.request()
      .input("skip", sql.Int, skip)
      .input("top", sql.Int, top)
      .query(`
        SELECT Id, Name, Email, Message, CreatedUtc
        FROM dbo.FormSubmissions
        ORDER BY CreatedUtc DESC
        OFFSET @skip ROWS
        FETCH NEXT @top ROWS ONLY
      `);

    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: { items: result.recordset, count: total, top, skip }
    };
  } catch (err) {
    context.log("Submissions error:", err);
    context.res = {
      status: 500,
      headers: { "Content-Type": "application/json" },
      body: { success: false, message: "Server error" }
    };
  }
};
