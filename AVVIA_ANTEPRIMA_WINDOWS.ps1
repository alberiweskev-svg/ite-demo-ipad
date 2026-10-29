$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$prefix = 'http://127.0.0.1:8765/'
$mime = @{ '.html'='text/html; charset=utf-8'; '.js'='text/javascript; charset=utf-8'; '.mjs'='text/javascript; charset=utf-8'; '.css'='text/css; charset=utf-8'; '.json'='application/json'; '.svg'='image/svg+xml'; '.png'='image/png'; '.wasm'='application/wasm'; '.ico'='image/x-icon'; '.webp'='image/webp'; '.jpg'='image/jpeg'; '.jpeg'='image/jpeg'; '.woff2'='font/woff2' }
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)
try {
  $listener.Start()
  Write-Host "Anteprima I.T.E. 4.0: $prefix"
  Write-Host "Per terminare premi CTRL+C o chiudi questa finestra."
  Start-Process $prefix
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $response = $context.Response
    try {
      $relative = [Uri]::UnescapeDataString($context.Request.Url.AbsolutePath).TrimStart('/')
      if ([string]::IsNullOrEmpty($relative)) { $relative = 'index.html' }
      $path = [System.IO.Path]::GetFullPath((Join-Path $root ($relative.Replace('/', [System.IO.Path]::DirectorySeparatorChar))))
      $base = [System.IO.Path]::GetFullPath($root).TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar
      if (-not $path.StartsWith($base, [System.StringComparison]::OrdinalIgnoreCase)) { $response.StatusCode = 403 }
      elseif (-not [System.IO.File]::Exists($path)) { $response.StatusCode = 404 }
      else {
        $ext = [System.IO.Path]::GetExtension($path).ToLowerInvariant()
        $response.ContentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
        $bytes = [System.IO.File]::ReadAllBytes($path)
        $response.ContentLength64 = $bytes.Length
        $response.OutputStream.Write($bytes, 0, $bytes.Length)
      }
    } catch { $response.StatusCode = 500; Write-Warning $_.Exception.Message }
    finally { $response.Close() }
  }
} catch { Write-Error ("Impossibile avviare l'anteprima: " + $_.Exception.Message); exit 1 }
finally { if ($listener.IsListening) { $listener.Stop() }; $listener.Close() }
