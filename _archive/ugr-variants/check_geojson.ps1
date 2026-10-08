$response = Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson' -UseBasicParsing -TimeoutSec 15
$json = $response.Content | ConvertFrom-Json
$features = $json.features
Write-Host "Total features: $($features.Count)"
foreach ($f in $features) {
    $admin = $f.properties.ADMIN
    $iso = $f.properties.ISO_A3
    $name = $f.properties.NAME
    $sov = $f.properties.SOVEREIGNT
    if ($admin -match 'Roman|Moldo|roman|moldo') {
        Write-Host "MATCH => ADMIN: $admin | ISO_A3: $iso | NAME: $name | SOVEREIGNT: $sov"
    }
}
