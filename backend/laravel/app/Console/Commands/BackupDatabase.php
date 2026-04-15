<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class BackupDatabase extends Command
{
    protected $signature = 'db:backup {--name=} {--compress}';
    protected $description = 'Create a backup of the database';

    public function handle()
    {
        $this->info('Creating database backup...');

        $database = config('database.connections.mysql.database');
        $username = config('database.connections.mysql.username');
        $password = config('database.connections.mysql.password');
        $host = config('database.connections.mysql.host');
        
        $backupDir = database_path('backups');
        
        if (!file_exists($backupDir)) {
            mkdir($backupDir, 0755, true);
            $this->info("Created backup directory: {$backupDir}");
        }

        $timestamp = now()->format('Ymd_His');
        $filename = $this->option('name') 
            ? "{$this->option('name')}_{$timestamp}.sql"
            : "vocaccion_{$timestamp}.sql";
        
        $filepath = $backupDir . DIRECTORY_SEPARATOR . $filename;

        // Build mysqldump command
        $command = sprintf(
            'mysqldump -h %s -u %s %s %s > %s',
            escapeshellarg($host),
            escapeshellarg($username),
            $password ? '-p' . escapeshellarg($password) : '',
            escapeshellarg($database),
            escapeshellarg($filepath)
        );

        // Execute backup
        exec($command, $output, $returnCode);

        if ($returnCode === 0 && file_exists($filepath)) {
            $size = filesize($filepath);
            $sizeFormatted = $this->formatBytes($size);
            
            $this->info("✅ Backup created successfully!");
            $this->line("   File: {$filename}");
            $this->line("   Size: {$sizeFormatted}");
            $this->line("   Path: {$filepath}");

            // Optional compression
            if ($this->option('compress')) {
                $this->info('Compressing backup...');
                exec("gzip {$filepath}", $output, $returnCode);
                if ($returnCode === 0) {
                    $this->info("✅ Backup compressed: {$filename}.gz");
                }
            }

            // Clean old backups (keep last 10)
            $this->cleanOldBackups($backupDir);

            return Command::SUCCESS;
        } else {
            $this->error('❌ Failed to create backup!');
            $this->error('Make sure mysqldump is installed and accessible from PATH');
            return Command::FAILURE;
        }
    }

    private function cleanOldBackups($directory)
    {
        $files = glob($directory . DIRECTORY_SEPARATOR . 'vocaccion_*.sql');
        if (count($files) > 10) {
            // Sort by modification time (oldest first)
            usort($files, function($a, $b) {
                return filemtime($a) - filemtime($b);
            });
            
            // Delete oldest backups, keep last 10
            $toDelete = array_slice($files, 0, count($files) - 10);
            foreach ($toDelete as $file) {
                unlink($file);
                $this->line("   Deleted old backup: " . basename($file));
            }
        }
    }

    private function formatBytes($bytes, $precision = 2)
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);
        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}
