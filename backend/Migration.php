<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id(); $table->string('name'); $table->string('email')->unique(); $table->string('password'); $table->string('role')->default('technicien'); $table->timestamps();
        });
        Schema::create('zones', function (Blueprint $table) {
            $table->id(); $table->string('name'); $table->timestamps();
        });
        Schema::create('equipements', function (Blueprint $table) {
            $table->id(); 
            $table->string('node_id')->unique(); 
            $table->string('name')->index(); 
            $table->string('type')->index(); 
            $table->decimal('latitude', 10, 7); 
            $table->decimal('longitude', 11, 7); 
            $table->string('status')->default('active')->index(); 
            $table->string('cable_type')->nullable(); 
            $table->decimal('distance_from_parent', 10, 2)->default(0); 
            $table->json('metadata')->nullable(); 
            $table->foreignId('zone_id')->constrained()->onDelete('cascade'); 
            $table->unsignedBigInteger('parent_id')->nullable()->index(); 
            $table->foreign('parent_id')->references('id')->on('equipements')->onDelete('cascade'); 
            $table->timestamps();
        });
        Schema::create('ports', function (Blueprint $table) {
            $table->id(); 
            $table->integer('number'); 
            $table->enum('status', ['libre', 'plein'])->default('libre')->index(); 
            $table->foreignId('equipement_id')->constrained('equipements')->onDelete('cascade'); 
            $table->string('abonne_name')->nullable(); 
            $table->string('abonne_id')->nullable(); 
            $table->string('service_type')->default('FTTH'); 
            $table->json('metadata')->nullable(); 
            $table->timestamps();
        });
    }
};
