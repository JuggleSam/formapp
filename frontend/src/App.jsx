import { useEffect, useState } from "react";

function getTokenFromUrlOrSession() {
    const url = new URL(window.location.href);
    const t = url.searchParams.get("t");

    if (t) {
        sessionStorage.setItem("linkToken", t);
        url.searchParams.delete("t");
        window.history.replaceState({}, "", url.toString());
        return t;
    }

    return sessionStorage.getItem("linkToken") || "";
}

export default function App() {
    const [token] = useState(() => getTokenFromUrlOrSession());
    const [form, setForm] = useState({ name: "", email: "", message: "" });
    const [status, setStatus] = useState("");

    const [items, setItems] = useState([]);
    const [count, setCount] = useState(0);
    const [top, setTop] = useState(10);
    const [skip, setSkip] = useState(0);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState("");

    function onChange(e) {
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    }

    async function onSubmit(e) {
        e.preventDefault();
        setStatus("Saving...");

        try {
            const res = await fetch("/api/submit", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Link-Token": token
                },
                body: JSON.stringify(form),
            });

            if (res.ok) {
                setStatus("Saved!");
                setForm({ name: "", email: "", message: "" });
                await loadSubmissions(skip, top); // refresh list
            } else {
                const text = await res.text().catch(() => "");
                setStatus(`Error saving. ${text}`);
            }
        } catch {
            setStatus("Network error calling /api/submit");
        }
    }

    async function loadSubmissions(newSkip = skip, newTop = top) {
        setLoading(true);
        setLoadError("");
        try {
            const res = await fetch(`/api/submissions?top=${newTop}&skip=${newSkip}`, {
                headers: { "X-Link-Token": token }
            });
            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(text || `HTTP ${res.status}`);
            }
            const data = await res.json();
            setItems(data.items || []);
            setCount(Number(data.count || 0));
            setTop(Number(data.top || newTop));
            setSkip(Number(data.skip || newSkip));
        } catch (err) {
            setLoadError(err?.message || "Failed to load submissions");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!token) return;

        loadSubmissions(0, top);
        const t = setInterval(() => loadSubmissions(skip, top), 30000);
        return () => clearInterval(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const canPrev = skip > 0;
    const canNext = skip + top < count;

    if (!token) {
        return (
            <div style={{ maxWidth: 700, margin: "40px auto", fontFamily: "sans-serif" }}>
                <h1>Access required</h1>
                <p>This page requires a special link.</p>
                <p>Open the link you were given.</p>
            </div>
        );
    }


    return (
        <div style={{ maxWidth: 900, margin: "40px auto", fontFamily: "sans-serif" }}>
            <h1>Form submission</h1>

            <form onSubmit={onSubmit} style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
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
                        rows={4}
                        style={{ width: "100%", padding: 8 }}
                    />
                </div>

                <button type="submit" style={{ padding: "10px 16px" }}>
                    Submit
                </button>

                <span style={{ marginLeft: 12 }}>{status}</span>
            </form>

            <div style={{ marginTop: 30, display: "flex", alignItems: "center", gap: 10 }}>
                <h2 style={{ margin: 0 }}>Submissions</h2>
                <button onClick={() => loadSubmissions(skip, top)} disabled={loading}>
                    Refresh
                </button>

                <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
                    <button
                        onClick={() => loadSubmissions(Math.max(0, skip - top), top)}
                        disabled={!canPrev || loading}
                    >
                        Prev
                    </button>
                    <button
                        onClick={() => loadSubmissions(skip + top, top)}
                        disabled={!canNext || loading}
                    >
                        Next
                    </button>
                </div>
            </div>

            <div style={{ opacity: 0.7, marginTop: 6 }}>
                Showing {Math.min(count, skip + 1)}–{Math.min(count, skip + top)} of {count}
            </div>

            {loadError ? (
                <div style={{ marginTop: 12, color: "crimson" }}>{loadError}</div>
            ) : null}

            <div style={{ marginTop: 12, overflowX: "auto" }}>
                <table width="100%" cellPadding="8" style={{ borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ background: "#f6f6f6" }}>
                            <th align="left" style={{ borderBottom: "1px solid #ddd" }}>Created</th>
                            <th align="left" style={{ borderBottom: "1px solid #ddd" }}>Name</th>
                            <th align="left" style={{ borderBottom: "1px solid #ddd" }}>Email</th>
                            <th align="left" style={{ borderBottom: "1px solid #ddd" }}>Message</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((r) => (
                            <tr key={r.Id}>
                                <td style={{ borderBottom: "1px solid #eee", whiteSpace: "nowrap" }}>
                                    {r.CreatedUtc ? new Date(r.CreatedUtc).toLocaleString() : ""}
                                </td>
                                <td style={{ borderBottom: "1px solid #eee" }}>{r.Name}</td>
                                <td style={{ borderBottom: "1px solid #eee" }}>{r.Email ?? ""}</td>
                                <td style={{ borderBottom: "1px solid #eee" }}>{r.Message ?? ""}</td>
                            </tr>
                        ))}
                        {!loading && items.length === 0 ? (
                            <tr>
                                <td colSpan="4" style={{ padding: 16, opacity: 0.7 }}>
                                    No submissions yet.
                                </td>
                            </tr>
                        ) : null}
                    </tbody>
                </table>
            </div>

            {loading ? <div style={{ marginTop: 10, opacity: 0.7 }}>Loading...</div> : null}
        </div>
    );
}
