Write-Host "llmverify Chat Monitor" -ForegroundColor Cyan
Write-Host "Checking server..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:9009/health" -ErrorAction Stop
    Write-Host "Server OK" -ForegroundColor Green
} catch {
    Write-Host "Server not running" -ForegroundColor Red
    exit 1
}
Write-Host "Ready - Copy AI responses" -ForegroundColor Green
$last = ""
while ($true) {
    Start-Sleep -Milliseconds 500
    try {
        $clip = Get-Clipboard -ErrorAction SilentlyContinue
        if ($clip -and $clip -ne $last -and $clip.Length -gt 50) {
            $last = $clip
            Write-Host "Verifying..." -ForegroundColor Cyan
            $body = @{ content = $clip } | ConvertTo-Json
            try {
                $result = Invoke-RestMethod -Uri "http://localhost:9009/verify" -Method POST -ContentType "application/json" -Body $body
                $level = $result.result.risk.level.ToUpper()
                $score = [math]::Round($result.result.risk.overall * 100, 1)
                $color = if ($level -eq "LOW") { "Green" } elseif ($level -eq "MODERATE") { "Yellow" } else { "Red" }
                Write-Host "Verdict: $($result.summary.verdict)" -ForegroundColor $color
                Write-Host "Risk: $level ($score%)" -ForegroundColor $color
            } catch {
                Write-Host "Verification failed" -ForegroundColor Red
            }
        }
    } catch {}
}
