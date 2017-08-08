﻿param(
[string]$sRemoteVmPath="\\wuwei1\d$\VM_Image\en_w2k16_dc_r2_x64_127gb.vhd",
[Int64]$iVmMemorySize=6*1024*1024*1024,
[int]$iCPUCores=4,
[string]$sLocalPath="",
[string]$sVMServerId="1",
[string]$sMediaPath="\\hqfiler\upload$\aspenONEV10.0\APM\V10.0_APM_Suite_173.iso",
[string]$sSettingBase,
[string]$sRemoteARTPath="\\nhqa-w81-q10\C\p4\qe\dev\AUTOMATION\BAF",
[string]$sART_Version="V7",
[string]$PRODUCT_LIST="/Aspen Asset Analytics;/Aspen Fidelis Reliability;/Aspen ProMV;/Aspen Mtell;/Aspen Mtell/Aspen Mtell Suite;/Aspen Mtell/Aspen Mtell Suite/Core Applications and Services (64bit);/Aspen Mtell/Aspen Mtell Suite/Desktop Applications (64bit);/Aspen Mtell/Aspen Mtell Suite/Agent Service (64bit);/Aspen Mtell/Aspen Mtell Suite/Training Service (64bit);/Aspen Mtell/Aspen Mtell Suite/HMI Maintenance Gateway (64bit);/Aspen Mtell/Aspen Mtell Suite/HMI Maintenance Gateway (32bit);/Aspen Mtell/Aspen Mtell Suite/Gateway Server (32bit);/Aspen Mtell/Aspen Mtell EAM Adapters;/Aspen Mtell/Aspen Mtell EAM Adapters/Avantis EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/Cityworks EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/Empac EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/Hansen EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/Infor EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/Oracle JD Edwards EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/Mainsaver EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/Maintenance Connection EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/IBM Maximo EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/MP2 EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/Tabware EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell Sensor Adapters;/Aspen Mtell/Aspen Mtell Sensor Adapters/Honeywell PHD Sensor Adapter (64bit);/Aspen Mtell/Aspen Mtell Sensor Adapters/OpenTSDB Sensor Adapter (64bit);/Aspen Mtell/Aspen Mtell Sensor Adapters/OSIsoft PI Sensor Adapter (64bit);/Aspen Mtell/Aspen Mtell Sensor Adapters/Aptitude Observer Sensor Adapter (64bit);/Aspen Mtell/Aspen Mtell Log Manager;/Aspen Mtell/Aspen Mtell Log Manager/Log Manager (64bit)",
[string]$Product_Folder_In_Installation_Package="aspenONE_V10_APM",
[string]$VM_Username="administrator",
[string]$VM_Pass="Aspen100",
[string]$sProduct_Verification="Mtell,Analytics,ProMV"
)




#this is media detector, it will detect new media and schedule the media when time permits
$sARTUri='http://mvf1:3000'
$sARTServerUri=$sARTUri
$taskMediaDetection="Media_Detection"
$taskVMDeployment="VM_Deployment"
$DebugPreference = "Continue"


$ScheduleMode=@{
    EveryNewMedia="EveryNewMedia"
}
iex ((New-Object System.Net.WebClient).DownloadString("$sARTServerUri/api/ps/VMDeployment_Library.ps1"))
iex ((New-Object System.Net.WebClient).DownloadString("$sARTServerUri/api/ps/ARTLibrary.ps1"))
iex ((New-Object System.Net.WebClient).DownloadString("$sARTServerUri/api/ps/Library.ps1"))
iex ((New-Object System.Net.WebClient).DownloadString("$sARTServerUri/api/ps/VMDeployment_Library.ps1"))





#2nd load for debugging purpose
if($DebugPreference -eq "Continue"){
    .(Join-Path -Path $sRootFolder -ChildPath ARTLibrary.ps1)
    $sRootFolder=Split-Path -Path ([System.IO.Path]::GetDirectoryName($myInvocation.MyCommand.Definition)) -Parent
    .(Join-Path -Path $sRootFolder -ChildPath (Join-Path -Path "Manager" -ChildPath .\VMDeployment_Library.ps1))

}
#

#Get-VM Image



#load information for current vm


$debugPID=$PID
$debugPID=2276
$computerName=$env:COMPUTERNAME

$projectFeed=Get-SettingForProcess -sARTUri $sARTUri -key ProjectFeed -processId $debugPID -dorm $computerName
$projectDorm="Dorm_$computerName"
$vision=$projectFeed.vision
$blueprint=$projectFeed.blueprint
$projectId=$projectFeed.projectId
$sVMClientId=$projectFeed.vmId
#create ui identifier
$Host.UI.RawUI.WindowTitle ="$blueprint==$projectId==$debugPID"




$sRemoteVmPath=Load-Setting -sARTServerUri $sARTServerUri -project $blueprint -task $taskVMDeployment -key base_vhd_path
$iVmMemorySize=Load-Setting -sARTServerUri $sARTServerUri -project $blueprint -task $taskVMDeployment -key memory_size
$iCPUCores=Load-Setting -sARTServerUri $sARTServerUri -project $blueprint -task $taskVMDeployment -key cpu_cores
$PRODUCT_LIST=Load-Setting -sARTServerUri $sARTServerUri -project $blueprint -task $taskVMDeployment -key PRODUCT_LIST
$VM_Username=Load-Setting -sARTServerUri $sARTServerUri -project $blueprint -task $taskVMDeployment -key VM_Username
$VM_Pass=Load-Setting -sARTServerUri $sARTServerUri -project $blueprint -task $taskVMDeployment -key VM_Pass



#chose right space for VHD deployment
Write-Host -Object "#chose right space for VHD deployment"
$iVHDSize_Mb=(Get-VHD $sRemoteARTPath).Size/1024/1024
$diskSelection=Get-VolumeforVHD -sARTUri $sARTUri -machine $env:COMPUTERNAME -disk_size_in_mb $iVHDSize_Mb
$sVHD_Local_Folder=Join-Path -Path ($diskSelection.disk.drive_letter+':') -ChildPath VHD
if((Test-Path -Path $sVHD_Local_Folder) -eq $false)
{
    New-Item -Path $sVHD_Local_Folder -ItemType Directory
}

#clean up related vm if any
Write-Host -Object "#clean up related vm if any"
$VM=$null
$VM=Hyper-V\Get-VM -Name $sVMClientId -ErrorAction SilentlyContinue
if($VM -ne $null){
    #stop VM
    #remove VM
    #Delete hardrive    
    $VM|Hyper-V\Stop-VM -Force
    $sVHDDrive=($VM.HardDrives|Select-Object -First 1).Path
    Return-VHDSpace -sARTUri $sARTUri -machine $env:COMPUTERNAME -vhd_Path $sVHDDrive    
    $VM|Hyper-V\Remove-VM -Force
    Remove-Item -Path $sVHDDrive -Force
    
}

#copy vhd to local vhd folder

Write-Host -Object "#copy vhd to local vhd folder"
$sExtension=(Get-Item -Path $sRemoteVmPath).Extension
$sVHDName=$sVMClientId+$sExtension   #Create a new name for vhd based on VM name
$sLocalVHDPath=Join-Path -Path $sVHD_Local_Folder -ChildPath $sVHDName
Start-BitsTransfer -Source $sRemoteVmPath -Destination $sLocalVHDPath -Description "Copy VHD from $sRemoteVmPath to $sLocalPath"


#mount the vhd and get the drive letter of VHD
Write-Host -Object "mount the vhd and get the drive letter of VHD"
Dismount-VHD -Path $sLocalVHDPath -ErrorAction SilentlyContinue
$pipe=Wait-PipelineFree -Pipelinename "ART_Mount_VHD" -iTimeout 600 #block while mounting vhd
$VHDObj=Mount-VHD -Path $sLocalVHDPath -Passthru
Get-Disk|where{$_.OperationalStatus -eq "Offline"}|foreach{Set-Disk -InputObject $_ -IsOffline:$false}
$lastDrive= $VHDObj|Get-Disk|Get-Partition|Select-Object -Last 1
$sDriverLetter=$lastDrive.DriveLetter+":"
$pipe.Dispose()




#copy minimum ART installer to vm image
Write-Host -Object "copy minimum ART installer to vm image "
$sArt_VHD=Join-Path $sDriverLetter -ChildPath ".\p4\ART\"
if((Test-Path -Path $sArt_VHD) -eq $false)
{
    New-Item -Path $sArt_VHD -ItemType directory    #create ART root folder
}

$VMSetting=@{
    ND_User="corp\svc-mvfwAdmin"
    ND_Password='7by$O3qI'
    VM_Username="Administrator"
    VM_Password="Aspen100"
    VM_Name=$sVMClientId
}
$sVMSettingPath=Join-Path -Path $sArt_VHD -ChildPath setting.json
$VMSetting|ConvertTo-Json -Depth 999|Out-File -FilePath $sVMSettingPath -Force
$sVMManagerUri="$sARTServerUri/api/ps/VMManager.ps1"
$lsVMManagerContent=(New-Object System.Net.WebClient).DownloadString($sVMManagerUri)
$sVmManagerPathInVM=Join-Path -Path $sArt_VHD -ChildPath VMManager.ps1
$lsVMManagerContent|Out-File -FilePath $sVmManagerPathInVM -Force
'powershell "..\..\..\..\..\..\p4\art\VMManager.ps1"'|Out-File -FilePath (Join-Path $sDriverLetter -ChildPath "\ProgramData\Microsoft\Windows\Start Menu\Programs\StartUp\startVMManager.bat") -Encoding ascii


Dismount-VHD -Path $sLocalVHDPath

#deploy VM
Write-Host -Object "Deploy VM"

$VM=Hyper-V\New-VM -VHDPath $sLocalVHDPath -Name $sVMClientId -MemoryStartupBytes $iVmMemorySize
$VM|Hyper-V\Set-VM -ProcessorCount $iCPUCores
$VM|Hyper-V\Start-VM
#wait until VM is off so that we can change the switch
Write-Host -Object "Configuring VM name"
while($VM.State -ne "Off")
{
       
    Start-Sleep -Seconds 10        
    Write-Host -Object "Wait until VM is off"

}

#connect to virtual switch and make it online
Write-Host -Object "#connect to virtual switch and make it online"
$VM_Switch=Get-VMSwitch
Connect-VMNetworkAdapter -VMName $sVMClientId -SwitchName $VM_Switch.Name
$VM|Hyper-V\Start-VM


#create a dummy project in the server and assign the host to newly-created VM