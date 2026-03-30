import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [currentCat, setCurrentCat] = useState(null);
  const [banList, setBanList] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const API_KEY = import.meta.env.VITE_CAT_API_KEY;

  const fetchCat = async () => {
    setLoading(true);
    setError("");
    setIsModalOpen(false);

    try {
      let foundValidCat = false;
      let attempts = 0;

      while (!foundValidCat && attempts < 20) {
        attempts++;

        const response = await fetch(
          "https://api.thecatapi.com/v1/images/search?limit=1&has_breeds=1",
          {
            headers: {
              "x-api-key": API_KEY,
            },
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();
        console.log("Cat API response:", data);

        if (!data || data.length === 0) continue;

        const catData = data[0];
        if (!catData.breeds || catData.breeds.length === 0) continue;

        const breedInfo = catData.breeds[0];

        const newCat = {
          id: catData.id,
          image: catData.url,
          breed: breedInfo.name || "Unknown",
          origin: breedInfo.origin || "Unknown",
          lifeSpan: breedInfo.life_span || "Unknown",
        };

        const isBanned =
          banList.includes(newCat.breed) ||
          banList.includes(newCat.origin) ||
          banList.includes(newCat.lifeSpan);

        if (!isBanned) {
          setCurrentCat(newCat);
          setHistory((prev) => [newCat, ...prev]);
          foundValidCat = true;
        }
      }

      if (!foundValidCat) {
        setError("No valid cat found. Try removing some banned attributes.");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Could not load cat data. Check the console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleBanClick = (value) => {
    if (!value) return;

    if (banList.includes(value)) {
      setBanList((prev) => prev.filter((item) => item !== value));
    } else {
      setBanList((prev) => [...prev, value]);

      if (
        currentCat &&
        (currentCat.breed === value ||
          currentCat.origin === value ||
          currentCat.lifeSpan === value)
      ) {
        setCurrentCat(null);
      }
    }
  };

  const handleHistoryClick = (cat) => {
    if (!cat) return;

    const isBanned =
      banList.includes(cat.breed) ||
      banList.includes(cat.origin) ||
      banList.includes(cat.lifeSpan);

    if (isBanned) {
      setError(
        "That cat can't be reloaded because one of its attributes is banned.",
      );
      return;
    }

    setError("");
    setCurrentCat(cat);
    setIsModalOpen(false);
  };

  useEffect(() => {
    fetchCat();
  }, []);

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        setIsModalOpen(false);
      }
    };

    if (isModalOpen) {
      window.addEventListener("keydown", handleEscKey);
    }

    return () => {
      window.removeEventListener("keydown", handleEscKey);
    };
  }, [isModalOpen]);

  return (
    <div className="app">
      <h1 className>CATegories</h1>
      <p className="subtitle">StumbleUpon, but for cats!</p>

      <button className="discover-btn" onClick={fetchCat} disabled={loading}>
        {loading ? "Discovering..." : "Discover Cat"}
      </button>

      {error && <p className="error">{error}</p>}

      <div className="main-layout">
        <div className="left-panel">
          <h2>Ban List</h2>
          <p className="small-text">Click a banned item to remove it.</p>

          <div className="ban-list">
            {banList.length === 0 ? (
              <p className="empty-message">No banned attributes yet.</p>
            ) : (
              banList.map((item, index) => (
                <button
                  key={`${item}-${index}`}
                  className="ban-item"
                  onClick={() => handleBanClick(item)}
                >
                  {item}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="center-panel">
          <h2>Current Cat</h2>

          {currentCat ? (
            <div className="cat-card">
              <img
                src={currentCat.image}
                alt={currentCat.breed}
                className="cat-image clickable-image"
                onClick={() => setIsModalOpen(true)}
              />

              <div className="attribute-row">
                <button
                  className="attribute"
                  onClick={() => handleBanClick(currentCat.breed)}
                >
                  Breed: {currentCat.breed}
                </button>

                <button
                  className="attribute"
                  onClick={() => handleBanClick(currentCat.origin)}
                >
                  Origin: {currentCat.origin}
                </button>

                <button
                  className="attribute"
                  onClick={() => handleBanClick(currentCat.lifeSpan)}
                >
                  Life Span: {currentCat.lifeSpan} years
                </button>
              </div>
            </div>
          ) : (
            <div className="cat-card empty-card">
              <p>Click "Discover Cat" to get started.</p>
            </div>
          )}
        </div>

        <div className="right-panel">
          <h2>History</h2>
          <p className="small-text">Previous cats from this session.</p>

          <div className="history-list">
            {history.length === 0 ? (
              <p className="empty-message">No history yet.</p>
            ) : (
              history.map((cat, index) => (
                <div key={`${cat.id}-${index}`} className="history-card">
                  <img
                    src={cat.image}
                    alt={cat.breed}
                    className="history-image clickable-history-image"
                    onClick={() => handleHistoryClick(cat)}
                  />
                  <p>
                    <strong>{cat.breed}</strong>
                  </p>
                  <p>{cat.origin}</p>
                  <p>{cat.lifeSpan} years</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {isModalOpen && currentCat && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setIsModalOpen(false)}
              aria-label="Close enlarged image"
            >
              ×
            </button>
            <img
              src={currentCat.image}
              alt={currentCat.breed}
              className="modal-image"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
