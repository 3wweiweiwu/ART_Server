$sARTUri='http://mvf1:3000'
$taskName="VHD_Detection"
$DebugPreference="Continue"

iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/Library.ps1"))
iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/CommonHeader.ps1"))
$taskName=$Task.installMedia