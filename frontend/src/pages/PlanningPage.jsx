import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../api/axiosInstance";
import GisLayout from "../components/GisLayout";
import {
  Search,
  Plus,
  FileText,
  Database,
  Settings,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Edit,
  Trash2,
  X,
  MapPin,
} from "lucide-react";

export default function PlanningPage() {
  const [equipements, setEquipements] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState(null);
  const [editingEq, setEditingEq] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  useEffect(() => {
    fetchEquipements();
  }, []);
  const fetchEquipements = async () => {
    try {
      const response = await api.get("/equipements");
      setEquipements(response.data);
    } catch (error) {
      console.error("Erreur", error);
    }
  };
  const openEdit = (eq) => {
    setEditingEq(eq);
    setEditForm({ name: eq.name, type: eq.type, status: eq.status, node_id: eq.node_id });
  };
  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/equipements/${editingEq.id}`, editForm);
      setEquipements(prev => prev.map(e => e.id === editingEq.id ? { ...e, ...editForm } : e));
      setEditingEq(null);
      setStatus({ type: "success", message: `${editForm.node_id} mis à jour avec succès.` });
      setTimeout(() => setStatus(null), 4000);
    } catch (err) {
      setStatus({ type: "error", message: err.response?.data?.message || "Erreur de mise à jour." });
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async (eq) => {
    if (!window.confirm(`Supprimer ${eq.node_id} (${eq.name}) ?`)) return;
    try {
      await api.delete(`/equipements/${eq.id}`);
      setEquipements(prev => prev.filter(e => e.id !== eq.id));
      setStatus({ type: "success", message: `${eq.node_id} supprimé.` });
      setTimeout(() => setStatus(null), 4000);
    } catch (err) {
      setStatus({ type: "error", message: "Erreur lors de la suppression." });
    }
  };
  const viewOnMap = (eq) => {
    sessionStorage.setItem("focusEquipement", JSON.stringify(eq));
    navigate("/technicien");
  };
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith(".kmz") && !file.name.endsWith(".kml")) {
      setStatus({
        type: "error",
        message: "Veuillez sélectionner un fichier .KMZ ou .KML uniquement.",
      });
      return;
    }
    setUploading(true);
    setStatus(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await api.post("/import-kmz", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setStatus({ type: "success", message: response.data.message });
      fetchEquipements();
    } catch (err) {
      setStatus({
        type: "error",
        message: err.response?.data?.error || "Erreur lors de l'importation.",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTimeout(() => setStatus(null), 5000);
    }
  };
  const exportToPDF = () => {
    try {
      const doc = new jsPDF("p", "mm", "a4");
      doc.setFontSize(18);
      doc.setTextColor(51, 51, 51);
      doc.text("TELINTEC KHENIFRA - RAPPORT D'INVENTAIRE NMS", 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Généré le: ${new Date().toLocaleString()}`, 14, 28);
      const tableColumn = ["NODE ID", "Type", "Capacité", "Status"];
      const tableRows = filteredEquipements.map((eq) => [
        eq.node_id,
        eq.type.replace("_", " "),
        `${eq.occupied_ports || 0}/${eq.total_ports || 0}`,
        eq.status.toUpperCase(),
      ]);
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        theme: "grid",
        headStyles: { fillColor: [51, 51, 51] },
        styles: { fontSize: 7 },
      });
      doc.save(`NMS_Inventory_Khenifra_${new Date().getTime()}.pdf`);
    } catch (err) {
      console.error(err);
    }
  };
  const exportToExcel = () => {
    const headers = [
      "NODE ID",
      "Nom",
      "Type",
      "Capacité",
      "Occupés",
      "Status",
      "Date Installation",
    ];
    const rows = filteredEquipements.map((eq) => [
      eq.node_id,
      eq.name,
      eq.type,
      eq.total_ports || 0,
      eq.occupied_ports || 0,
      eq.status,
      eq.metadata?.installation_date || "",
    ]);
    let csvContent =
      "data:text/csv;charset=utf-8," +
      headers.join(",") +
      "\n" +
      rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `NMS_Export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const filteredEquipements = equipements.filter((eq) => {
    const matchesSearch =
      (eq.node_id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (eq.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (eq.type || "").toLowerCase().includes(searchTerm.toLowerCase());
    let matchesStatFilter = true;
    if (filterType === "FIBER") matchesStatFilter = eq.type.includes("FIBER") || eq.type.includes("FTTH");
    if (filterType === "COPPER")
      matchesStatFilter =
        eq.type.includes("COPPER") || eq.type.includes("ADSL");
    if (filterType === "MAINTENANCE")
      matchesStatFilter = eq.status === "maintenance";
    return matchesSearch && matchesStatFilter;
  });
  const portStats = {
    NRO: { total: 0, actifs: 0 },
    SR: { total: 0, actifs: 0 },
    SPLITTER: { total: 0, actifs: 0 },
    'PCO FTTH': { total: 0, actifs: 0 },
    'PCO ADSL': { total: 0, actifs: 0 },
  };

  equipements.forEach(eq => {
    let cat = null;
    if (eq.type.includes('NRO')) cat = 'NRO';
    else if (eq.type.includes('SR')) cat = 'SR';
    else if (eq.type.includes('SPLITTER')) cat = 'SPLITTER';
    else if (eq.type.includes('FTTH')) cat = 'PCO FTTH';
    else if (eq.type.includes('ADSL')) cat = 'PCO ADSL';
    
    if (cat) {
      portStats[cat].total += (eq.total_ports || 0);
      portStats[cat].actifs += (eq.occupied_ports || 0);
    }
  });

  return (
    <GisLayout>
      <div className="tech-container">
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            background: "#ffffff",
            padding: "30px",
          }}
        >
          <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                marginBottom: "25px",
                flexWrap: "wrap",
                gap: "15px",
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: "22px",
                    fontWeight: 900,
                    color: "#333",
                    textTransform: "uppercase",
                    marginBottom: "5px",
                  }}
                >
                  Inventaire Réseau NMS
                </h2>
                <div style={{ fontSize: "13px", color: "#777" }}>
                  Gestion hiérarchique de l'infrastructure Khénifra
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={exportToPDF}
                  style={{
                    padding: "10px 20px",
                    background: "#333",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                  }}
                >
                  <FileText size={16} /> PDF
                </button>
                <button
                  onClick={exportToExcel}
                  style={{
                    padding: "10px 20px",
                    background: "#1D6F42",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                  }}
                >
                  <Database size={16} /> EXCEL (CSV)
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleFileSelect}
                  accept=".kmz,.kml"
                />
                <button
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  disabled={uploading}
                  style={{
                    padding: "10px 20px",
                    background: "#f0f7ff",
                    color: "#0052CC",
                    border: "1px solid #cce0ff",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                  }}
                >
                  {uploading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Upload size={16} />
                  )}
                  {uploading ? "IMPORTATION..." : "IMPORTER KMZ"}
                </button>

              </div>
            </div>
            {status && (
              <div
                style={{
                  marginBottom: "20px",
                  padding: "12px 20px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  background: status.type === "success" ? "#e3fcef" : "#ffebe6",
                  color: status.type === "success" ? "#006644" : "#bf2600",
                  border: `1px solid ${status.type === "success" ? "#abf5d1" : "#ffbdad"}`,
                  fontSize: "13px",
                  fontWeight: 600,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                }}
              >
                {status.type === "success" ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <AlertCircle size={18} />
                )}
                <span>{status.message}</span>
              </div>
            )}
            {}
            <div
              className="dashboard-grid"
              style={{ padding: 0, marginBottom: "30px" }}
            >
              <div
                className={`stat-card clickable ${filterType === "ALL" ? "active" : ""}`}
                onClick={() => setFilterType("ALL")}
              >
                <div className="stat-card-label">Total Infrastructures</div>
                <div className="stat-card-value">{equipements.length}</div>
                <div
                  style={{ fontSize: "10px", marginTop: "5px", opacity: 0.6 }}
                >
                  Voir tout
                </div>
              </div>
              <div
                className={`stat-card clickable ${filterType === "FIBER" ? "active" : ""}`}
                style={{ borderLeftColor: "#00BFFF" }}
                onClick={() => setFilterType("FIBER")}
              >
                <div className="stat-card-label">FTTH (Fibre)</div>
                <div className="stat-card-value">
                  {equipements.filter((e) => e.type.includes("FIBER") || e.type.includes("FTTH") || e.type.includes("NRO") || e.type.includes("SPLITTER")).length}
                </div>
                <div
                  style={{ fontSize: "10px", marginTop: "5px", opacity: 0.6 }}
                >
                  Filtrer par Fibre
                </div>
              </div>
              <div
                className={`stat-card clickable ${filterType === "COPPER" ? "active" : ""}`}
                style={{ borderLeftColor: "#8B4513" }}
                onClick={() => setFilterType("COPPER")}
              >
                <div className="stat-card-label">ADSL (Cuivre)</div>
                <div className="stat-card-value">
                  {
                    equipements.filter(
                      (e) =>
                        e.type.includes("COPPER") || e.type.includes("ADSL") || e.type.includes("SR"),
                    ).length
                  }
                </div>
                <div
                  style={{ fontSize: "10px", marginTop: "5px", opacity: 0.6 }}
                >
                  Filtrer par Cuivre
                </div>
              </div>
              <div
                className={`stat-card clickable red ${filterType === "MAINTENANCE" ? "active" : ""}`}
                onClick={() => setFilterType("MAINTENANCE")}
              >
                <div className="stat-card-label">Alertes Maintenance</div>
                <div className="stat-card-value">
                  {equipements.filter((e) => e.status === "maintenance").length}
                </div>
                <div
                  style={{ fontSize: "10px", marginTop: "5px", opacity: 0.6 }}
                >
                  Voir les alertes
                </div>
              </div>
            </div>
            <div style={{ marginBottom: "25px", background: "#fff", padding: "15px 20px", borderRadius: "10px", boxShadow: "0 4px 15px rgba(0,0,0,0.03)", border: "1px solid #eaeaea" }}>
              <div style={{ fontSize: "14px", fontWeight: "800", color: "#333", marginBottom: "15px", textTransform: "uppercase" }}>Occupation des Ports</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "15px" }}>
                {Object.entries(portStats).map(([key, data]) => {
                  if (data.total === 0) return null;
                  const percent = Math.round((data.actifs / data.total) * 100) || 0;
                  return (
                    <div key={key} style={{ flex: "1 1 150px", background: "#f8f9fa", padding: "12px", borderRadius: "8px", border: "1px solid #f0f0f0" }}>
                      <div style={{ fontSize: "11px", fontWeight: "800", color: "#666", marginBottom: "8px" }}>PORTS {key}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                        <div>
                          <span style={{ fontSize: "18px", fontWeight: "900", color: "#333" }}>{data.actifs}</span>
                          <span style={{ fontSize: "12px", color: "#999", fontWeight: "600" }}> / {data.total}</span>
                        </div>
                        <div style={{ fontSize: "12px", fontWeight: "800", color: percent > 80 ? "#FF5630" : "#36B37E" }}>
                          {percent}%
                        </div>
                      </div>
                      <div style={{ width: "100%", height: "4px", background: "#e0e0e0", borderRadius: "2px", marginTop: "8px", overflow: "hidden" }}>
                        <div style={{ width: `${percent}%`, height: "100%", background: percent > 80 ? "#FF5630" : "#36B37E", borderRadius: "2px" }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="tech-table-container">
              <div
                style={{
                  padding: "15px 20px",
                  background: "#fff",
                  borderBottom: "1px solid #ddd",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div className="nms-search-bar">
                  <Search size={18} color="#0052CC" />
                  <input
                    type="text"
                    placeholder="Rechercher par NODE ID, Type, Nom..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div
                  style={{ fontSize: "12px", color: "#777", fontWeight: 600 }}
                >
                  {filterType !== "ALL" && (
                    <span
                      onClick={() => setFilterType("ALL")}
                      style={{
                        color: "#0052CC",
                        cursor: "pointer",
                        marginRight: "10px",
                      }}
                    >
                      ❌ Annuler filtre
                    </span>
                  )}
                  Affichage de {filteredEquipements.length} nœuds
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="tech-table">
                  <thead>
                    <tr>
                      <th>NODE ID</th>
                      <th>Désignation</th>
                      <th>Type Réseau</th>
                      <th>Capacité / Occupation</th>
                      <th>Statut</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEquipements.slice(0, 100).map((eq) => (
                      <tr key={eq.id}>
                        <td
                          style={{
                            fontWeight: 900,
                            color: "#0052CC",
                            fontSize: "12px",
                          }}
                        >
                          {eq.node_id}
                        </td>
                        <td style={{ fontWeight: 500 }}>{eq.name}</td>
                        <td>
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 900,
                              color: eq.type.includes("FIBER")
                                ? "#00BFFF"
                                : "#8B4513",
                              background: eq.type.includes("FIBER")
                                ? "#f0fbff"
                                : "#fff5eb",
                              padding: "4px 8px",
                              borderRadius: "4px",
                            }}
                          >
                            {eq.type.replace("_", " ")}
                          </span>
                        </td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <div
                              style={{
                                flex: 1,
                                height: "4px",
                                background: "#eee",
                                borderRadius: "2px",
                                minWidth: "40px",
                              }}
                            >
                              <div
                                style={{
                                  width: `${((eq.occupied_ports || 0) / (eq.total_ports || 1)) * 100}%`,
                                  height: "100%",
                                  background:
                                    (eq.occupied_ports || 0) >= (eq.total_ports || 1) && (eq.total_ports > 0)
                                      ? "#ff0000"
                                      : "#36B37E",
                                  borderRadius: "2px",
                                }}
                              ></div>
                            </div>
                            <span style={{ fontSize: "11px", fontWeight: 700 }}>
                              {eq.occupied_ports || 0}/
                              {eq.total_ports || 0}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className={`status-chip status-${eq.status}`}>
                            {eq.status}
                          </span>
                        </td>
                        <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                          <button
                            className="action-icon-btn"
                            title="Voir sur la carte"
                            onClick={() => viewOnMap(eq)}
                          >
                            <MapPin size={16} />
                          </button>
                          <button
                            className="action-icon-btn"
                            title="Modifier"
                            onClick={() => openEdit(eq)}
                          >
                            <Edit size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
        <style
          dangerouslySetInnerHTML={{
            __html: `
        .stat-card.clickable {
          cursor: pointer;
          transition: all 0.2s;
        }
        .stat-card.clickable:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.1);
        }
        .stat-card.clickable.active {
          border-width: 2px;
          background: #f8fbff;
          box-shadow: inset 0 0 0 2px var(--primary-glow);
        }
        .nms-search-bar {
          display: flex;
          align-items: center;
          background: #ffffff;
          border: 1px solid #ddd;
          border-radius: 10px;
          padding: 0 15px;
          width: 100%;
          max-width: 500px;
          transition: all 0.2s;
        }
        .nms-search-bar:focus-within {
          background: white;
          border-color: #0052CC;
          box-shadow: 0 4px 12px rgba(0, 82, 204, 0.1);
        }
        .nms-search-bar input {
          border: none;
          outline: none;
          background: transparent;
          padding: 12px;
          width: 100%;
          font-size: 14px;
          font-weight: 500;
        }
        .action-icon-btn {
          background: transparent;
          border: none;
          color: #999;
          cursor: pointer;
          padding: 8px;
          border-radius: 50%;
          transition: all 0.2s;
        }
        .action-icon-btn:hover {
          background: #f0f0f0;
          color: #0052CC;
        }
        @media (max-width: 768px) {
          .dashboard-grid {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
          .stat-card {
            padding: 15px !important;
          }
          .stat-card-value {
            font-size: 24px !important;
          }
          .nms-search-bar {
            max-width: 100% !important;
          }
        }
      `,
          }}
        />
      </div>
        {editingEq && (
          <div
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
              zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onClick={(e) => { if (e.target === e.currentTarget) setEditingEq(null); }}
          >
            <div style={{
              background: '#fff', borderRadius: 12, width: 420, padding: '28px 32px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#999', textTransform: 'uppercase' }}>Modifier</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#333' }}>{editingEq.node_id}</div>
                </div>
                <button onClick={() => setEditingEq(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={22} color="#999" />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#555', display: 'block', marginBottom: 4 }}>NODE ID</label>
                  <input
                    value={editForm.node_id}
                    onChange={e => setEditForm({ ...editForm, node_id: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#555', display: 'block', marginBottom: 4 }}>NOM</label>
                  <input
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#555', display: 'block', marginBottom: 4 }}>TYPE</label>
                  <select
                    value={editForm.type}
                    onChange={e => setEditForm({ ...editForm, type: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
                  >
                    {['NRO','SR','Splitter','PCO FTTH','PCO ADSL','CLIENT'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#555', display: 'block', marginBottom: 4 }}>STATUT</label>
                  <select
                    value={editForm.status}
                    onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
                  >
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="hors-service">Hors Service</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    flex: 1, padding: '11px', background: '#0052CC', color: 'white',
                    border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer',
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
                <button
                  onClick={() => setEditingEq(null)}
                  style={{
                    padding: '11px 20px', background: '#f4f5f7', color: '#555',
                    border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
    </GisLayout>
  );
}