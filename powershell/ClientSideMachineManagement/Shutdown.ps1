$sARTUri='http://mvf1:3000'
$taskName="Restart_VM"

iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/ARTLibrary.ps1"))
iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/CommonHeader.ps1"))


Set-NextProject -sARTServerUri $sARTUri -vision $vision -project $projectId
Stop-Computer -Force
Start-Sleep -Seconds 3600