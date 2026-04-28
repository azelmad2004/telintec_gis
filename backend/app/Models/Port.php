<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Port extends Model
{
    use HasFactory;

    protected $fillable = ['number', 'status', 'equipement_id'];

    public function equipement()
    {
        return $this->belongsTo(Equipement::class);
    }
}
