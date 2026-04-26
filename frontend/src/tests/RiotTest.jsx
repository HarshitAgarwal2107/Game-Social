import React, { useState } from "react";

function RiotTest() {
  const [summonerName, setSummonerName] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_KEY = "YOUR_RIOT_API_KEY"; // Replace with your Riot API key
  const REGION = "na1"; // Example region: na1, euw1, kr, etc.

  const handleSearch = async () => {
    if (!summonerName.trim()) return;
    setLoading(true);
    setError("");
    setData(null);

    try {
      const response = await fetch(
        `https://${REGION}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summonerName}`,
        {
          headers: { "X-Riot-Token": API_KEY },
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: Unable to fetch data`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: "#0e0e0e",
        color: "white",
        padding: "30px",
        maxWidth: "600px",
        margin: "50px auto",
        borderRadius: "16px",
        boxShadow: "0 0 15px rgba(255,255,255,0.1)",
        fontFamily: "monospace",
      }}
    >
      <h2 style={{ textAlign: "center" }}>Riot API Test</h2>

      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Enter Summoner Name"
          value={summonerName}
          onChange={(e) => setSummonerName(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #555",
            background: "#1a1a1a",
            color: "white",
            fontSize: "16px",
          }}
        />
      </div>

      <button
        onClick={handleSearch}
        disabled={loading}
        style={{
          width: "100%",
          padding: "10px",
          background: "#ff4655",
          border: "none",
          borderRadius: "8px",
          color: "white",
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        {loading ? "Searching..." : "Search"}
      </button>

      {error && (
        <p style={{ color: "#ff6666", marginTop: "15px" }}>⚠️ {error}</p>
      )}

      {data && (
        <div style={{ marginTop: "25px" }}>
          <h3 style={{ marginBottom: "10px" }}>{data.name}</h3>
          <p>
            <strong>Summoner Level:</strong> {data.summonerLevel}
          </p>
          <p>
            <strong>Account ID:</strong> {data.accountId}
          </p>
          <p>
            <strong>PUUID:</strong> {data.puuid}
          </p>

          {/* JSON Output */}
          <div
            style={{
              background: "#111",
              padding: "10px",
              borderRadius: "8px",
              marginTop: "20px",
              border: "1px solid #333",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              overflowX: "auto",
            }}
          >
            <h4 style={{ color: "#00e676" }}>Raw JSON:</h4>
            <pre style={{ color: "#ccc", fontSize: "14px" }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default RiotTest;
