<?php
file_put_contents('dump2.txt', DB::table('test_results')->latest('id')->first()->result_text);
