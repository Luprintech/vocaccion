<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\CareerMatchingService;
use App\Models\CareerCatalog;
use Illuminate\Foundation\Testing\RefreshDatabase;

class CareerMatchingServiceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Ejecutar seeder para tener profesiones en la BD
        $this->seed(\Database\Seeders\CareerCatalogSeeder::class);
    }

    /** @test */
    public function devuelve_exactamente_6_profesiones()
    {
        $service = new CareerMatchingService();
        
        $profileScores = [
            'R' => 20,
            'I' => 80,
            'A' => 10,
            'S' => 30,
            'E' => 15,
            'C' => 25,
        ];
        
        $result = $service->match($profileScores);
        
        $this->assertCount(6, $result, 'Debe devolver exactamente 6 profesiones');
    }

    /** @test */
    public function perfil_investigativo_prioriza_ciencia_y_tecnologia()
    {
        $service = new CareerMatchingService();
        
        // Perfil fuerte en I (Investigativo)
        $profileScores = [
            'R' => 15,
            'I' => 90,  // Muy alto
            'A' => 10,
            'S' => 20,
            'E' => 10,
            'C' => 25,
        ];
        
        $result = $service->match($profileScores);
        
        // Extraer sectores de las profesiones devueltas
        $sectores = array_map(fn($p) => $p['sector'], $result);
        
        // Debe incluir al menos una de: Ciencia, Tecnología, Salud (sectores I-heavy)
        $this->assertTrue(
            in_array('Ciencia e Investigación', $sectores) ||
            in_array('Tecnología e Informática', $sectores) ||
            in_array('Salud y Bienestar', $sectores),
            'Un perfil investigativo debe incluir profesiones de ciencia, tecnología o salud'
        );
        
        // El primer match debe tener score alto
        $this->assertGreaterThanOrEqual(70, $result[0]['match_porcentaje'], 
            'El mejor match debe tener al menos 70% de compatibilidad');
    }

    /** @test */
    public function perfil_artistico_prioriza_creatividad()
    {
        $service = new CareerMatchingService();
        
        // Perfil fuerte en A (Artístico)
        $profileScores = [
            'R' => 10,
            'I' => 15,
            'A' => 95,  // Muy alto
            'S' => 20,
            'E' => 15,
            'C' => 5,
        ];
        
        $result = $service->match($profileScores);
        
        $sectores = array_map(fn($p) => $p['sector'], $result);
        
        $this->assertTrue(
            in_array('Arte, Diseño y Creatividad', $sectores) ||
            in_array('Comunicación y Medios', $sectores),
            'Un perfil artístico debe incluir profesiones de arte o comunicación'
        );
    }

    /** @test */
    public function permite_hasta_3_profesiones_de_tecnologia()
    {
        $service = new CareerMatchingService();
        
        // Perfil muy fuerte en R+I (Realista + Investigativo) → tecnología
        $profileScores = [
            'R' => 85,
            'I' => 90,
            'A' => 5,
            'S' => 10,
            'E' => 10,
            'C' => 20,
        ];
        
        $result = $service->match($profileScores);
        
        $techCount = count(array_filter($result, fn($p) => $p['sector'] === 'Tecnología e Informática'));
        
        $this->assertLessThanOrEqual(3, $techCount, 
            'Debe permitir hasta 3 profesiones de tecnología (límite MAX_TECH)');
        
        $this->assertGreaterThanOrEqual(1, $techCount,
            'Con perfil R+I fuerte, debe incluir al menos 1 profesión tecnológica');
    }

    /** @test */
    public function boosting_contextual_joven_prioriza_emergentes()
    {
        $service = new CareerMatchingService();
        
        $profileScores = [
            'R' => 30,
            'I' => 70,
            'A' => 20,
            'S' => 25,
            'E' => 30,
            'C' => 25,
        ];
        
        // Usuario joven (22 años)
        $userContext = [
            'edad' => 22,
        ];
        
        $result = $service->match($profileScores, $userContext);
        
        // Contar profesiones emergentes/en crecimiento
        $emergentes = array_filter($result, fn($p) => 
            in_array($p['tipo_profesion'], ['emergente', 'en_crecimiento'])
        );
        
        $this->assertGreaterThanOrEqual(1, count($emergentes),
            'Un joven de 22 años debería ver al menos 1 profesión emergente/en crecimiento con boost');
    }

    /** @test */
    public function boosting_contextual_nivel_educativo_fp_prioriza_grados()
    {
        $service = new CareerMatchingService();
        
        $profileScores = [
            'R' => 25,
            'I' => 60,
            'A' => 15,
            'S' => 40,
            'E' => 20,
            'C' => 30,
        ];
        
        // Usuario con FP Superior completado
        $userContext = [
            'edad' => 24,
            'nivel_educativo' => 'FP Superior',
        ];
        
        $result = $service->match($profileScores, $userContext);
        
        // Contar profesiones que requieren Grado
        $conGrado = array_filter($result, fn($p) => 
            str_contains($p['nivel_formacion'], 'Grado')
        );
        
        $this->assertGreaterThanOrEqual(2, count($conGrado),
            'Usuario con FP Superior debería ver al menos 2 profesiones con Grado (progresión natural)');
    }

    /** @test */
    public function permite_hasta_3_del_mismo_sector()
    {
        $service = new CareerMatchingService();
        
        // Perfil MUY específico en Social (S)
        $profileScores = [
            'R' => 5,
            'I' => 10,
            'A' => 5,
            'S' => 95,  // Extremadamente social
            'E' => 10,
            'C' => 5,
        ];
        
        $result = $service->match($profileScores);
        
        // Contar cuántas veces aparece cada sector
        $sectorCounts = [];
        foreach ($result as $p) {
            $sector = $p['sector'];
            $sectorCounts[$sector] = ($sectorCounts[$sector] ?? 0) + 1;
        }
        
        $maxCount = max($sectorCounts);
        
        $this->assertLessThanOrEqual(3, $maxCount,
            'Ningún sector debe aparecer más de 3 veces (límite MAX_PER_SECTOR)');
    }

    /** @test */
    public function profesiones_ordenadas_por_score_descendente()
    {
        $service = new CareerMatchingService();
        
        $profileScores = [
            'R' => 40,
            'I' => 50,
            'A' => 30,
            'S' => 35,
            'E' => 45,
            'C' => 40,
        ];
        
        $result = $service->match($profileScores);
        
        // Verificar que están ordenadas de mayor a menor score
        for ($i = 0; $i < count($result) - 1; $i++) {
            $this->assertGreaterThanOrEqual(
                $result[$i + 1]['match_porcentaje'],
                $result[$i]['match_porcentaje'],
                'Las profesiones deben estar ordenadas por score descendente'
            );
        }
    }

    /** @test */
    public function diferentes_perfiles_producen_diferentes_profesiones()
    {
        $service = new CareerMatchingService();
        
        // Perfil 1: Investigativo
        $perfil1 = [
            'R' => 20,
            'I' => 90,
            'A' => 10,
            'S' => 15,
            'E' => 10,
            'C' => 25,
        ];
        
        // Perfil 2: Social
        $perfil2 = [
            'R' => 15,
            'I' => 20,
            'A' => 25,
            'S' => 85,
            'E' => 15,
            'C' => 10,
        ];
        
        $result1 = $service->match($perfil1);
        $result2 = $service->match($perfil2);
        
        $titulos1 = array_map(fn($p) => $p['titulo'], $result1);
        $titulos2 = array_map(fn($p) => $p['titulo'], $result2);
        
        // Debe haber diferencias significativas
        $overlap = count(array_intersect($titulos1, $titulos2));
        
        $this->assertLessThan(4, $overlap,
            'Perfiles muy diferentes NO deben producir más de 3 profesiones iguales. ' .
            'Overlap actual: ' . $overlap . '/6');
    }
}
