<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Controllers;

Route::get('/', function() { return "API OK"; });
Route::post('api/auth/login', [Controllers::class, 'login']);

Route::group(['middleware' => 'auth:api', 'prefix' => 'api'], function () {
    Route::get('equipements', [Controllers::class, 'eqIndex']);
    Route::get('equipements/{id}', [Controllers::class, 'eqShow']);
    Route::get('dashboard-stats', [Controllers::class, 'dashboardStats']);
    Route::post('equipements', [Controllers::class, 'eqStore']);
    Route::put('equipements/{id}', [Controllers::class, 'eqUpdate']);
    Route::delete('equipements/{id}', [Controllers::class, 'eqDestroy']);
    Route::get('zones', [Controllers::class, 'zoneIndex']);
    Route::post('ports', [Controllers::class, 'portStore']);
    Route::put('ports/{id}', [Controllers::class, 'portUpdate']);
    Route::post('import-kmz', [Controllers::class, 'importKmz']);
});
