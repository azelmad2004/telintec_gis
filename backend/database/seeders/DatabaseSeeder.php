<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Zone;
use App\Models\Equipement;
use App\Models\Port;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run()
    {
        $this->seedUsers();
        $this->seedZones();
        $this->seedEquipements();
        // Removed call to RealEquipementsSeeder since it was never called in the original DatabaseSeeder anyway!
        // Wait, looking at original DatabaseSeeder, it only called UserSeeder, ZoneSeeder, EquipementSeeder.
        // Let's keep the exact same behavior.
    }

    private function seedUsers()
    {
        User::create([
            'name' => 'Admin Telintec',
            'email' => 'admin@telintec.ma',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
        ]);

        User::create([
            'name' => 'Technicien Terrain',
            'email' => 'tech@telintec.ma',
            'password' => Hash::make('tech123'),
            'role' => 'technicien',
        ]);
    }

    private function seedZones()
    {
        $zones = [
            'Khenifra Centre' => ['lat' => 32.9325, 'lng' => -5.6660],
            'Amalou' => ['lat' => 32.9355, 'lng' => -5.6680],
            'Moulay Ismail' => ['lat' => 32.9375, 'lng' => -5.6620],
            'Al Qods' => ['lat' => 32.9285, 'lng' => -5.6690],
            'Route de Meknès' => ['lat' => 32.9385, 'lng' => -5.6710],
            'Zone Industrielle' => ['lat' => 32.9245, 'lng' => -5.6700],
            'Route d\'Azrou' => ['lat' => 32.9395, 'lng' => -5.6600],
        ];

        foreach ($zones as $name => $coords) {
            Zone::create([
                'name' => $name,
                'latitude' => $coords['lat'],
                'longitude' => $coords['lng']
            ]);
        }
    }

    private function seedEquipements()
    {
        Equipement::truncate();

        $zones = Zone::all();
        if ($zones->isEmpty()) {
            $names = ['Khenifra Centre', 'Amalou', 'Moulay Ismail', 'Al Qods', 'Route de Meknès', 'Zone Industrielle', 'Route d\'Azrou'];
            foreach ($names as $name) {
                Zone::create(['name' => $name]);
            }
            $zones = Zone::all();
        }

        $baseLat = 32.9325;
        $baseLng = -5.6660;

        $zoneOffsets = [
            'Khenifra Centre' => ['lat' => 0.0000, 'lng' => 0.0000],
            'Amalou' => ['lat' => 0.0030, 'lng' => -0.0020],
            'Moulay Ismail' => ['lat' => 0.0050, 'lng' => 0.0040],
            'Al Qods' => ['lat' => -0.0040, 'lng' => -0.0030],
            'Route de Meknès' => ['lat' => 0.0060, 'lng' => -0.0050],
            'Zone Industrielle' => ['lat' => -0.0080, 'lng' => -0.0040],
            'Route d\'Azrou' => ['lat' => 0.0070, 'lng' => 0.0060],
        ];

        $nodeCounter = 1;

        foreach ($zones as $zone) {
            $offset = $zoneOffsets[$zone->name] ?? ['lat' => 0, 'lng' => 0];
            $zoneLat = $baseLat + $offset['lat'];
            $zoneLng = $baseLng + $offset['lng'];

            $sr = Equipement::create([
                'node_id' => "KJN-SR-" . strtoupper(substr($zone->name, 0, 3)) . "-" . sprintf('%03d', $nodeCounter++),
                'name' => "SR " . $zone->name,
                'type' => 'SR',
                'latitude' => $zoneLat,
                'longitude' => $zoneLng,
                'status' => 'active',
                'metadata' => [
                    'installation_date' => '2020-01-01',
                    'capacity_ports' => 256,
                    'occupied_ports' => 128,
                ],
                'zone_id' => $zone->id,
            ]);

            for ($s = 1; $s <= 4; $s++) {
                $sLat = $sr->latitude + (mt_rand(-50, 50) / 10000);
                $sLng = $sr->longitude + (mt_rand(-50, 50) / 10000);

                $splitter = Equipement::create([
                    'node_id' => "KJN-SPL-" . sprintf('%04d', $nodeCounter++),
                    'name' => "Splitter " . $s . " (" . $zone->name . ")",
                    'type' => 'SPLITTER',
                    'latitude' => $sLat,
                    'longitude' => $sLng,
                    'status' => 'active',
                    'metadata' => ['ratio' => '1:64'],
                    'parent_id' => $sr->id,
                    'zone_id' => $zone->id,
                ]);

                for ($p = 1; $p <= 4; $p++) {
                    $pLat = $splitter->latitude + (mt_rand(-30, 30) / 10000);
                    $pLng = $splitter->longitude + (mt_rand(-30, 30) / 10000);

                    $pco = Equipement::create([
                        'node_id' => "KJN-PCO-" . sprintf('%05d', $nodeCounter++),
                        'name' => "PCO " . $s . "-" . $p . " (" . $zone->name . ")",
                        'type' => 'PCO',
                        'latitude' => $pLat,
                        'longitude' => $pLng,
                        'status' => 'active',
                        'metadata' => ['capacity' => 16],
                        'parent_id' => $splitter->id,
                        'zone_id' => $zone->id,
                    ]);

                    for ($c = 1; $c <= 8; $c++) {
                        $cLat = $pco->latitude + (mt_rand(-10, 10) / 10000);
                        $cLng = $pco->longitude + (mt_rand(-10, 10) / 10000);

                        Equipement::create([
                            'node_id' => "KJN-CLI-" . sprintf('%06d', $nodeCounter++),
                            'name' => "Client " . $s . "-" . $p . "-" . $c,
                            'type' => 'CLIENT',
                            'latitude' => $cLat,
                            'longitude' => $cLng,
                            'status' => (mt_rand(0, 10) > 8) ? 'maintenance' : 'active',
                            'metadata' => [
                                'address' => "Quartier " . $zone->name . ", Khenifra",
                                'contract_type' => 'FTTH',
                                'bandwidth' => '100Mbps'
                            ],
                            'parent_id' => $pco->id,
                            'zone_id' => $zone->id,
                        ]);
                    }
                }
            }
        }
    }
}