import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import GisLayout from '../components/GisLayout';
import { 
  Search, 
  Plus, 
  FileText,
  Database
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function PlanningPage() {
  const [equipements, setEquipements] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // Added for interaction
  const navigate = useNavigate();

  useEffect(() => {
    fetchEquipements();
  }, []);

  const fetchEquipements = async () => {
    try {
      const response = await api.get('/equipements');
      setEquipements(response.data);
    } catch (error) {
      console.error("Erreur", error);
    }
  };


  const exportToPDF = () => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      doc.setFontSize(18);
      doc.setTextColor(51, 51, 51);
      doc.text('TELINTEC KHENIFRA - RAPPORT D\'INVENTAIRE NMS', 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Généré le: ${new Date().toLocaleString()}`, 14, 28);

      const tableColumn = ["NODE ID", "Type", "Capacité", "Status"];
      const tableRows = filteredEquipements.map((eq) => [
        eq.node_id,
        eq.type.replace('_', ' '),
        `${eq.metadata?.occupied_ports || 0}/${eq.metadata?.capacity_ports || 0}`,
        eq.status.toUpperCase()
      ]);

      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [51, 51, 51] },
        styles: { fontSize: 7 }
      });

      doc.save(`NMS_Inventory_Khenifra_${new Date().getTime()}.pdf`);
    } catch (err) {
      console.error(err);
    }
  };

  const exportToExcel = () => {
    const headers = ["NODE ID", "Nom", "Type", "Capacité", "Occupés", "Status", "Date Installation"];
    const rows = filteredEquipements.map(eq => [
      eq.node_id,
      eq.name,
      eq.type,
      eq.metadata?.capacity_ports || 0,
      eq.metadata?.occupied_ports || 0,
      eq.status,
      eq.metadata?.installation_date || ''
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `NMS_Export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredEquipements = equipements.filter(eq => {
    const matchesSearch = (eq.node_id || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (eq.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (eq.type || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatFilter = true;
    if (filterType === 'FIBER') matchesStatFilter = eq.type.includes('FIBER');
    if (filterType === 'COPPER') matchesStatFilter = eq.type.includes('COPPER') || eq.type.includes('ADSL');
    if (filterType === 'MAINTENANCE') matchesStatFilter = eq.status === 'maintenance';

    return matchesSearch && matchesStatFilter;
  });

  return (
    <GisLayout>
      <div className="tech-container">

      <main style={{ flex: 1, overflowY: 'auto', background: '#ffffff', padding: '30px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#333', textTransform: 'uppercase', marginBottom: '5px' }}>Inventaire Réseau NMS</h2>
              <div style={{ fontSize: '13px', color: '#777' }}>Gestion hiérarchique de l'infrastructure Khénifra</div>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={exportToPDF} style={{ padding: '10px 20px', background: '#333', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <FileText size={16} /> PDF
              </button>
              <button onClick={exportToExcel} style={{ padding: '10px 20px', background: '#1D6F42', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <Database size={16} /> EXCEL (CSV)
              </button>
              <button style={{ padding: '10px 20px', background: '#0052CC', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <Plus size={16} /> NOUVEAU NŒUD
              </button>
            </div>
          </div>

          {/* Stats Grid - Now with interactive clicks */}
          <div className="dashboard-grid" style={{ padding: 0, marginBottom: '30px' }}>
            <div 
              className={`stat-card clickable ${filterType === 'ALL' ? 'active' : ''}`} 
              onClick={() => setFilterType('ALL')}
            >
              <div className="stat-card-label">Total Infrastructures</div>
              <div className="stat-card-value">{equipements.length}</div>
              <div style={{ fontSize: '10px', marginTop: '5px', opacity: 0.6 }}>Voir tout</div>
            </div>
            <div 
              className={`stat-card clickable ${filterType === 'FIBER' ? 'active' : ''}`}
              style={{ borderLeftColor: '#00BFFF' }}
              onClick={() => setFilterType('FIBER')}
            >
              <div className="stat-card-label">FTTH (Fibre)</div>
              <div className="stat-card-value">{equipements.filter(e => e.type.includes('FIBER')).length}</div>
              <div style={{ fontSize: '10px', marginTop: '5px', opacity: 0.6 }}>Filtrer par Fibre</div>
            </div>
            <div 
              className={`stat-card clickable ${filterType === 'COPPER' ? 'active' : ''}`}
              style={{ borderLeftColor: '#8B4513' }}
              onClick={() => setFilterType('COPPER')}
            >
              <div className="stat-card-label">ADSL (Cuivre)</div>
              <div className="stat-card-value">{equipements.filter(e => e.type.includes('COPPER') || e.type.includes('ADSL')).length}</div>
              <div style={{ fontSize: '10px', marginTop: '5px', opacity: 0.6 }}>Filtrer par Cuivre</div>
            </div>
            <div 
              className={`stat-card clickable red ${filterType === 'MAINTENANCE' ? 'active' : ''}`}
              onClick={() => setFilterType('MAINTENANCE')}
            >
              <div className="stat-card-label">Alertes Maintenance</div>
              <div className="stat-card-value">{equipements.filter(e => e.status === 'maintenance').length}</div>
              <div style={{ fontSize: '10px', marginTop: '5px', opacity: 0.6 }}>Voir les alertes</div>
            </div>
          </div>

          {/* Table Container */}
          <div className="tech-table-container">
            <div style={{ padding: '15px 20px', background: '#fff', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div className="nms-search-bar">
                <Search size={18} color="#0052CC" />
                <input 
                  type="text" 
                  placeholder="Rechercher par NODE ID, Type, Nom..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div style={{ fontSize: '12px', color: '#777', fontWeight: 600 }}>
                {filterType !== 'ALL' && <span onClick={() => setFilterType('ALL')} style={{ color: '#0052CC', cursor: 'pointer', marginRight: '10px' }}>❌ Annuler filtre</span>}
                Affichage de {filteredEquipements.length} nœuds
              </div>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table className="tech-table">
                <thead>
                  <tr>
                    <th>NODE ID</th>
                    <th>Désignation</th>
                    <th>Type Réseau</th>
                    <th>Capacité / Occupation</th>
                    <th>Statut</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEquipements.slice(0, 100).map(eq => (
                    <tr key={eq.id}>
                      <td style={{ fontWeight: 900, color: '#0052CC', fontSize: '12px' }}>{eq.node_id}</td>
                      <td style={{ fontWeight: 500 }}>{eq.name}</td>
                      <td>
                        <span style={{ 
                          fontSize: '10px', 
                          fontWeight: 900, 
                          color: eq.type.includes('FIBER') ? '#00BFFF' : '#8B4513',
                          background: eq.type.includes('FIBER') ? '#f0fbff' : '#fff5eb',
                          padding: '4px 8px',
                          borderRadius: '4px'
                        }}>{eq.type.replace('_', ' ')}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ flex: 1, height: '4px', background: '#eee', borderRadius: '2px', minWidth: '40px' }}>
                              <div style={{ 
                                width: `${((eq.metadata?.occupied_ports || 0) / (eq.metadata?.capacity_ports || 1)) * 100}%`, 
                                height: '100%', 
                                background: (eq.metadata?.occupied_ports >= eq.metadata?.capacity_ports) ? '#ff0000' : '#36B37E',
                                borderRadius: '2px'
                              }}></div>
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: 700 }}>
                              {eq.metadata?.occupied_ports}/{eq.metadata?.capacity_ports}
                            </span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-chip status-${eq.status}`}>
                          {eq.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="action-icon-btn" title="Configuration"><Settings size={18} /></button>
                        <button className="action-icon-btn" title="Logs Réseau"><Database size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
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
      `}} />
    </div>
    </GisLayout>
  );
}
