import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import MapView from "../components/MapView";
import GisLayout from "../components/GisLayout";
import {
  Search,
  Map as MapIcon,
  ChevronRight,
  ChevronDown,
  X,
  PlusCircle,
  Plus,
  Edit,
  Trash2,
  Navigation,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X as XIcon,
  MapPin,
  Database,
  Menu,
} from "lucide-react";
function EquipementPopup({
  equipement,
  onClose,
  onUpdate,
  allEquipements,
  zones,
  isInitiallyEditing = false,
  isLoading = false,
}) {
  if (!equipement) return null;
  const [isEditing, setIsEditing] = useState(isInitiallyEditing);
  useEffect(() => {
    setIsEditing(isInitiallyEditing);
  }, [isInitiallyEditing, equipement]);
  const [error, setError] = useState(null);
  const [editData, setEditData] = useState({
    name: equipement.name,
    type: equipement.type,
    node_id: equipement.node_id,
    latitude: equipement.latitude,
    longitude: equipement.longitude,
    status: equipement.status,
    parent_id: equipement.parent_id,
    zone_id: equipement.zone_id,
    metadata: equipement.metadata || {},
  });
  const [managingPort, setManagingPort] = useState(null);
  const [abonneForm, setAbonneForm] = useState({ abonne_name: '', abonne_id: '', service_type: 'FTTH' });
  const parent = allEquipements?.find((e) => e.id === equipement.parent_id);
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };
  const distanceToParent = parent
    ? calculateDistance(
        equipement.latitude,
        equipement.longitude,
        parent.latitude,
        parent.longitude,
      )
    : null;
  const portsLibres = equipement.ports 
    ? equipement.ports.filter((p) => p.status === "libre").length 
    : (equipement.total_ports - equipement.occupied_ports || 0);
  const portsPleins = equipement.ports 
    ? equipement.ports.filter((p) => p.status === "plein").length 
    : (equipement.occupied_ports || 0);
  const totalPorts = equipement.ports 
    ? equipement.ports.length 
    : (equipement.total_ports || 0);
  const occupationRate =
    totalPorts > 0 ? Math.round((portsPleins / totalPorts) * 100) : 0;
  const handleUpdate = async () => {
    try {
      setError(null);
      const res = await api.put(`/equipements/${equipement.id}`, editData);
      onUpdate(res.data);
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur de mise à jour");
      console.error(err);
    }
  };
  const handleDelete = async () => {
    if (
      !window.confirm(
        `Voulez-vous vraiment supprimer cet équipement (${equipement.node_id}) ?`,
      )
    )
      return;
    try {
      await api.delete(`/equipements/${equipement.id}`);
      onClose();
      onUpdate();
    } catch (err) {
      console.error(err);
    }
  };
  const handleAddPort = async () => {
    try {
      const nextNumber = (equipement.ports?.length || 0) + 1;
      await api.post("/ports", {
        equipement_id: equipement.id,
        number: nextNumber,
        status: "libre",
      });
      onUpdate();
    } catch (err) {
      console.error(err);
    }
  };
  const handleDeletePort = async (portId) => {
    if (!window.confirm("Voulez-vous supprimer ce port ?")) return;
    try {
      await api.delete(`/ports/${portId}`);
      onUpdate();
    } catch (err) {
      console.error(err);
    }
  };
  const handlePortAction = (port) => {
    setManagingPort(port);
    setAbonneForm({
      abonne_name: port.abonne_name || '',
      abonne_id: port.abonne_id || '',
      service_type: port.service_type || 'FTTH'
    });
  };
  const handleSaveAbonne = async () => {
    if (!managingPort) return;
    try {
      const signalValue = abonneForm.abonne_name;
      const isRemoving = !signalValue;
      const updatedPort = {
        ...managingPort,
        abonne_name: isRemoving ? null : signalValue,
        abonne_id: isRemoving ? null : ('PORT-' + managingPort.id + '-' + Date.now()),
        status: isRemoving ? 'libre' : 'plein'
      };
      await api.put(`/ports/${managingPort.id}`, updatedPort);
      const updatedEq = {
        ...equipement,
        ports: equipement.ports.map(p => p.id === managingPort.id ? updatedPort : p)
      };
      onUpdate(updatedEq);
      setManagingPort(null);
    } catch (error) {
      console.error("Erreur save abonne", error);
    }
  };
  const handleCreatePort = async () => {
    try {
      const newPort = {
        equipement_id: equipement.id,
        number: equipement.ports ? equipement.ports.length + 1 : 1,
        status: 'libre',
        service_type: equipement.type && equipement.type.includes('ADSL') ? 'ADSL' : 'FTTH'
      };
      const res = await api.post('/ports', newPort);
      const updatedEq = {
        ...equipement,
        ports: [...(equipement.ports || []), res.data]
      };
      onUpdate(updatedEq);
    } catch (err) {
      console.error("Erreur création port", err);
    }
  };
  const typeColors = {
    NRO: {
      bg: "#ffffff",
      text: "#0052cc",
      border: "#e0e0e0",
    },
    SR: {
      bg: "#ffffff",
      text: "#0052cc",
      border: "#e0e0e0",
    },
    Splitter: {
      bg: "#ffffff",
      text: "#0052cc",
      border: "#e0e0e0",
    },
    PCO: {
      bg: "#ffffff",
      text: "#0052cc",
      border: "#e0e0e0",
    },
    'PCO FTTH': {
      bg: "#ffffff",
      text: "#0052cc",
      border: "#e0e0e0",
    },
    'PCO ADSL': {
      bg: "#ffffff",
      text: "#0052cc",
      border: "#e0e0e0",
    },
    CLIENT: {
      bg: "#ffffff",
      text: "#0052cc",
      border: "#e0e0e0",
    },
    default: {
      bg: "#ffffff",
      text: "#333333",
      border: "#e0e0e0",
    },
  };
  const scheme = typeColors[equipement.type] || typeColors.default;
  return (
    <div
      className="pco-popup white-theme"
      style={{
        position: "absolute",
        top: "20px",
        right: "20px",
        zIndex: 4000,
        borderRadius: "12px",
        width: "320px",
        maxWidth: "calc(100vw - 40px)",
        boxShadow: "0 25px 80px rgba(0,0,0,0.15)",
        border: "1px solid #e0e0e0",
        background: "#fff"
      }}
    >
      <div
        className="pco-popup-header white-theme"
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0',
          padding: '12px 16px'
        }}
      >
        <div>
          <div style={{ fontSize: "9px", fontWeight: "900", color: "#888", textTransform: "uppercase", letterSpacing: '1px', marginBottom: '2px' }}>
            INFRASTRUCTURE TÉLÉCOM
          </div>
          <div className="pco-popup-title white-theme" style={{ fontSize: "16px", color: "#0052cc", fontWeight: '900' }}>
            {equipement.node_id}
          </div>
        </div>
        <div style={{ display: "flex", gap: "16px", alignItems: 'center' }}>
          <button
            className="pco-close-btn"
            onClick={onClose}
            style={{ background: "#f5f5f5", border: "none", color: '#666', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <XIcon size={20} />
          </button>
        </div>
      </div>
      <div className="pco-popup-body" style={{ padding: "16px", maxHeight: '400px', overflowY: 'auto' }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '15px' }}>
            <Loader2 className="animate-spin" size={32} color="#0052cc" />
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#888' }}>CHARGEMENT DES PORTS...</div>
          </div>
        ) : isEditing ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
              marginBottom: "20px",
            }}
          >
            <div className="form-group">
              <label style={{ fontSize: "10px", fontWeight: "bold" }}>
                NODE ID
              </label>
              <input
                value={editData.node_id}
                onChange={(e) =>
                  setEditData({ ...editData, node_id: e.target.value })
                }
                style={{ width: "100%", padding: "6px", fontSize: "12px" }}
              />
            </div>
            <div className="form-group">
              <label style={{ fontSize: "10px", fontWeight: "bold" }}>
                TYPE
              </label>
              <select
                value={editData.type}
                onChange={(e) =>
                  setEditData({ ...editData, type: e.target.value })
                }
                style={{ width: "100%", padding: "6px", fontSize: "12px" }}
              >
                {Object.keys(typeColors)
                  .filter((t) => t !== "default")
                  .map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
              </select>
            </div>
            <div className="form-group">
              <label style={{ fontSize: "10px", fontWeight: "bold" }}>
                STATUT
              </label>
              <select
                value={editData.status}
                onChange={(e) =>
                  setEditData({ ...editData, status: e.target.value })
                }
                style={{ width: "100%", padding: "6px", fontSize: "12px" }}
              >
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="hors-service">Hors Service</option>
              </select>
            </div>
            <div className="form-group">
              <label style={{ fontSize: "10px", fontWeight: "bold" }}>
                PARENT
              </label>
              <select
                value={editData.parent_id || ""}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    parent_id: e.target.value || null,
                  })
                }
                style={{ width: "100%", padding: "6px", fontSize: "12px" }}
              >
                <option value="">Aucun</option>
                {allEquipements
                  .filter((e) => e.id !== equipement.id)
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.node_id} - {e.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="form-group">
              <label style={{ fontSize: "10px", fontWeight: "bold" }}>
                LATITUDE
              </label>
              <input
                type="number"
                step="0.000001"
                value={editData.latitude}
                onChange={(e) =>
                  setEditData({ ...editData, latitude: e.target.value })
                }
                style={{ width: "100%", padding: "6px", fontSize: "12px" }}
              />
            </div>
            <div className="form-group">
              <label style={{ fontSize: "10px", fontWeight: "bold" }}>
                LONGITUDE
              </label>
              <input
                type="number"
                step="0.000001"
                value={editData.longitude}
                onChange={(e) =>
                  setEditData({ ...editData, longitude: e.target.value })
                }
                style={{ width: "100%", padding: "6px", fontSize: "12px" }}
              />
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div
                style={{
                  padding: "8px",
                  background: "#FFEBE6",
                  color: "#BF2600",
                  fontSize: "11px",
                  borderRadius: "4px",
                  marginBottom: "15px",
                  fontWeight: "bold",
                }}
              >
                {error}
              </div>
            )}
            <div
              style={{
                display: "flex",
                gap: "6px",
                marginBottom: "10px",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  padding: "2px 8px",
                  background: scheme.bg,
                  color: scheme.text,
                  fontSize: "11px",
                  fontWeight: "800",
                  borderRadius: "20px",
                  border: `1px solid ${scheme.border}`,
                }}
              >
                {equipement.type}
              </div>
              <div
                style={{
                  padding: "2px 8px",
                  background:
                    equipement.status === "active" ? "#E3FCEF" : "#FFEBE6",
                  color: equipement.status === "active" ? "#006644" : "#BF2600",
                  fontSize: "11px",
                  fontWeight: "800",
                  borderRadius: "20px",
                }}
              >
                {equipement.status.toUpperCase()}
              </div>
              <div
                style={{
                  padding: "2px 8px",
                  background: "#f4f5f7",
                  color: "#333",
                  fontSize: "11px",
                  fontWeight: "800",
                  borderRadius: "20px",
                  border: "1px solid #dfe1e6"
                }}
              >
                Capacité: {equipement.ports?.filter(p => p.status === 'plein').length || 0} / {equipement.ports?.length || 0}
              </div>

              {parent && (
                <div
                  style={{
                    width: "100%",
                    marginTop: "5px",
                    fontSize: "11px",
                    color: "#666",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "#f0f7ff",
                    padding: "6px 10px",
                    borderRadius: "6px",
                    border: "1px solid #cce0ff",
                  }}
                >
                  <Database size={14} color="#0052CC" />
                  <div style={{ flex: 1 }}>
                    <div>
                      Parent:{" "}
                      <span style={{ fontWeight: "bold", color: "#0052CC" }}>
                        {parent.node_id}
                      </span>
                    </div>
                    <div style={{ fontSize: "10px", opacity: 0.8 }}>
                      Distance:{" "}
                      <span style={{ fontWeight: "bold" }}>
                        {distanceToParent}m
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {totalPorts > 0 ? (
              <div style={{ maxHeight: "200px", overflowY: "auto", marginBottom: "10px" }}>
                <table className="ports-table">
                  <thead>
                    <tr>
                      <th>Port n°</th>
                      <th>Statut</th>
                      <th>Signal (dB)</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(equipement.ports || []).sort((a,b) => a.number - b.number).map((port) => {
                      const isPlein = port.status === "plein";
                      return (
                        <tr key={port.id}>
                          <td style={{ fontWeight: '800', color: '#0052cc' }}>{port.number}</td>
                          <td>
                            <span className={`badge ${isPlein ? 'badge-active' : 'badge-empty'}`}>
                              {isPlein ? 'Actif' : 'Libre'}
                            </span>
                          </td>
                          <td style={{ fontFamily: 'monospace', color: '#666' }}>
                            {isPlein ? (port.abonne_name && !isNaN(parseFloat(port.abonne_name)) ? parseFloat(port.abonne_name) : (equipement.type && equipement.type.includes('ADSL') ? '21' : '42')) : '0'} dB
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {isPlein ? (
                              <button 
                                className="btn-terminate"
                                onClick={async () => {
                                  try {
                                    const freePort = {
                                      ...port,
                                      abonne_name: '',
                                      abonne_id: '',
                                      status: 'libre'
                                    };
                                    await api.put(`/ports/${port.id}`, {
                                      abonne_name: '',
                                      abonne_id: '',
                                      status: 'libre'
                                    });
                                    const updatedEq = {
                                      ...equipement,
                                      ports: equipement.ports.map(p => p.id === port.id ? freePort : p)
                                    };
                                    onUpdate(updatedEq);
                                  } catch (err) {
                                    console.error("Erreur résiliation", err);
                                  }
                                }}
                              >
                                Résilier
                              </button>
                            ) : (
                              <button 
                                className="btn-add"
                                onClick={() => handlePortAction(port)}
                              >
                                Ajouter
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#999', fontSize: '12px' }}>
                Aucun port configuré.
              </div>
            )}
            
            {!equipement.type.includes("PCO") && (
              <button 
                onClick={handleCreatePort} 
                style={{ marginTop: '5px', width: '100%', padding: '8px', background: '#f8f9fa', color: '#0052cc', border: '1px dashed #cce0ff', borderRadius: '4px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' }}
              >
                + CRÉER UN PORT
              </button>
            )}


            {managingPort && (
              <div style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', width: '320px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                  <div style={{ fontSize: '14px', fontWeight: '900', marginBottom: '15px' }}>Gérer Port {managingPort.number}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '10px', fontWeight: '800', color: '#666' }}>VALEUR DU SIGNAL (dB)</label>
                      <input 
                        value={abonneForm.abonne_name} 
                        onChange={e => setAbonneForm({...abonneForm, abonne_name: e.target.value})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '12px' }}
                        placeholder="Ex: 22"
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button onClick={handleSaveAbonne} style={{ flex: 1, padding: '10px', background: '#0052CC', color: 'white', border: 'none', borderRadius: '6px' }}>Enregistrer</button>
                    <button onClick={() => setManagingPort(null)} style={{ padding: '10px', background: '#eee', border: 'none', borderRadius: '6px' }}>Annuler</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
export default function TechnicienPage() {
  const [equipements, setEquipements] = useState([]);
  const [zones, setZones] = useState([]);
  const [selectedEq, setSelectedEq] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [externalSearchResults, setExternalSearchResults] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState(null);
  const [newNodeCoords, setNewNodeCoords] = useState(null);
  const [forceEdit, setForceEdit] = useState(false);
  const [loadingEq, setLoadingEq] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    fetchData().then(() => {
      const focused = sessionStorage.getItem("focusEquipement");
      if (focused) {
        try {
          const eq = JSON.parse(focused);
          setSelectedEq(eq);
          sessionStorage.removeItem("focusEquipement");
        } catch {}
      }
    });
  }, []);

  useEffect(() => {
    if (!searchTerm || searchTerm.length < 3) {
      setExternalSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTerm)}+khenifra&limit=15&countrycodes=ma`);
        const data = await res.json();
        setExternalSearchResults(
          data.slice(0, 15).map(item => ({
            id: item.place_id,
            name: item.display_name.split(',')[0],
            fullName: item.display_name,
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
            isExternal: true
          }))
        );
      } catch (err) {
        console.error("Nominatim search error", err);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  const fetchData = async () => {
    try {
      const [eqRes, zoneRes] = await Promise.allSettled([
        api.get("/equipements"),
        api.get("/zones"),
      ]);
      if (eqRes.status === "fulfilled") {
        console.log("Equipements loaded:", eqRes.value.data.length);
        setEquipements(eqRes.value.data);
      }
      if (zoneRes.status === "fulfilled") setZones(zoneRes.value.data);
    } catch (error) {
      console.error("Erreur", error);
    }
  };
  const handleEquipementClick = async (eq) => {
    setSelectedEq(eq);
    setForceEdit(false);
    
    // Si les ports ne sont pas chargés, on les récupère
    if (!eq.ports) {
      setLoadingEq(true);
      try {
        const res = await api.get(`/equipements/${eq.id}`);
        // Mettre à jour l'équipement dans la liste principale pour garder le cache
        setEquipements(prev => prev.map(item => item.id === eq.id ? res.data : item));
        setSelectedEq(res.data);
      } catch (err) {
        console.error("Erreur chargement détails", err);
      } finally {
        setLoadingEq(false);
      }
    }
  };

  const handleMapClick = (latlng) => {
    setNewNodeCoords(latlng);
    setSelectedEq(null);
  };
  const handleDeleteNode = async (node) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer ${node.node_id} ?`)) return;
    try {
      await api.delete(`/equipements/${node.id}`);
      fetchData();
      if (selectedEq?.id === node.id) setSelectedEq(null);
      setStatus({ type: "success", message: "Supprimé avec succès." });
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", message: "Erreur lors de la suppression." });
    }
  };
  const handleAddNode = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      node_id: formData.get("node_id"),
      name: formData.get("name"),
      type: formData.get("type"),
      latitude: newNodeCoords.lat,
      longitude: newNodeCoords.lng,
      zone_id: zones[0]?.id || 1,
      parent_id: formData.get("parent_id") || null,
    };
    try {
      const res = await api.post("/equipements", data);
      setEquipements([...equipements, res.data]);
      setNewNodeCoords(null);
      setStatus({
        type: "success",
        message: "Équipement ajouté avec succès !",
      });
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", message: "Erreur lors de l'ajout." });
    }
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
      fetchData();
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
  const toggleNode = (id) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedNodes(newExpanded);
  };
  const treeData = useMemo(() => {
    const build = (parentId = null) => {
      return equipements
        .filter((eq) => eq.parent_id === parentId)
        .map((eq) => ({
          ...eq,
          children: build(eq.id),
        }));
    };
    return build();
  }, [equipements]);
  const searchResults = useMemo(() => {
    if (!searchTerm) return [];
    const zMatches = zones
      .filter((z) => z.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .map((z) => ({ ...z, isZone: true }));
    const eMatches = equipements
      .filter(
        (e) =>
          e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.node_id.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      .slice(0, 10);
    return [...zMatches, ...eMatches, ...externalSearchResults];
  }, [searchTerm, zones, equipements, externalSearchResults]);
  const handleSearchSelect = (item) => {
    setForceEdit(false);
    if (item.isExternal || item.isZone) {
      setSelectedEq({
        latitude: item.latitude,
        longitude: item.longitude,
        name: item.name,
        type: item.isExternal ? "LOCATION" : "ZONE",
      });
    } else {
      setSelectedEq(item);
    }
    setSearchTerm("");
    if (window.innerWidth <= 768) setIsSidebarOpen(false);
  };
  const TreeNode = ({ node, level = 0 }) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    return (
      <div className="tree-node-wrapper">
        <div
          className={`tree-row ${selectedEq?.id === node.id ? "active" : ""}`}
          style={{ paddingLeft: `${level * 12 + 15}px` }}
        >
          <div
            className="tree-row-content"
            onClick={() => {
              toggleNode(node.id);
              setSelectedEq(node);
              setForceEdit(false);
            }}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown size={14} className="tree-arrow" />
              ) : (
                <ChevronRight size={14} className="tree-arrow" />
              )
            ) : (
              <div style={{ width: 14 }}></div>
            )}
            <div className={`node-type-dot ${node.type.toLowerCase()}`}></div>
            <div className="node-text">
              <div className="node-id">{node.node_id}</div>
              <div className="node-name">{node.name}</div>
            </div>
          </div>
          <div className="node-actions">
            <Plus
              size={14}
              className="act-icon"
              title="Ajouter un enfant"
              onClick={(e) => {
                e.stopPropagation();
                setNewNodeCoords({ lat: node.latitude, lng: node.longitude });
                setSelectedEq(null);
                // Note: The form will show up, we should pre-select the parent in the form if possible
              }}
            />
            <Edit
              size={14}
              className="act-icon"
              title="Modifier"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedEq(node);
                setForceEdit(true);
              }}
            />
            <Trash2
              size={14}
              className="act-icon del"
              title="Supprimer"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteNode(node);
              }}
            />
          </div>
        </div>
        {isExpanded && hasChildren && (
          <div className="tree-children">
            {node.children.map((child) => (
              <TreeNode key={child.id} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };
  return (
    <GisLayout>
      <div className="tech-container">
        <div className="gis-main-content">
          {}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={{
              position: "absolute",
              top: "15px",
              left: "15px",
              zIndex: 3000,
              background: "white",
              border: "1px solid #ddd",
              borderRadius: "4px",
              padding: "8px",
            }}
            className="mobile-toggle-btn"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <aside
            className={`gis-sidebar ${isSidebarOpen ? "mobile-open" : ""}`}
          >
            <div className="sidebar-header">
              <div className="search-container-v2">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="Rechercher quartier, SR, PCO..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <X
                    size={16}
                    className="search-clear"
                    onClick={() => setSearchTerm("")}
                  />
                )}
                {searchResults.length > 0 && (
                  <div className="search-dropdown-v2">
                    {searchResults.map((item) => (
                      <div
                        key={item.id + (item.isZone ? "z" : (item.isExternal ? "x" : "e"))}
                        className="search-result-item"
                        onClick={() => handleSearchSelect(item)}
                      >
                        {item.isExternal ? (
                          <MapPin size={14} color="#FF5630" />
                        ) : item.isZone ? (
                          <Navigation size={14} color="#36B37E" />
                        ) : (
                          <MapIcon size={14} color="#0052CC" />
                        )}
                        <div style={{ flex: 1 }}>
                          <div className="res-name">{item.name}</div>
                          <div className="res-meta">
                            {item.isExternal ? "Lieu (Maps)" : (item.isZone ? "Quartier" : item.node_id)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="sidebar-body tree-body">
              <div
                style={{
                  padding: "15px 20px",
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "#999",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
              </div>
              <div className="tree-container">
                {equipements
                  .sort((a, b) => a.type.localeCompare(b.type))
                  .map((eq) => (
                  <div 
                    key={eq.id} 
                    className={`tree-row ${selectedEq?.id === eq.id ? "active" : ""}`}
                    onClick={() => {
                      handleEquipementClick(eq);
                      if (window.innerWidth <= 768) setIsSidebarOpen(false);
                    }}
                    style={{ paddingLeft: '15px' }}
                  >
                    <div className="tree-row-content">
                      <div className={`node-type-dot ${eq.type.toLowerCase()}`}></div>
                      <div className="node-text">
                        <div className="node-id">{eq.node_id}</div>
                        <div className="node-name">{eq.name}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div
              style={{
                padding: "15px",
                borderTop: "1px solid #eee",
                background: "#f9f9f9",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {status && (
                <div
                  style={{
                    padding: "10px",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background:
                      status.type === "success" ? "#e3fcef" : "#ffebe6",
                    color: status.type === "success" ? "#006644" : "#bf2600",
                    border: `1px solid ${status.type === "success" ? "#abf5d1" : "#ffbdad"}`,
                    fontSize: "11px",
                    fontWeight: 600,
                  }}
                >
                  {status.type === "success" ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <AlertCircle size={14} />
                  )}
                  <span>{status.message}</span>
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileSelect}
                accept=".kmz,.kml"
              />
              <button
                className="add-node-btn secondary"
                onClick={() => !uploading && fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Upload size={16} />
                )}
                {uploading ? "IMPORTATION..." : "IMPORTER KMZ"}
              </button>
            </div>
          </aside>
          <main className="gis-map-container">
            <MapView
              equipements={equipements}
              onEquipementClick={handleEquipementClick}
              selectedEquipement={selectedEq}
              onMapClick={handleMapClick}
            />
            {newNodeCoords && (
              <div className="add-node-popup">
                <div className="pco-popup-header">
                  <div className="pco-popup-title">Ajouter un nœud</div>
                  <button
                    className="pco-close-btn"
                    onClick={() => setNewNodeCoords(null)}
                  >
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleAddNode} style={{ padding: "20px" }}>
                  <div style={{ marginBottom: "15px" }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "11px",
                        fontWeight: 800,
                        marginBottom: "5px",
                      }}
                    >
                      NODE ID
                    </label>
                    <input
                      name="node_id"
                      required
                      style={{ width: "100%", padding: "8px" }}
                      placeholder="Ex: PCO-123"
                    />
                  </div>
                  <div style={{ marginBottom: "15px" }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "11px",
                        fontWeight: 800,
                        marginBottom: "5px",
                      }}
                    >
                      NOM
                    </label>
                    <input
                      name="name"
                      required
                      style={{ width: "100%", padding: "8px" }}
                      placeholder="Ex: PCO Khenifra center"
                    />
                  </div>
                  <div style={{ marginBottom: "15px" }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "11px",
                        fontWeight: 800,
                        marginBottom: "5px",
                      }}
                    >
                      TYPE
                    </label>
                    <select
                      name="type"
                      style={{ width: "100%", padding: "8px" }}
                    >
                      <option value="NRO">NRO (Central)</option>
                      <option value="SR">SR (Sous-Répartiteur)</option>
                      <option value="Splitter">Splitter</option>
                      <option value="PCO FTTH">PCO FTTH (Fibre)</option>
                      <option value="PCO ADSL">PCO ADSL (Cuivre)</option>
                      <option value="CLIENT">Client</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: "20px" }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "11px",
                        fontWeight: 800,
                        marginBottom: "5px",
                      }}
                    >
                      PARENT
                    </label>
                    <select
                      name="parent_id"
                      style={{ width: "100%", padding: "8px" }}
                    >
                      <option value="">Aucun</option>
                      {equipements.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.node_id} - {e.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="add-node-btn"
                    style={{ background: "#0052CC", color: "white" }}
                  >
                    CRÉER LE NŒUD
                  </button>
                </form>
              </div>
            )}
            {selectedEq && selectedEq.type !== "LOCATION" && selectedEq.type !== "ZONE" && (
              <EquipementPopup
                equipement={selectedEq}
                allEquipements={equipements}
                zones={zones}
                isLoading={loadingEq}
                isInitiallyEditing={forceEdit}
                onClose={() => {
                  setSelectedEq(null);
                  setForceEdit(false);
                }}
                onUpdate={(updated) => {
                  if (updated) {
                    setEquipements(
                      equipements.map((e) => (e.id === updated.id ? updated : e)),
                    );
                    setSelectedEq(updated);
                  } else {
                    fetchData();
                  }
                }}
              />
            )}
          </main>
        </div>
        <style
          dangerouslySetInnerHTML={{
            __html: `
        .search-container-v2 { position: relative; width: 100%; display: flex; align-items: center; background: #f4f5f7; border-radius: 8px; padding: 0 12px; }
        .search-container-v2 input { width: 100%; padding: 12px 8px; background: transparent; border: none; outline: none; font-size: 13px; font-weight: 600; }
        .search-dropdown-v2 { position: absolute; top: 100%; left: 0; right: 0; background: white; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); margin-top: 5px; z-index: 100; max-height: 300px; overflow-y: auto; border: 1px solid #eee; }
        .search-result-item { display: flex; align-items: center; gap: 12px; padding: 10px 15px; cursor: pointer; transition: all 0.2s; border-bottom: 1px solid #f9f9f9; }
        .search-result-item:hover { background: #f0f7ff; }
        .res-name { font-size: 13px; font-weight: 700; color: #333; }
        .res-meta { font-size: 11px; color: #999; }
        .tree-body { display: flex; flex-direction: column; overflow-y: auto; }
        .tree-row { display: flex; align-items: center; padding: 8px 10px; cursor: pointer; transition: all 0.1s; border-left: 3px solid transparent; }
        .tree-row:hover { background: #f4f5f7; }
        .tree-row.active { background: #f0f7ff; border-left-color: #0052CC; }
        .tree-row-content { flex: 1; display: flex; align-items: center; gap: 8px; overflow: hidden; }
        .node-text { overflow: hidden; }
        .node-id { font-size: 11px; font-weight: 800; color: #0052CC; white-space: nowrap; }
        .node-name { font-size: 10px; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .node-type-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .node-type-dot.nro { background: #800080; }
        .node-type-dot.sr_fiber { background: #00008B; }
        .node-type-dot.sr_adsl { background: #D2691E; }
        .node-type-dot.splitter { background: #FF991F; }
        .node-type-dot.pco { background: #00BFFF; }
        .node-type-dot.client { background: #6554C0; }
        .node-actions { display: none; gap: 8px; margin-left: 5px; }
        .tree-row:hover .node-actions { display: flex; }
        .act-icon { color: #ccc; cursor: pointer; transition: 0.2s; }
        .act-icon:hover { color: #0052CC; transform: scale(1.2); }
        .act-icon.del:hover { color: #FF5630; }
        .add-node-btn { width: 100%; padding: 12px; background: #0052CC; border: none; border-radius: 6px; font-size: 11px; font-weight: 800; color: #ffffff; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; transition: 0.2s; }
        .add-node-btn:hover:not(:disabled) { background: #003d99; }
        .add-node-btn.secondary { background: #f0f7ff; color: #0052CC; border: 1px solid #cce0ff; }
        .add-node-btn.secondary:hover:not(:disabled) { background: #e0efff; }
        .add-node-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .add-node-popup {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 350px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.3);
          z-index: 5000;
        }
      `,
          }}
        />
      </div>
    </GisLayout>
  );
}