<?php

namespace App\Http\Controllers;

use App\Models\Port;
use Illuminate\Http\Request;

class PortController extends Controller
{
    public function update(Request $request, $id)
    {
        $port = Port::findOrFail($id);
        $port->update($request->all());
        return response()->json($port);
    }
    
    public function index() {
        return response()->json(Port::all());
    }
}
