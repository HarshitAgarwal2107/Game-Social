import { useEffect, useState } from "react";

function SteamTest() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const steamid = "76561199070589353";

    fetch(`${import.meta.env.VITE_API_URL}/api/games/${steamid}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((json) => setData(json))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Steam API Test</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {data ? (
        <pre
          style={{
            background: "#111",
            color: "#0f0",
            padding: "15px",
            borderRadius: "6px",
            maxHeight: "500px",
            overflow: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : (
        !error && <p>Loading...</p>
      )}
    </div>
  );
}

export default SteamTest;
