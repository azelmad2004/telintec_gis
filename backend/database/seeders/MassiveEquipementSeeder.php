<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Equipement;
use App\Models\Zone;
use App\Models\Port;

class MassiveEquipementSeeder extends Seeder
{
    public function run()
    {
        $zone = Zone::firstOrCreate(['name' => 'Khenifra Centre']);

        // 1. Specific SR requested: SR-09
        $sr09 = Equipement::updateOrCreate(
            ['node_id' => 'SR-09'],
            [
                'name' => 'SR-09 (Khenifra Center)',
                'type' => 'SR',
                'latitude' => 32.942816,
                'longitude' => -5.677461,
                'status' => 'active',
                'zone_id' => $zone->id,
                'metadata' => ['capacity_ports' => 256, 'occupied_ports' => 50]
            ]
        );
        $this->createPorts($sr09, 256);

        // 2. Second requested point: 32°55'49.1"N 5°40'26.1"W
        $sr02 = Equipement::updateOrCreate(
            ['node_id' => 'SR-02-B'],
            [
                'name' => 'SR-02 Sud',
                'type' => 'SR',
                'latitude' => 32.9303,
                'longitude' => -5.6739,
                'status' => 'active',
                'zone_id' => $zone->id,
                'metadata' => ['capacity_ports' => 128, 'occupied_ports' => 30]
            ]
        );
        $this->createPorts($sr02, 128);

        // 3. Massive number around SR-09
        for ($i = 1; $i <= 80; $i++) {
            $pco = Equipement::create([
                'node_id' => "PCO-09-" . str_pad($i, 3, '0', STR_PAD_LEFT),
                'name' => "PCO FTTH 09-$i",
                'type' => 'PCO',
                'latitude' => 32.942816 + (rand(-300, 300) / 10000),
                'longitude' => -5.677461 + (rand(-300, 300) / 10000),
                'status' => 'active',
                'zone_id' => $zone->id,
                'metadata' => ['capacity_ports' => 16, 'occupied_ports' => rand(0, 8)]
            ]);
            $this->createPorts($pco, 16);
        }

        // 4. Massive number around the other SR
        for ($i = 1; $i <= 80; $i++) {
            $pco = Equipement::create([
                'node_id' => "PCO-02-" . str_pad($i, 3, '0', STR_PAD_LEFT),
                'name' => "PCO Sud-$i",
                'type' => 'PCO',
                'latitude' => 32.9303 + (rand(-300, 300) / 10000),
                'longitude' => -5.6739 + (rand(-300, 300) / 10000),
                'status' => 'active',
                'zone_id' => $zone->id,
                'metadata' => ['capacity_ports' => 16, 'occupied_ports' => rand(0, 8)]
            ]);
            $this->createPorts($pco, 16);
        }
    }

    private function createPorts($eq, $count)
    {
        if ($eq->ports()->count() > 0) return; // Skip if ports already exist
        $toCreate = min($count, 16); // Create 16 ports max for faster seeding
        for ($i = 1; $i <= $toCreate; $i++) {
            Port::create([
                'equipement_id' => $eq->id,
                'number' => $i,
                'status' => 'libre'
            ]);
        }
    }
}
