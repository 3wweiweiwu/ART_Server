$sARTUri='http://mvf1:3000'
<#

$sARTUri="http://hqqaeblade02.qae.aspentech.com:3000"

#>

$DebugPreference="Continue"
$DebugPreference='SilentlyContinue'
iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/ARTLibrary.ps1"))
iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/MediaInstallation@MediaInstallationLibrary.ps1"))
iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/Library.ps1"))
iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/CommonHeader.ps1"))


#download installation script form p4

$dependency="//depot/qe/dev/AUTOMATION/Process Explorer/A1PE V10 Selenium 2.53"
$sInstallerPath="//depot/qe/dev/AUTOMATION/BAF/Shared Features/aspenOneInstaller/AspenOneInstaller/"
$P4_Work_Space_Folder="c:\p4"
Sync-FromP4 -P4_Location_List @($sInstallerPath,$dependency) -P4_User wuwei -P4_Server hqperforce2.corp.aspentech.com:1666 -P4_PASSWORD Changethis19 -P4_Work_Space_Folder $P4_Work_Space_Folder -P4_Work_Space_Name ART

$sP4_Path=Convert-P4LocationToWinLocation -P4Location $sInstallerPath -P4_Work_Space_Folder $P4_Work_Space_Folder
$sPostInstall=Join-Path -Path $sP4_Path -ChildPath ".\A1PEMVTEndToEndConfiguration.ps1"

&$sPostInstall|Out-Host

Set-NextProject -sARTServerUri $sARTUri -vision $vision -project $projectId      