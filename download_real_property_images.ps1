$ErrorActionPreference = "Stop"

$ImageFolder = Join-Path (Get-Location) "assets\images"
New-Item -ItemType Directory -Force -Path $ImageFolder | Out-Null

$Images = @(
    @{ File="hero-kitchen-dining.jpg"; Url="https://images.unsplash.com/photo-1745794621090-d856c53b0cc2?auto=format&fit=crop&fm=jpg&q=80&w=1800" },
    @{ File="family-home-exterior.jpg"; Url="https://images.unsplash.com/photo-1605146769289-440113cc3d00?auto=format&fit=crop&fm=jpg&q=80&w=1800" },
    @{ File="penthouse-living.jpg"; Url="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&fm=jpg&q=80&w=1800" },
    @{ File="suburban-villa-exterior.jpg"; Url="https://images.unsplash.com/photo-1592595896551-12b371d546d5?auto=format&fit=crop&fm=jpg&q=80&w=1800" },
    @{ File="city-apartments.jpg"; Url="https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&fm=jpg&q=80&w=1800" },
    @{ File="colorful-townhouses.jpg"; Url="https://images.unsplash.com/photo-1748228885250-49564b614db9?auto=format&fit=crop&fm=jpg&q=80&w=1800" },
    @{ File="business-towers.jpg"; Url="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&fm=jpg&q=80&w=1800" },
    @{ File="modern-living-dining.jpg"; Url="https://images.unsplash.com/photo-1593696140826-c58b021acf8b?auto=format&fit=crop&fm=jpg&q=80&w=1800" },
    @{ File="marble-kitchen.jpg"; Url="https://images.unsplash.com/photo-1682888813913-e13f18692019?auto=format&fit=crop&fm=jpg&q=80&w=1800" },
    @{ File="master-bedroom.jpg"; Url="https://images.unsplash.com/photo-1635108197330-2f82e7f69111?auto=format&fit=crop&fm=jpg&q=80&w=1800" },
    @{ File="white-bedroom.jpg"; Url="https://images.unsplash.com/photo-1635108197047-add19c9ae680?auto=format&fit=crop&fm=jpg&q=80&w=1800" },
    @{ File="glass-bathroom.jpg"; Url="https://images.unsplash.com/photo-1722153148989-eb70d4ca7dcc?auto=format&fit=crop&fm=jpg&q=80&w=1800" },
    @{ File="bathtub-bathroom.jpg"; Url="https://images.unsplash.com/photo-1609280069865-62f178e2c237?auto=format&fit=crop&fm=jpg&q=80&w=1800" },
    @{ File="double-sink-bathroom.jpg"; Url="https://images.unsplash.com/photo-1722650272383-e46539e9793a?auto=format&fit=crop&fm=jpg&q=80&w=1600" }
)

foreach ($img in $Images) {
    $target = Join-Path $ImageFolder $img.File
    Write-Host "Downloading $($img.File)..." -ForegroundColor Cyan
    Invoke-WebRequest -Uri $img.Url -OutFile $target
}

Write-Host ""
Write-Host "DONE. Real property images saved in: $ImageFolder" -ForegroundColor Green
Write-Host "Now commit and push:" -ForegroundColor Yellow
Write-Host "git add assets/images"
Write-Host 'git commit -m "Add real property images"'
Write-Host "git push origin main"
