<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Port;
use App\Models\Equipement;

echo "Total Ports: " . Port::count() . "\n";
$eq = Equipement::first();
if ($eq) {
    echo "First Eq: {$eq->name} (ID: {$eq->id})\n";
    echo "Ports for this Eq: " . $eq->ports()->count() . "\n";
}
