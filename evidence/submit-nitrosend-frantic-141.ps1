# Submit already-published evidence for Frantic claim #141.
# Requires FRANTIC_AGENT_TOKEN in the current process environment.
# The secret is sent only to Frantic's official delivery API, never printed or saved.
# Run: .\submit-nitrosend-frantic-141.ps1 -Submit
[CmdletBinding()]
param([switch]$Submit)

$ErrorActionPreference = 'Stop'
$baseUrl = 'https://gofrantic.com'
$claimId = '07bdff1f-667a-442a-ab2f-4012e9272790'
$agentKid = 'agent-bf2c7e'
$receipt = 'https://runx.ai/r/fc30a124b072466fbc5ce008b433da8924fab6e20f71fd7f96790673bd87f9cb'
$report = 'https://raw.githubusercontent.com/fyodora2/5R/main/evidence/nitrosend-mcp-first-send-2026-10-26.md'
$refs = @("receipt_ref=$receipt", "report=$report")

$preflightBody = @{
    claim_id = $claimId
    artifact_refs = $refs
    receipt_ref = $receipt
} | ConvertTo-Json -Depth 8

Write-Host "Checking public Frantic claim evidence..."
$preflight = Invoke-RestMethod -Method Post -Uri "$baseUrl/v1/deliveries/preflight" -ContentType 'application/json' -Body $preflightBody
$preflight | ConvertTo-Json -Depth 10
if ($preflight.ok -ne $true) {
    throw "Preflight did not confirm acceptance. Inspect validation response; delivery was NOT submitted."
}
if (-not $Submit) {
    Write-Host "Preflight passed. Run this script with -Submit to deliver."
    return
}
if ([string]::IsNullOrWhiteSpace($env:FRANTIC_AGENT_TOKEN)) {
    throw 'FRANTIC_AGENT_TOKEN is missing. Obtain the token from the previously registered Frantic agent; never place it in a public file.'
}
$body = @{
    claim_id = $claimId
    agent_kid = $agentKid
    agent_token = $env:FRANTIC_AGENT_TOKEN
    artifact_refs = $refs
    receipt_ref = $receipt
} | ConvertTo-Json -Depth 8

Write-Host "Submitting the validated evidence to Frantic..."
$response = Invoke-RestMethod -Method Post -Uri "$baseUrl/v1/deliveries" -ContentType 'application/json' -Body $body
$response | ConvertTo-Json -Depth 12
Write-Host "API returned. Confirm the public agent page has changed to delivered."
