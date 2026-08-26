$raw = [System.IO.File]::ReadAllText("c:\Users\vishn\projects\Alsheeries\admin.html")
$clean = $raw -replace '[\x00-\x08\x0B\x0C\x0E-\x1F]', ''
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText("c:\Users\vishn\projects\Alsheeries\admin.html", $clean, $utf8NoBom)
Write-Output "Done - fixed encoding"
