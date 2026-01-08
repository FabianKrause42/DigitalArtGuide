# PowerShell Version Bump Script für Windows
# Führe dieses Script vor jedem git commit aus

$VERSION_FILE = "version.js"
$NEW_VERSION = Get-Date -Format "yyyyMMdd.HHmm"
$BUILD_DATE = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

Write-Host "Updating version to: $NEW_VERSION" -ForegroundColor Green

# Update version.js
@"
// Version der App - Bei jeder Änderung erhöhen!
export const APP_VERSION = '$NEW_VERSION';
export const BUILD_DATE = '$BUILD_DATE';
"@ | Out-File -FilePath $VERSION_FILE -Encoding UTF8

# Update index.html
(Get-Content "index.html" -Raw) -replace '\?v=[0-9.]+', "?v=$NEW_VERSION" | Set-Content "index.html" -NoNewline

# Update manifest.json  
(Get-Content "manifest.json" -Raw) -replace '"version": "[0-9.]+"', "`"version`": `"$NEW_VERSION`"" | Set-Content "manifest.json" -NoNewline

# Update sw.js
(Get-Content "sw.js" -Raw) -replace "const CACHE_VERSION = '[0-9.]+';", "const CACHE_VERSION = '$NEW_VERSION';" | Set-Content "sw.js" -NoNewline

Write-Host "✓ Version updated to $NEW_VERSION" -ForegroundColor Green
Write-Host "✓ Ready for commit" -ForegroundColor Green
