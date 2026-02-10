import { useState } from "react";

export default function App() {
    const [form, setForm] = useState({ name: "", email: "", message: "" });
    const [status, setStatus] = useState("");

    function onChange(e) {
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    }

    async function onSubmit(e) {
        e.preventDefault();
        setStatus("Saving...");

        try {
            const res = await fetch("/api/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            if (res.ok) {
                setStatus("Saved!");
                setForm({ name: "", email: "", message: "" });
            } else {
                const text = await res.text().catch(() => "");
                setStatus(`Error saving. ${text}`);
            }
        } catch (err) {
            setStatus("Network error calling /api/submit");
        }
    }

    return (
        <div style={{ maxWidth: 640, margin: "40px auto", fontFamily: "sans-serif" }}>
            <h1>Form submission</h1>

            <form onSubmit={onSubmit}>
                <div style={{ marginBottom: 12 }}>
                    <label>Name *</label>
                    <input
                        name="name"
                        value={form.name}
                        onChange={onChange}
                        required
                        style={{ width: "100%", padding: 8 }}
                    />
                </div>

                <div style={{ marginBottom: 12 }}>
                    <label>Email</label>
                    <input
                        name="email"
                        value={form.email}
                        onChange={onChange}
                        style={{ width: "100%", padding: 8 }}
                    />
                </div>

                <div style={{ marginBottom: 12 }}>
                    <label>Message</label>
                    <textarea
                        name="message"
                        value={form.message}
                        onChange={onChange}
                        rows={5}
                        style={{ width: "100%", padding: 8 }}
                    />
                </div>

                <button type="submit" style={{ padding: "10px 16px" }}>
                    Submit
                </button>
            </form>

            <p style={{ marginTop: 16 }}>{status}</p>

            <p style={{ marginTop: 24, opacity: 0.7 }}>
                (Next step: we’ll create the /api/submit endpoint so this actually saves.)
            </p>
        </div>
    );
}

