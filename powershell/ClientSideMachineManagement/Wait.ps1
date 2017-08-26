﻿$sARTUri='http://mvf1:3000'
$taskName="Wait"

iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/ARTLibrary.ps1"))
iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/CommonHeader.ps1"))

Write-Host -Object "Wait for 1 min...."
Start-Sleep -Seconds 60


Set-NextProject -sARTServerUri $sARTUri -vision $vision -project $projectId