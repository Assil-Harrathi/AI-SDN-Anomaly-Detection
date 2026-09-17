import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import "./Anomaly.css";

// URL de base de l'API FastAPI. Ajuste-la selon ton environnement
// (ou définis VITE_API_BASE_URL si tu es sur Vite).
const API_BASE_URL = "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

const METRIC_FIELDS = [
  { key: "cpu_usage", label: "CPU", unit: "%", normalRange: [20, 65], anomalyRange: [88, 99] },
  { key: "ram_usage", label: "RAM", unit: "%", normalRange: [30, 70], anomalyRange: [90, 99] },
  { key: "disk_usage", label: "Disque", unit: "%", normalRange: [40, 75], anomalyRange: [92, 99] },
  { key: "network_in", label: "Réseau entrant", unit: "Mb/s", normalRange: [60, 160], anomalyRange: [400, 600] },
  { key: "network_out", label: "Réseau sortant", unit: "Mb/s", normalRange: [40, 120], anomalyRange: [300, 500] },
  { key: "disk_read", label: "Lecture disque", unit: "Mo/s", normalRange: [10, 45], anomalyRange: [120, 200] },
  { key: "disk_write", label: "Écriture disque", unit: "Mo/s", normalRange: [8, 40], anomalyRange: [110, 180] },
  { key: "temperature", label: "Température", unit: "°C", normalRange: [40, 62], anomalyRange: [85, 95] },
  { key: "process_count", label: "Processus", unit: "", normalRange: [90, 220], anomalyRange: [450, 600] },
];

function randomInRange([min, max]) {
  const value = Math.random() * (max - min) + min;
  return Math.round(value * 10) / 10;
}

// Simule ce que produirait la bibliothèque de génération de métriques,
// juste pour pouvoir déclencher une détection depuis l'interface.
function generateMetricsPayload() {
  const forceAnomaly = Math.random() < 0.35;
  const payload = {};
  METRIC_FIELDS.forEach((f) => {
    payload[f.key] = randomInRange(forceAnomaly ? f.anomalyRange : f.normalRange);
  });
  return payload;
}

function formatTimestamp(ts) {
  if (!ts) return null;
  const d = new Date(ts);
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function Anomaly() {
  // --- Santé du service (GET /health) ---
  const [health, setHealth] = useState(null);
  const [healthError, setHealthError] = useState(false);
  const healthPollRef = useRef(null);

  // --- Historique des rapports (GET /reports) ---
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState(null);

  // --- Sélection dans l'historique / résultat en direct ---
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewMode, setViewMode] = useState("history"); // "history" | "live"
  const [liveResult, setLiveResult] = useState(null);

  // --- Déclenchement d'une détection (POST /detect) ---
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState(null);

  const fetchHealth = useCallback(async () => {
    try {
      const { data } = await api.get("/health");
      setHealth(data);
      setHealthError(false);
    } catch (err) {
      setHealth(null);
      setHealthError(true);
    }
  }, []);

  const fetchReports = useCallback(async () => {
    setReportsLoading(true);
    setReportsError(null);
    try {
      const { data } = await api.get("/reports", { params: { limit: 50 } });
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      setReportsError(err.response?.data?.detail || err.message || "Impossible de charger l'historique.");
    } finally {
      setReportsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    fetchReports();
    healthPollRef.current = setInterval(fetchHealth, 15000);
    return () => clearInterval(healthPollRef.current);
  }, [fetchHealth, fetchReports]);

  const handleSelectReport = (index) => {
    setViewMode("history");
    setSelectedIndex(index);
  };

  const handleDetect = async () => {
    setDetecting(true);
    setDetectError(null);
    try {
      const payload = generateMetricsPayload();
      const { data } = await api.post("/detect", payload);
      setLiveResult(data);
      setViewMode("live");

      // Une détection nominale n'est jamais écrite dans le fichier de rapports :
      // on ne rafraîchit l'historique que si une anomalie vient d'être enregistrée.
      if (data.report_saved) {
        await fetchReports();
      }
    } catch (err) {
      setDetectError(err.response?.data?.detail || err.message || "La détection a échoué.");
    } finally {
      setDetecting(false);
    }
  };

  const selected = viewMode === "live" ? liveResult : reports[selectedIndex];
  const isAnomaly = selected?.detection?.anomaly === true;
  const hasSelection = Boolean(selected);

  return (
    <div className="console">
      <header className="console__topbar">
        <div className="console__brand">
          <span className="console__brand-mark">◈</span>
          <div>
            <h1 className="console__title">Console de supervision</h1>
            <p className="console__subtitle">Détection d'anomalies en temps réel</p>
          </div>
        </div>

        <div className={`console__health ${healthError ? "is-down" : health ? "is-up" : "is-pending"}`}>
          <span className="console__health-dot" />
          <div className="console__health-text">
            <strong>
              {healthError ? "Service injoignable" : health ? "Service opérationnel" : "Connexion…"}
            </strong>
            {health && (
              <span className="console__health-meta">
                {health.model} · agent {health.ai_agent}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="console__body console__body--history">
        <section className="console__panel console__panel--list">
          <div className="console__panel-header">
            <h2>Historique des relevés</h2>
            <span className="console__panel-hint">Depuis le fichier de rapports</span>
          </div>

          <div className="console__list-actions">
            <button
              type="button"
              className="console__submit console__submit--compact"
              onClick={handleDetect}
              disabled={detecting}
            >
              {detecting ? "Détection en cours…" : "Lancer une détection"}
            </button>
            <button
              type="button"
              className="console__ghost-button"
              onClick={fetchReports}
              disabled={reportsLoading}
            >
              Actualiser
            </button>
          </div>

          {detectError && <p className="console__error">{detectError}</p>}

          {reportsError && <p className="console__error">{reportsError}</p>}

          {reportsLoading && reports.length === 0 && (
            <p className="console__empty">Chargement de l'historique…</p>
          )}

          {!reportsLoading && !reportsError && reports.length === 0 && (
            <p className="console__empty">
              Aucune anomalie enregistrée pour l'instant. Les relevés nominaux ne sont pas
              conservés dans le fichier de rapports.
            </p>
          )}

          <ul className="console__history">
            {reports.map((report, index) => {
              const anomaly = report.detection?.anomaly === true;
              const isSelected = viewMode === "history" && index === selectedIndex;
              return (
                <li key={report.timestamp || index}>
                  <button
                    type="button"
                    className={`console__history-item ${isSelected ? "is-selected" : ""} ${
                      anomaly ? "is-anomaly" : "is-nominal"
                    }`}
                    onClick={() => handleSelectReport(index)}
                  >
                    <span className="console__history-dot" />
                    <div className="console__history-text">
                      <span className="console__history-time">
                        {formatTimestamp(report.timestamp) || "—"}
                      </span>
                      <span className="console__history-status">
                        {anomaly ? "Anomalie" : "Nominal"}
                        {typeof report.detection?.score === "number" &&
                          ` · score ${report.detection.score.toFixed(3)}`}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section
          className={`console__panel console__panel--result ${
            isAnomaly ? "is-anomaly" : hasSelection ? "is-nominal" : ""
          }`}
        >
          <div className="console__panel-header">
            <h2>{viewMode === "live" ? "Résultat de la détection" : "Détail du relevé"}</h2>
            {hasSelection && (
              <span className="console__status-chip">
                {isAnomaly ? "Anomalie détectée" : "Fonctionnement nominal"}
              </span>
            )}
          </div>

          {!hasSelection && (
            <p className="console__empty">
              Sélectionne un relevé dans l'historique ou lance une détection pour voir le
              résultat ici.
            </p>
          )}

          {hasSelection && (
            <>
              {selected.timestamp && (
                <p className="console__timestamp">{formatTimestamp(selected.timestamp)}</p>
              )}

              <div className="console__readout-grid console__readout-grid--compact">
                {METRIC_FIELDS.map((field) => (
                  <div key={field.key} className="console__readout-cell">
                    <span className="console__readout-cell-label">{field.label}</span>
                    <span className="console__readout-cell-value">
                      {selected.metrics?.[field.key]}
                      {field.unit && (
                        <span className="console__readout-cell-unit"> {field.unit}</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>

              <div className="console__result-body">
                <div className="console__readout">
                  <div className="console__readout-row">
                    <span className="console__readout-key">prediction</span>
                    <span className="console__readout-value">
                      {selected.detection?.prediction}
                    </span>
                  </div>
                  <div className="console__readout-row">
                    <span className="console__readout-key">score</span>
                    <span className="console__readout-value">
                      {typeof selected.detection?.score === "number"
                        ? selected.detection.score.toFixed(4)
                        : "—"}
                    </span>
                  </div>
                </div>

                {selected.ai_analysis && (
                  <div className="console__report">
                    <h3>Analyse de l'agent</h3>
                    <p>{selected.ai_analysis}</p>
                  </div>
                )}

                {!selected.ai_analysis && viewMode === "live" && !isAnomaly && (
                  <p className="console__report-note">
                    Fonctionnement nominal : aucune analyse déclenchée, aucun rapport enregistré.
                  </p>
                )}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}