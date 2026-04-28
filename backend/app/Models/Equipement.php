<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Equipement extends Model
{
    use HasFactory;

    protected $fillable = [
        'node_id',
        'name',
        'type',
        'latitude',
        'longitude',
        'status',
        'metadata',
        'parent_id',
        'zone_id'
    ];

    protected $casts = [
        'metadata' => 'array',
        'latitude' => 'float',
        'longitude' => 'float',
    ];

    public function zone()
    {
        return $this->belongsTo(Zone::class);
    }

    public function parent()
    {
        return $this->belongsTo(Equipement::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Equipement::class, 'parent_id');
    }

    public function ports()
    {
        return $this->hasMany(Port::class);
    }
}
