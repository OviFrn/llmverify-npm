# Test AI Response with llmverify
# This script shows you how to verify AI outputs in your IDE

Write-Host "`n🔍 Testing llmverify AI Verification`n" -ForegroundColor Cyan

# Test AI response
$aiResponse = "This is a test AI response from Windsurf. We're verifying it works correctly in the IDE!"

Write-Host "📝 AI Response to verify:" -ForegroundColor Yellow
Write-Host "   $aiResponse`n" -ForegroundColor White

Write-Host "⏳ Running verification...`n" -ForegroundColor Yellow

# Call llmverify server
$body = @{ content = $aiResponse } | ConvertTo-Json
$result = Invoke-RestMethod -Uri "http://localhost:9009/verify" -Method POST -ContentType "application/json" -Body $body

# Display human-readable summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "`n📊 VERIFICATION RESULTS`n" -ForegroundColor Cyan -BackgroundColor Black
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# Verdict
$verdict = $result.summary.verdict
if ($verdict -match "✅") {
    Write-Host "   $verdict" -ForegroundColor Green
} elseif ($verdict -match "⚠️") {
    Write-Host "   $verdict" -ForegroundColor Yellow
} else {
    Write-Host "   $verdict" -ForegroundColor Red
}

Write-Host "`n   Risk Level: $($result.summary.riskLevel)" -ForegroundColor White
Write-Host "   Risk Score: $($result.summary.riskScore)`n" -ForegroundColor White

# Explanation
Write-Host "💡 What this means:" -ForegroundColor Cyan
Write-Host "   $($result.summary.explanation)`n" -ForegroundColor White

# Tests run
Write-Host "🧪 Tests Performed:" -ForegroundColor Cyan
foreach ($test in $result.summary.testsRun) {
    Write-Host "   $test" -ForegroundColor White
}

# Findings (if any)
if ($result.summary.findings.Count -gt 0) {
    Write-Host "`n⚠️  Issues Found:" -ForegroundColor Yellow
    foreach ($finding in $result.summary.findings) {
        Write-Host "   [$($finding.severity)] $($finding.message)" -ForegroundColor Yellow
    }
} else {
    Write-Host "`n✅ No issues found!" -ForegroundColor Green
}

# Next steps
Write-Host "`n📋 What to do next:" -ForegroundColor Cyan
$stepNum = 1
foreach ($step in $result.summary.nextSteps) {
    Write-Host "   $stepNum. $step" -ForegroundColor White
    $stepNum++
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# Performance info
Write-Host "Performance: $($result.result.meta.latency_ms)ms" -ForegroundColor Gray
Write-Host "Version: $($result.meta.version)" -ForegroundColor Gray
Write-Host ""
