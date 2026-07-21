# Run this script from inside your GitHub repository folder after copying the new prototype files.
# Example folder:
# C:\Users\hp\Desktop\MY BOTS\AKILISLEEK\homelink-sample

git status
git add .
git commit -m "Build professional property marketplace prototype"
git push origin main

Write-Host "Deployment pushed. If GitHub Pages is configured to main / root, your site will update shortly."
Write-Host "Live URL: https://akilisleek.github.io/homelink-sample/"
