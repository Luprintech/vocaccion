<?php

/**
 * Convert ESCO CSV dataset to JSON and organize in catalog structure
 * 
 * ESCO (European Skills, Competences, Qualifications and Occupations)
 * is the European multilingual classification of skills, competences, 
 * qualifications and occupations.
 */

$sourceDir = __DIR__ . '/../database/data/catalog/esco/source';
$targetDir = __DIR__ . '/../database/data/catalog/esco/raw';

echo "Source directory: {$sourceDir}\n";
echo "Target directory: {$targetDir}\n\n";

if (!file_exists($targetDir)) {
    mkdir($targetDir, 0755, true);
    echo "✅ Created target directory: {$targetDir}\n";
}

// Define which files to convert and their purpose
$filesToConvert = [
    // Core data
    'occupations_es.csv' => [
        'output' => 'esco_occupations.json',
        'description' => 'ESCO occupations (profesiones/ocupaciones)',
    ],
    'skills_es.csv' => [
        'output' => 'esco_skills.json',
        'description' => 'ESCO skills/competences (habilidades/competencias)',
    ],
    
    // Relations
    'occupationSkillRelations_es.csv' => [
        'output' => 'esco_occupation_skill_relations.json',
        'description' => 'Relations between occupations and required skills',
    ],
    'skillSkillRelations_es.csv' => [
        'output' => 'esco_skill_skill_relations.json',
        'description' => 'Relations between skills (broader/narrower)',
    ],
    
    // Hierarchies
    'ISCOGroups_es.csv' => [
        'output' => 'esco_isco_groups.json',
        'description' => 'ISCO-08 occupation groups',
    ],
    'skillGroups_es.csv' => [
        'output' => 'esco_skill_groups.json',
        'description' => 'Skill groups/categories',
    ],
    
    // Collections
    'digitalSkillsCollection_es.csv' => [
        'output' => 'esco_digital_skills.json',
        'description' => 'Digital skills collection',
    ],
    'greenSkillsCollection_es.csv' => [
        'output' => 'esco_green_skills.json',
        'description' => 'Green/environmental skills collection',
    ],
    'transversalSkillsCollection_es.csv' => [
        'output' => 'esco_transversal_skills.json',
        'description' => 'Transversal/soft skills collection',
    ],
    'languageSkillsCollection_es.csv' => [
        'output' => 'esco_language_skills.json',
        'description' => 'Language skills collection',
    ],
];

echo "🔄 Converting ESCO CSV files to JSON...\n\n";

$totalConverted = 0;
$totalRecords = 0;

foreach ($filesToConvert as $csvFile => $config) {
    $sourcePath = $sourceDir . '/' . $csvFile;
    $targetPath = $targetDir . '/' . $config['output'];
    
    if (!file_exists($sourcePath)) {
        echo "⚠️  File not found: {$csvFile}\n";
        continue;
    }
    
    echo "📄 Converting: {$csvFile}\n";
    echo "   → {$config['description']}\n";
    
    $handle = fopen($sourcePath, 'r');
    if (!$handle) {
        echo "   ❌ Failed to open file\n";
        continue;
    }
    
    // Read header
    $header = fgetcsv($handle, 0, ',');
    if (!$header) {
        echo "   ❌ Failed to read header\n";
        fclose($handle);
        continue;
    }
    
    $data = [];
    $rowCount = 0;
    
    while (($row = fgetcsv($handle, 0, ',')) !== false) {
        if (count($row) !== count($header)) {
            // Skip malformed rows
            continue;
        }
        
        $record = array_combine($header, $row);
        $data[] = $record;
        $rowCount++;
    }
    
    fclose($handle);
    
    // Write JSON
    $jsonOptions = JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES;
    $jsonData = json_encode($data, $jsonOptions);
    
    if ($jsonData === false) {
        echo "   ❌ Failed to encode JSON\n";
        continue;
    }
    
    file_put_contents($targetPath, $jsonData);
    
    $fileSize = filesize($targetPath);
    $fileSizeMB = round($fileSize / 1024 / 1024, 2);
    
    echo "   ✅ Converted {$rowCount} records ({$fileSizeMB} MB)\n";
    echo "   📁 Saved to: {$config['output']}\n\n";
    
    $totalConverted++;
    $totalRecords += $rowCount;
}

echo "🎉 Conversion complete!\n";
echo "   Files converted: {$totalConverted}\n";
echo "   Total records: " . number_format($totalRecords) . "\n";
echo "   Output directory: {$targetDir}\n";
