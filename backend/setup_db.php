<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Artisan;
use App\Models\User;
use App\Models\Equipement;
use App\Models\Port;
use App\Models\Zone;
use Illuminate\Support\Facades\Hash;

echo "1. Creating database...\n";
try {
    $pdo = new PDO('mysql:host=127.0.0.1;port=3306', 'root', '');
    $pdo->exec('CREATE DATABASE IF NOT EXISTS prj_stage;');
    echo "Database prj_stage ensured.\n";
} catch (PDOException $e) {
    die("MySQL connection failed: " . $e->getMessage() . "\n");
}

echo "2. Running migrations...\n";
Artisan::call('migrate:fresh', ['--path' => 'Migration.php', '--force' => true]);
echo Artisan::output();

echo "3. Creating accounts...\n";
User::create([
    'name' => 'Admin',
    'email' => 'admin@test.com',
    'password' => Hash::make('password'),
    'role' => 'admin'
]);

User::create([
    'name' => 'Technicien',
    'email' => 'technicien@test.com',
    'password' => Hash::make('password'),
    'role' => 'technicien'
]);

echo "4. Seeding Smart Network Hierarchy (NRO -> SR -> Splitter -> PCO -> Port)...\n";

$zone = Zone::create(['name' => 'Khénifra Ville']);

Illuminate\Support\Facades\DB::beginTransaction();

// Helper for distance (approximate meters)
function getDistance($lat1, $lon1, $lat2, $lon2) {
    $theta = $lon1 - $lon2;
    $dist = sin(deg2rad($lat1)) * sin(deg2rad($lat2)) +  cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * cos(deg2rad($theta));
    $dist = acos($dist);
    $dist = rad2deg($dist);
    $miles = $dist * 60 * 1.1515;
    return round($miles * 1609.344, 2); // meters
}

function generatePorts($equipementId, $portCount, $serviceType) {
    for ($p = 1; $p <= $portCount; $p++) {
        $status = (rand(0, 10) > 8) ? 'plein' : 'libre';
        App\Models\Port::create([
            'number' => $p,
            'status' => $status,
            'equipement_id' => $equipementId,
            'abonne_name' => $status === 'plein' ? rand(12, 35) : null,
            'abonne_id' => $status === 'plein' ? "ABN-" . rand(1000, 9999) : null,
            'service_type' => $serviceType,
            'metadata' => [
                'signal_loss' => '-' . (rand(100, 500) / 10) . 'dB',
                'installation_date' => date('Y-m-d', strtotime('-' . rand(1, 365) . ' days'))
            ]
        ]);
    }
}

// 1. NRO (Central Node)
$nro = Equipement::create([
    'node_id' => 'NRO-KHN-01',
    'name' => 'Central NRO Khénifra',
    'type' => 'NRO',
    'latitude' => 32.9333,
    'longitude' => -5.6667,
    'status' => 'actif',
    'zone_id' => $zone->id,
    'cable_type' => 'Fiber',
    'distance_from_parent' => 0,
    'metadata' => []
]);
generatePorts($nro->id, 128, 'FTTH');

// 2. SR (Sous-Répartiteur) - 5 SRs
$srData = [
    ['id' => 'SR-AMAL', 'name' => 'SR Amal', 'lat' => 32.9380, 'lng' => -5.6620],
    ['id' => 'SR-FATH', 'name' => 'SR Al Fath', 'lat' => 32.9280, 'lng' => -5.6720],
    ['id' => 'SR-ATL', 'name' => 'SR Atlas', 'lat' => 32.9350, 'lng' => -5.6750],
    ['id' => 'SR-MOD', 'name' => 'SR Modern', 'lat' => 32.9420, 'lng' => -5.6650],
    ['id' => 'SR-IND', 'name' => 'SR Industrie', 'lat' => 32.9250, 'lng' => -5.6600],
];

foreach ($srData as $data) {
    $sr = Equipement::create([
        'node_id' => $data['id'],
        'name' => $data['name'],
        'type' => 'SR',
        'latitude' => $data['lat'],
        'longitude' => $data['lng'],
        'status' => 'actif',
        'parent_id' => $nro->id,
        'zone_id' => $zone->id,
        'cable_type' => 'Fiber',
        'distance_from_parent' => getDistance($nro->latitude, $nro->longitude, $data['lat'], $data['lng']),
        'metadata' => []
    ]);
    generatePorts($sr->id, 64, 'ADSL');

    echo "   Generated SR: {$data['name']}\n";

    // 3. Splitters - 4 per SR
    for ($s = 1; $s <= 4; $s++) {
        $sLat = $data['lat'] + (rand(-8, 8) / 10000);
        $sLng = $data['lng'] + (rand(-8, 8) / 10000);
        
        $splitter = Equipement::create([
            'node_id' => "SPL-{$data['id']}-0{$s}",
            'name' => "Splitter {$data['name']} #{$s}",
            'type' => 'Splitter',
            'latitude' => $sLat,
            'longitude' => $sLng,
            'status' => 'actif',
            'parent_id' => $sr->id,
            'zone_id' => $zone->id,
            'cable_type' => 'Fiber',
            'distance_from_parent' => getDistance($sr->latitude, $sr->longitude, $sLat, $sLng),
            'metadata' => []
        ]);
        generatePorts($splitter->id, 16, 'FTTH');

        // 4. PCOs - Geometric Cluster (4 per Splitter)
        $offsets = [
            ['n' => 'North', 'lat' => 0.0008, 'lng' => 0],
            ['n' => 'South', 'lat' => -0.0008, 'lng' => 0],
            ['n' => 'East', 'lat' => 0, 'lng' => 0.0008],
            ['n' => 'West', 'lat' => 0, 'lng' => -0.0008],
        ];

        foreach ($offsets as $idx => $offset) {
            $pLat = $sLat + $offset['lat'];
            $pLng = $sLng + $offset['lng'];
            
            // 60% FTTH, 40% ADSL
            $isFtth = (rand(1, 10) <= 6);
            
            $metadata = [
                'condition' => $isFtth ? 'Clean' : 'Old/Dusty',
                'photo_url' => $isFtth ? 'https://images.example.com/fiber_tray_f07bd8.jpg' : 'https://images.example.com/copper_junction.jpg',
            ];
            
            if ($isFtth) {
                $metadata['tray_type'] = 'Fiber Splice Tray';
                $metadata['splitter_ratio'] = '1:8';
                $metadata['connector_color'] = 'Green/APC';
            } else {
                $metadata['junction_type'] = 'Copper Terminal Block';
                $metadata['wiring_style'] = 'Manual Twist';
            }

            $pco = Equipement::create([
                'node_id' => "PCO-{$splitter->node_id}-{$offset['n'][0]}",
                'name' => "PCO {$offset['n']} ({$splitter->name})",
                'type' => $isFtth ? 'PCO FTTH' : 'PCO ADSL',
                'latitude' => $pLat,
                'longitude' => $pLng,
                'status' => 'actif',
                'parent_id' => $splitter->id,
                'zone_id' => $zone->id,
                'cable_type' => $isFtth ? 'Fiber' : 'Copper',
                'distance_from_parent' => getDistance($sLat, $sLng, $pLat, $pLng),
                'metadata' => $metadata
            ]);

            // 5. Ports (8 for FTTH, 7 for ADSL)
            $portCount = $isFtth ? 8 : 7;
            generatePorts($pco->id, $portCount, $isFtth ? 'FTTH' : 'ADSL');
        }
    }
}

Illuminate\Support\Facades\DB::commit();

echo "Setup complete. Hierarchy generated for Khénifra.\n";
echo "Admin: admin@test.com / password\n";
echo "Technicien: technicien@test.com / password\n";
