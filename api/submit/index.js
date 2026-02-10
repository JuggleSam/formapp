const sql = require("mssql");
const { randomUUID } = require("crypto");

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

module.exports = async function (context, req) {

    // SAFE diagnostics (inside function!)
    const missing = ["SQL_USER", "SQL_PASSWORD", "SQL_SERVER", "SQL_DATABASE"]
        .filter(k => !process.env[k]);

    if (missing.length) {
        context.res = { status: 500, body: "Missing app settings: " + missing.join(", ") };
        return;
    }

    try {
        const body = req.body || {};
        const name = (body.name || "").trim();
        const email = (body.email || "").trim();
        const message = (body.message || "").trim();

        if (!name) {
            context.res = { status: 400, body: "Name is required." };
            return;
        }

        if (!pool) pool = await sql.connect(getConfig());

        const id = randomUUID();

        await pool.request()
            .input("Id", sql.UniqueIdentifier, id)
            .input("Name", sql.NVarChar(200), name)
            .input("Email", sql.NVarChar(200), email || null)
            .input("Message", sql.NVarChar(sql.MAX), message || null)
            .query(`
        INSERT INTO dbo.FormSubmissions (Id, Name, Email, Message)
        VALUES (@Id, @Name, @Email, @Message)
      `);

        context.res = { status: 200, body: "Saved" };

    } catch (err) {
        context.log(err);
        context.res = { status: 500, body: "Server error: " + err.message };
    }
};
