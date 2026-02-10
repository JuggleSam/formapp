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
    try {
        const body = req.body || {};
        const name = (body.name || "").trim();
        const email = (body.email || "").trim();
        const message = (body.message || "").trim();

        if (!name) {
            context.res = { status: 400, body: "Name is required." };
            return;
        }

        // Create or reuse SQL connection
        if (!pool) {
            pool = await sql.connect(getConfig());
        }

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

        context.res = {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: { success: true }
        };

    } catch (err) {
        // Log full error to Application Insights
        context.log("Submit error:", err);

        // Return safe message to client
        context.res = {
            status: 500,
            headers: { "Content-Type": "application/json" },
            body: { success: false, message: "Server error" }
        };
    }
};
