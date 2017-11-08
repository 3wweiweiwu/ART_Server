$sARTUri='http://mvf1:3000'
#$sARTUri="http://hqqaeblade02:3000"


$DebugPreference="Continue"
$DebugPreference='SilentlyContinue'
iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/ARTLibrary.ps1"))
iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/MediaInstallation@MediaInstallationLibrary.ps1"))
iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/Library.ps1"))
iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/CommonHeader.ps1"))
$taskName=$Task.taskAnalyticsPostConfiguration

#download installation script form p4
$sInstallerPath="//depot/qe/dev/AUTOMATION/AssetAnalytics/PostInstall/"
$P4_Work_Space_Folder="c:\p4"
Sync-FromP4 -P4_Location_List @($sInstallerPath) -P4_User wuwei -P4_Server hqperforce2:1666 -P4_PASSWORD Changethis19 -P4_Work_Space_Folder $P4_Work_Space_Folder -P4_Work_Space_Name ART

$AnalyticsPath=Convert-P4LocationToWinLocation -P4Location $sInstallerPath -P4_Work_Space_Folder $P4_Work_Space_Folder
$sPostInstall=Join-Path -Path $AnalyticsPath -ChildPath ".\postinstall.ps1"

Invoke-Expression -Command $sPostInstall

Set-NextProject -sARTServerUri $sARTUri -vision $vision -project $projectId                