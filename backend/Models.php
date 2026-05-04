<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable;
    public function getJWTIdentifier() { return $this->getKey(); }
    public function getJWTCustomClaims() { return []; }
    protected $fillable = ['name', 'email', 'password', 'role'];
    protected $hidden = ['password', 'remember_token'];
}

class Zone extends Model
{
    use HasFactory;
    protected $fillable = ['name'];
    public function equipements() { return $this->hasMany(Equipement::class); }
}

class Equipement extends Model
{
    use HasFactory;
    protected $fillable = ['node_id', 'name', 'type', 'latitude', 'longitude', 'status', 'metadata', 'parent_id', 'zone_id', 'cable_type', 'distance_from_parent'];
    protected $casts = ['metadata' => 'array'];
    protected $hidden = ['ports'];
    protected $appends = ['total_ports', 'occupied_ports', 'popup_info', 'visual_summary'];

    public function zone() { return $this->belongsTo(Zone::class); }
    public function ports() { return $this->hasMany(Port::class); }
    public function children() { return $this->hasMany(Equipement::class, 'parent_id'); }
    public function parent() { return $this->belongsTo(Equipement::class, 'parent_id'); }

    public function getTotalPortsAttribute() { 
        return $this->attributes['ports_count'] ?? $this->ports->count(); 
    }
    public function getOccupiedPortsAttribute() { 
        return $this->attributes['occupied_ports_count'] ?? $this->ports->where('status', 'plein')->count(); 
    }

    public function getPopupInfoAttribute() {
        return [
            'total_ports' => $this->total_ports,
            'occupied_ports' => $this->occupied_ports,
            'network_type' => $this->cable_type ?: 'Unknown',
            'parent_name' => $this->relationLoaded('parent') && $this->parent ? $this->parent->name : 'NRO Central'
        ];
    }

    public function getVisualSummaryAttribute() {
        if (str_contains($this->type, 'FTTH')) {
            return "Splice Tray with 8 LC/APC Connectors. Status: " . ($this->metadata['condition'] ?? 'Clean');
        }
        if (str_contains($this->type, 'ADSL')) {
            return "10-Pair Terminal Block. Status: " . ($this->metadata['condition'] ?? 'Maintenance Required');
        }
        return "Standard Node";
    }
}

class Port extends Model
{
    use HasFactory;
    protected $fillable = ['number', 'status', 'equipement_id', 'abonne_name', 'abonne_id', 'service_type', 'metadata'];
    protected $casts = ['metadata' => 'array'];
    protected $appends = ['display_name'];

    public function equipement() { return $this->belongsTo(Equipement::class); }

    public function getDisplayNameAttribute() {
        if ($this->service_type === 'ADSL') {
            return "Pair " . $this->number;
        }
        return "Port " . $this->number;
    }
}
