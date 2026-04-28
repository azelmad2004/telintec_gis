import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import MapView from '../components/MapView';
import GisLayout from '../components/GisLayout';
import { 
  Search, 
  Map as MapIcon, 
  LayoutDashboard, 
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
} from 'lucide-react';

function PcoPopup({ equipement, onClose }) {
  if (!equipement) return null;
  const portsLibres = equipement.ports?.filter(p => p.status === 'libre').length || 0;
  const portsPleins = equipement.ports?.filter(p => p.status === 'plein').length || 0;
  const totalPorts = equipement.ports?.length || 0;
  const occupationRate = totalPorts > 0 ? Math.round((portsPleins / totalPorts) * 100) : 0;
  const typeColors = {
    PCO: { bg: '#E3F2FD', text: '#0D47A1', border: '#90CAF9', full: '#D32F2F', empty: '#388E3C' },
    SR: { bg: '#F1F8E9', text: '#33691E', border: '#C5E1A5', full: '#E65100', empty: '#2E7D32' },
    Splitter: { bg: '#FFF3E0', text: '#E65100', border: '#FFCC80', full: '#D84315', empty: '#EF6C00' },
    default: { bg: '#F4F5F7', text: '#42526E', border: '#DFE1E6', full: '#FF5630', empty: '#36B37E' }
  };
  const scheme = typeColors[equipement.type] || typeColors.default;
  return (
    <div className="pco-popup" style={{ borderRadius: 'var(--radius)' }}>
      <div className="pco-popup-header" style={{ borderRadius: 'var(--radius) var(--radius) 0 0' }}>
        <div>
          <div style={{ fontSize: '10px', fontWeight: '800', opacity: 0.8, textTransform: 'uppercase' }}>Équipement</div>
          <div className="pco-popup-title">{equipement.name}</div>
        </div>
        <button className="pco-close-btn" onClick={onClose}><XIcon size={20} /></button>
      </div>
      <div className="pco-popup-body">
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <div style={{ padding: '6px 14px', background: scheme.bg, color: scheme.text, fontSize: '12px', fontWeight: '800', borderRadius: '4px' }}>{equipement.type}</div>
          <div style={{ padding: '6px 14px', background: '#F4F5F7', color: '#42526E', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={12} />{Number(equipement.latitude).toFixed(5)}, {Number(equipement.longitude).toFixed(5)}
          </div>
        </div>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#7A869A' }}>SATURATION RÉSEAU</span>
            <span style={{ fontSize: '11px', fontWeight: '900', color: occupationRate > 80 ? '#FF5630' : '#0052CC' }}>{occupationRate}%</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: '#F4F5F7' }}>
            <div style={{ height: '100%', background: occupationRate > 80 ? '#FF5630' : '#0052CC', width: `${occupationRate}%` }}></div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
          <div style={{ padding: '16px', background: '#E3FCEF', borderLeft: `4px solid ${scheme.empty}` }}>
            <div style={{ fontSize: '10px', color: '#006644', fontWeight: '800' }}>PORTS LIBRES</div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#006644' }}>{portsLibres}</div>
          </div>
          <div style={{ padding: '16px', background: '#FFEBE6', borderLeft: `4px solid ${scheme.full}` }}>
            <div style={{ fontSize: '10px', color: '#BF2600', fontWeight: '800' }}>PORTS PLEINS</div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#BF2600' }}>{portsPleins}</div>
          </div>
        </div>
        <div style={{ fontSize: '12px', fontWeight: '900', color: '#172B4D', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Database size={16} color={scheme.text} /> ARCHITECTURE DES PORTS
        </div>
        <div className="pco-ports-grid" style={{ gap: '6px' }}>
          {equipement.ports?.map(port => {
            const isPlein = port.status === 'plein';
            return (
              <div key={port.id} className={`pco-port ${port.status}`} style={{ fontSize: '10px', height: '36px', background: isPlein ? scheme.full + '22' : scheme.empty + '22', color: isPlein ? scheme.full : scheme.empty, border: `1px solid ${isPlein ? scheme.full + '44' : scheme.empty + '44'}`, fontWeight: '800' }}>
                {port.number}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function TechnicienPage() {
  const [equipements, setEquipements] = useState([]);
  const [zones, setZones] = useState([]);
  const [selectedEq, setSelectedEq] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eqRes, zoneRes] = await Promise.all([
        api.get('/equipements'),
        api.get('/zones')
      ]);
      setEquipements(eqRes.data);
      setZones(zoneRes.data);
    } catch (error) {
      console.error("Erreur", error);
    }
  };


  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.kmz') && !file.name.endsWith('.kml')) {
      setStatus({ type: 'error', message: 'Veuillez sélectionner un fichier .KMZ ou .KML uniquement.' });
      return;
    }

    setUploading(true);
    setStatus(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/import-kmz', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setStatus({ type: 'success', message: response.data.message });
      fetchData(); // Refresh map data
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.error || 'Erreur lors de l\'importation.' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => setStatus(null), 5000);
    }
  };

  const toggleNode = (id) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedNodes(newExpanded);
  };

  // Build hierarchy tree from flat array
  const treeData = useMemo(() => {
    const build = (parentId = null) => {
      return equipements
        .filter(eq => eq.parent_id === parentId)
        .map(eq => ({
          ...eq,
          children: build(eq.id)
        }));
    };
    return build();
  }, [equipements]);

  // Search results (Zones + Equipements)
  const searchResults = useMemo(() => {
    if (!searchTerm) return [];
    const zMatches = zones.filter(z => z.name.toLowerCase().includes(searchTerm.toLowerCase())).map(z => ({ ...z, isZone: true }));
    const eMatches = equipements.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()) || e.node_id.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 10);
    return [...zMatches, ...eMatches];
  }, [searchTerm, zones, equipements]);

  const handleSearchSelect = (item) => {
    if (item.isZone) {
      // MapView will need to handle zone flying or we can use map instance here
      // For now we set a dummy selectedEq with zone coords
      setSelectedEq({ latitude: item.latitude, longitude: item.longitude, name: item.name, type: 'ZONE' });
    } else {
      setSelectedEq(item);
      // Expand parents to show it in tree?
    }
    setSearchTerm('');
  };

  const TreeNode = ({ node, level = 0 }) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div className="tree-node-wrapper">
        <div 
          className={`tree-row ${selectedEq?.id === node.id ? 'active' : ''}`}
          style={{ paddingLeft: `${level * 12 + 15}px` }}
        >
          <div className="tree-row-content" onClick={() => { toggleNode(node.id); setSelectedEq(node); }}>
            {hasChildren ? (
              isExpanded ? <ChevronDown size={14} className="tree-arrow" /> : <ChevronRight size={14} className="tree-arrow" />
            ) : <div style={{ width: 14 }}></div>}
            
            <div className={`node-type-dot ${node.type.toLowerCase()}`}></div>
            <div className="node-text">
              <div className="node-id">{node.node_id}</div>
              <div className="node-name">{node.name}</div>
            </div>
          </div>
          
          <div className="node-actions">
             <Plus size={14} className="act-icon" title="Ajouter" />
             <Edit size={14} className="act-icon" title="Modifier" />
             <Trash2 size={14} className="act-icon del" title="Supprimer" />
          </div>
        </div>
        
        {isExpanded && hasChildren && (
          <div className="tree-children">
            {node.children.map(child => (
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
        <aside className="gis-sidebar">
          <div className="sidebar-header">
             <div className="search-container-v2">
                <Search size={18} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Rechercher quartier, SR, PCO..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && <X size={16} className="search-clear" onClick={() => setSearchTerm('')} />}
                
                {searchResults.length > 0 && (
                  <div className="search-dropdown-v2">
                    {searchResults.map(item => (
                      <div 
                        key={item.id + (item.isZone ? 'z' : 'e')} 
                        className="search-result-item"
                        onClick={() => handleSearchSelect(item)}
                      >
                        {item.isZone ? <Navigation size={14} color="#36B37E" /> : <MapIcon size={14} color="#0052CC" />}
                        <div style={{ flex: 1 }}>
                           <div className="res-name">{item.name}</div>
                           <div className="res-meta">{item.isZone ? 'Quartier' : item.node_id}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>
          </div>
          
          <div className="sidebar-body tree-body">
            <div style={{ padding: '15px 20px', fontSize: '11px', fontWeight: 800, color: '#999', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Hiérarchie Réseau
            </div>
            
            <div className="tree-container">
               {treeData.map(node => <TreeNode key={node.id} node={node} />)}
            </div>
          </div>

          <div style={{ padding: '15px', borderTop: '1px solid #eee', background: '#f9f9f9', display: 'flex', flexDirection: 'column', gap: '10px' }}>
             {status && (
               <div style={{ 
                 padding: '10px', 
                 borderRadius: '6px', 
                 display: 'flex', 
                 alignItems: 'center', 
                 gap: '8px',
                 background: status.type === 'success' ? '#e3fcef' : '#ffebe6',
                 color: status.type === 'success' ? '#006644' : '#bf2600',
                 border: `1px solid ${status.type === 'success' ? '#abf5d1' : '#ffbdad'}`,
                 fontSize: '11px',
                 fontWeight: 600
               }}>
                 {status.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                 <span>{status.message}</span>
               </div>
             )}

             <button className="add-node-btn">
                <PlusCircle size={16} /> AJOUTER NOUVEAU NRO
             </button>

             <input 
               type="file" 
               ref={fileInputRef} 
               style={{ display: 'none' }} 
               onChange={handleFileSelect}
               accept=".kmz,.kml"
             />
             <button 
                className="add-node-btn" 
                style={{ background: '#f0f7ff', borderColor: '#cce0ff' }}
                onClick={() => !uploading && fileInputRef.current?.click()}
                disabled={uploading}
             >
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} 
                {uploading ? 'IMPORTATION...' : 'IMPORTER KMZ'}
             </button>
          </div>
        </aside>

        <main className="gis-map-container">
          <MapView 
            equipements={equipements} 
            onEquipementClick={setSelectedEq} 
            selectedEquipement={selectedEq}
          />
          
          <PcoPopup 
            equipement={selectedEq} 
            onClose={() => setSelectedEq(null)} 
          />
        </main>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
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

        .add-node-btn { width: 100%; padding: 12px; background: #fff; border: 1px solid #ddd; border-radius: 6px; font-size: 11px; font-weight: 800; color: #0052CC; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; transition: 0.2s; }
        .add-node-btn:hover:not(:disabled) { background: #f0f7ff; border-color: #0052CC; }
        .add-node-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
      </div>
    </GisLayout>
  );
}

