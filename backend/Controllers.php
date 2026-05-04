<?php
namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Equipement;
use App\Models\Port;
use App\Models\Zone;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

use Illuminate\Routing\Controller as BaseController;

class Controllers extends BaseController
{
    public function login(Request $request) {
        if ($token = Auth::guard('api')->attempt($request->only('email', 'password'))) {
            return response()->json(['access_token' => $token, 'user' => Auth::guard('api')->user()]);
        }
        return response()->json(['error' => 'Unauthorized'], 401);
    }

    public function eqIndex(Request $request) { 
        $query = Equipement::query();
        if ($request->has('type')) {
            $query->where('type', 'LIKE', '%' . $request->type . '%');
        }
        if ($request->has('zone_id')) {
            $query->where('zone_id', $request->zone_id);
        }
        
        // Optimize for speed: select necessary columns and use withCount to avoid N+1 queries
        $equipements = $query->select([
            'id', 'node_id', 'name', 'type', 'latitude', 'longitude', 'status', 'zone_id', 'parent_id'
        ])
        ->with(['zone'])
        ->withCount([
            'ports', 
            'ports as occupied_ports_count' => function ($q) { $q->where('status', 'plein'); }
        ])
        ->get();

        // Keep appends simple
        $equipements->each(function ($eq) {
            $eq->setAppends(['total_ports', 'occupied_ports']);
        });

        return response()->json($equipements); 
    }
    public function eqShow($id) {
        $eq = Equipement::with(['zone', 'ports', 'parent'])->findOrFail($id);
        return response()->json($eq->makeVisible(['ports']));
    }
    public function eqStore(Request $request) { return response()->json(Equipement::create($request->all()), 201); }
    public function eqUpdate(Request $request, $id) { 
        $eq = Equipement::findOrFail($id); $eq->update($request->all()); 
        return response()->json($eq->load(['zone', 'ports'])->makeVisible(['ports'])); 
    }
    public function eqDestroy($id) { Equipement::findOrFail($id)->delete(); return response()->json(null, 204); }

    public function zoneIndex() { return response()->json(Zone::all()); }
    
    public function dashboardStats() {
        return response()->json([
            'total_equipements' => Equipement::count(),
            'total_ports' => Port::count(),
            'ftth_pcos' => Equipement::where('type', 'PCO FTTH')->count(),
            'adsl_pcos' => Equipement::where('type', 'PCO ADSL')->count(),
            'total_abonnees' => Port::where('status', 'plein')->count(),
            'zones' => Zone::count()
        ]);
    }
    public function portStore(Request $request) {
        return response()->json(Port::create($request->all()), 201);
    }

    public function portUpdate(Request $request, $id) {
        $port = Port::findOrFail($id);
        
        if ($request->has('abonne_id')) {
            if (empty($request->abonne_id)) {
                $port->status = 'libre';
                $port->abonne_id = null;
                $port->abonne_name = null;
            } else {
                $port->status = 'plein';
                $port->abonne_id = $request->abonne_id;
                $port->abonne_name = $request->abonne_name ?? $port->abonne_name;
            }
            $port->save();
            return response()->json($port);
        }

        if ($request->input('status') === 'plein' && empty($request->input('abonne_id') ?: $port->abonne_id)) {
            return response()->json(['error' => 'Un port ne peut pas être plein sans abonne_id'], 400);
        }

        $port->update($request->all());
        return response()->json($port);
    }

    public function importKmz(Request $request) {
        if (!$request->hasFile('file')) return response()->json(['error' => 'No file provided'], 400);
        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension());
        $kmlContent = '';

        if ($extension === 'kmz') {
            $zip = new \ZipArchive;
            if ($zip->open($file->getRealPath()) === TRUE) {
                for ($i = 0; $i < $zip->numFiles; $i++) {
                    $filename = $zip->getNameIndex($i);
                    if (str_ends_with(strtolower($filename), '.kml')) {
                        $kmlContent = $zip->getFromIndex($i);
                        break;
                    }
                }
                $zip->close();
            } else {
                return response()->json(['error' => 'Failed to open KMZ file'], 400);
            }
        } else if ($extension === 'kml') {
            $kmlContent = file_get_contents($file->getRealPath());
        } else {
            return response()->json(['error' => 'Invalid file format'], 400);
        }

        if (empty($kmlContent)) return response()->json(['error' => 'No KML content found'], 400);

        try {
            libxml_use_internal_errors(true);
            $kmlContent = preg_replace('/xmlns[^=]*="[^"]*"/i', '', $kmlContent);
            $xml = simplexml_load_string($kmlContent, 'SimpleXMLElement', LIBXML_NOCDATA);
            if (!$xml) return response()->json(['error' => 'Invalid XML content'], 400);

            $count = 0;
            $imported = []; 
            $defaultZone = Zone::firstOrCreate(['name' => 'Imported Zone']);

            // Process Folders first if they exist
            $folders = $xml->xpath('//Folder') ?: [];
            
            if (empty($folders)) {
                // No folders, process all placemarks in default zone
                $placemarks = $xml->xpath('//Placemark') ?: [];
                $this->processPlacemarks($placemarks, $defaultZone, $imported, $count);
            } else {
                foreach ($folders as $folder) {
                    $zoneName = trim((string)$folder->name) ?: 'Imported Zone';
                    $zone = Zone::firstOrCreate(['name' => $zoneName]);
                    $placemarks = $folder->xpath('.//Placemark') ?: [];
                    $this->processPlacemarks($placemarks, $zone, $imported, $count);
                }
                // Also catch any placemarks NOT in folders
                $topLevelPlacemarks = $xml->xpath('/Document/Placemark | /kml/Placemark') ?: [];
                if (!empty($topLevelPlacemarks)) {
                    $this->processPlacemarks($topLevelPlacemarks, $defaultZone, $imported, $count);
                }
            }

            // Second pass: resolve parent_name -> parent_id with robust matching
            foreach ($imported as $name => $data) {
                $pName = $data['parent_name'];
                if (!empty($pName)) {
                    $normalizedPName = $this->normalizeName($pName);
                    
                    // 1. Try to find in the just-imported list
                    $parentEq = null;
                    foreach ($imported as $importedName => $importedData) {
                        if ($this->normalizeName($importedName) === $normalizedPName) {
                            $parentEq = $importedData['eq'];
                            break;
                        }
                    }

                    // 2. Try to find in database if not found in current import
                    if (!$parentEq) {
                        $parentEq = Equipement::where('name', $pName)
                            ->orWhere('node_id', $pName)
                            ->first();
                        
                        if (!$parentEq) {
                            // Try normalized search in DB (limited, but better than nothing)
                            $allEq = Equipement::all();
                            foreach ($allEq as $existing) {
                                if ($this->normalizeName($existing->name) === $normalizedPName) {
                                    $parentEq = $existing;
                                    break;
                                }
                            }
                        }
                    }

                    if ($parentEq) {
                        $data['eq']->parent_id = $parentEq->id;
                        $data['eq']->save();
                    }
                }
            }

            return response()->json(['message' => "$count nœuds importés avec succès !"]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error: ' . $e->getMessage()], 500);
        }
    }

    private function processPlacemarks($placemarks, $zone, &$imported, &$count) {
        foreach ($placemarks as $placemark) {
            $name = trim((string)$placemark->name);
            
            $coordsNodes = $placemark->xpath('.//*[local-name()="coordinates"]');
            $coordsRaw = $coordsNodes ? trim((string)$coordsNodes[0]) : '';
            if (empty($coordsRaw)) continue;

            $parts = explode(',', $coordsRaw);
            if (count($parts) < 2) continue;

            $longitude = (float)trim($parts[0]);
            $latitude  = (float)trim($parts[1]);

            // Robust ExtendedData extraction
            $extData = [];
            $dataNodes = $placemark->xpath('.//*[local-name()="Data"]');
            foreach ($dataNodes as $dNode) {
                $key = (string)($dNode->attributes()['name'] ?? '');
                $valNodes = $dNode->xpath('.//*[local-name()="value"]');
                $val = $valNodes ? (string)$valNodes[0] : '';
                if ($key) $extData[$key] = $val;
            }

            // Fallback to description parsing if ExtendedData is sparse
            if (empty($extData) || count($extData) < 2) {
                $description = (string)$placemark->description;
                if ($description) {
                    // Match "key: value" or "key = value"
                    if (preg_match_all('/([a-zA-Z0-9_-]+)\s*[:=]\s*([^<]+)/', $description, $matches)) {
                        foreach ($matches[1] as $i => $k) {
                            if (!isset($extData[$k])) $extData[$k] = trim($matches[2][$i]);
                        }
                    }
                }
            }

            $type       = $extData['type']        ?? $this->guessType($name);
            $status     = $extData['status']      ?? 'actif';
            $parentName = $extData['parent_name'] ?? null;

            $typeMap = [
                'nro' => 'NRO', 'sr' => 'SR', 'splitter' => 'Splitter',
                'pco ftth' => 'PCO FTTH', 'pco adsl' => 'PCO ADSL', 'client' => 'CLIENT',
            ];
            $type = $typeMap[strtolower($type)] ?? $type;
            if (strtolower($status) === 'active') $status = 'actif';

            // Stabilize nodeId: use name and a shorter unique part to avoid clutter
            $cleanName = strtoupper(preg_replace('/[^a-zA-Z0-9]/', '_', $name));
            $nodeId = $cleanName . '-' . substr(md5($name . $latitude . $longitude), 0, 4);

            $eq = Equipement::create([
                'node_id'   => $nodeId,
                'name'      => $name ?: 'Unknown Node',
                'type'      => $type,
                'latitude'  => $latitude,
                'longitude' => $longitude,
                'status'    => $status,
                'zone_id'   => $zone->id,
                'metadata'  => $extData,
            ]);

            $imported[$name] = ['eq' => $eq, 'parent_name' => $parentName];
            $count++;
        }
    }

    private function normalizeName($name) {
        if (!$name) return '';
        // Remove spaces, underscores, dashes, and handle O vs 0
        $n = strtolower(trim($name));
        $n = str_replace([' ', '_', '-'], '', $n);
        $n = str_replace('o', '0', $n); // Letter O to Zero 0
        return $n;
    }

}

