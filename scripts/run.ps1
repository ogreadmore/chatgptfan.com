param(
  [Parameter(Position=0)][string]$Task = 'verify',
  [Parameter(ValueFromRemainingArguments=$true)][string[]]$TaskArgs
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$portableNode = Join-Path $projectRoot 'output\toolchain\node-v24.22.1-win-x64'
$oldPath = $env:PATH
Push-Location -LiteralPath $projectRoot
try {
  if (Test-Path -LiteralPath (Join-Path $portableNode 'npm.cmd')) { $env:PATH = $portableNode + ';' + $env:PATH }
  $npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
  if (-not $npmCommand) { throw 'npm is unavailable. Follow docs/operations.md to provision the official Node 24 toolchain.' }
  & $npmCommand.Source run $Task -- @TaskArgs
  $result = $LASTEXITCODE
} finally {
  $env:PATH = $oldPath
  Pop-Location
}
exit $result
