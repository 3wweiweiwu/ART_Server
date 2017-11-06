$sARTUri='http://mvf1:3000'

#$sARTUri='http://mvf2:3000'

$DebugPreference="Continue"
$DebugPreference='SilentlyContinue'

iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/ARTLibrary.ps1"))
iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/Library.ps1"))
iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/CommonHeader.ps1"))
$taskName=$Task.taskSLMConfiguration

#download installation script form p4
$sInstallerPath="//depot/qe/dev/AUTOMATION/BAF/Shared Features/aspenOneInstaller/AspenOneInstaller/"
$P4_Work_Space_Folder="c:\p4"
Sync-FromP4 -P4_Location_List @($sInstallerPath) -P4_User wuwei -P4_Server hqperforce2:1666 -P4_PASSWORD Changethis19 -P4_Work_Space_Folder $P4_Work_Space_Folder -P4_Work_Space_Name ART


#run slm configuration script
$sSilkInstallerFolder=Convert-P4LocationToWinLocation -P4Location $sInstallerPath -P4_Work_Space_Folder $P4_Work_Space_Folder
$Silk_Installer_Project_File=Join-Path -Path $sSilkInstallerFolder -ChildPath AspenOneInstaller.vtp
$Silk_Installer_Plan_File=Join-Path -Path $sSilkInstallerFolder -ChildPath "\Plan\analyticsSLM.pln"

Run-SilkPlan -Silk_Installer_Project_File $Silk_Installer_Project_File -Silk_Installer_Plan_File $Silk_Installer_Plan_File -iEstimatedProductInstallationTimeInHour 5

Set-NextProject -sARTServerUri $sARTUri -vision $vision -project $projectId                