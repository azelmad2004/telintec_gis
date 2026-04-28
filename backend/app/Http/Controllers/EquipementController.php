<?php

namespace App\Http\Controllers;

use App\Models\Equipement;
use App\Models\Port;
use App\Models\Zone;
use Illuminate\Http\Request;
use ZipArchive;
use SimpleXMLElement;

class EquipementController extends Controller
{
    public function index(Request $request)
    {
        $query = Equipement::with(['zone', 'ports']);

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }
        
        if ($request->has('zone_id')) {
            $query->where('zone_id', $request->zone_id);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:PCO,SR,Splitter',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'zone_id' => 'required|exists:zones,id',
        ]);

        $equipement = Equipement::create($request->all());

        return response()->json($equipement, 201);
    }

    public function show($id)
    {
        $equipement = Equipement::with(['zone', 'ports'])->findOrFail($id);
        return response()->json($equipement);
    }

    public function update(Request $request, $id)
    {
        $equipement = Equipement::findOrFail($id);
        $equipement->update($request->all());

        return response()->json($equipement);
    }

    public function destroy($id)
    {
        Equipement::findOrFail($id)->delete();
        return response()->json(null, 204);
    }

    public function importKMZ(Request $request)
    {
        $request->validate([
            'file' => 'required|file',
            'zone_id' => 'nullable|integer'
        ]);

        $file = $request->file('file');
        $zip = new ZipArchive;
        
        if ($zip->open($file->getRealPath()) === TRUE) {
            $kmlContent = null;
            // Chercher le fichier .kml à l'intérieur du KMZ
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $filename = $zip->getNameIndex($i);
                if (pathinfo($filename, PATHINFO_EXTENSION) === 'kml') {
                    $kmlContent = $zip->getFromIndex($i);
                    break;
                }
            }
            $zip->close();

            if (!$kmlContent) {
                return response()->json(['error' => 'Aucun fichier KML trouvé dans le KMZ'], 400);
            }

            return $this->parseKML($kmlContent, $request->zone_id);
        }

        return response()->json(['error' => 'Impossible d\'ouvrir le fichier KMZ'], 400);
    }

    private function parseKML($content, $zoneId = null)
    {
        if (!$zoneId) {
            $zone = Zone::firstOrCreate(['name' => 'Import Terrain']);
            $zoneId = $zone->id;
        }

        // Suppression des namespaces pour simplifier le parsing SimpleXML
        $content = str_replace('xmlns=', 'ns=', $content);
        $xml = new SimpleXMLElement($content);
        
        $count = 0;
        // Recherche récursive des Placemarks
        $placemarks = $xml->xpath('//Placemark');

        foreach ($placemarks as $placemark) {
            $name = (string)$placemark->name ?: 'Equipement Sans Nom';
            
            // Extraction des coordonnées (format: lon,lat,alt)
            $coordsRaw = null;
            if (isset($placemark->Point->coordinates)) {
                $coordsRaw = (string)$placemark->Point->coordinates;
            }

            if (!$coordsRaw) continue;

            $coordsArray = explode(',', trim($coordsRaw));
            if (count($coordsArray) < 2) continue;

            $longitude = (float)$coordsArray[0];
            $latitude = (float)$coordsArray[1];

            // Détection du type basée sur le nom
            $type = 'PCO';
            if (stripos($name, 'SR') !== false) $type = 'SR';
            if (stripos($name, 'Splitter') !== false) $type = 'Splitter';

            $eq = Equipement::create([
                'name' => $name,
                'type' => $type,
                'latitude' => $latitude,
                'longitude' => $longitude,
                'zone_id' => $zoneId,
                'status' => 'active'
            ]);

            // Création par défaut de 16 ports (vous pourrez les modifier après)
            for ($i = 1; $i <= 16; $i++) {
                Port::create([
                    'equipement_id' => $eq->id,
                    'number' => $i,
                    'status' => 'libre'
                ]);
            }
            $count++;
        }

        return response()->json([
            'success' => true,
            'message' => "$count équipements importés avec succès depuis Google My Maps."
        ], 200);
    }
}
