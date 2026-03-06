<?php
use Illuminate\Support\Facades\DB;
$res = DB::table('test_results')->latest('id')->first();
if ($res) {
    file_put_contents('latest.txt', $res->result_text);
    echo "Saved to latest.txt";
} else {
    echo "NO RESULTS";
}
