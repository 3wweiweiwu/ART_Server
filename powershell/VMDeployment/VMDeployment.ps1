﻿<#
param(
    [string]$sRemoteVmPath="",
    [int64]$iVmMemorySize=4*1024*1024*1024,
    [int64]$iCPUCores=4,
    [string]$VM_Username="administrator",
    [string]$VM_Pass="Aspen100",
    [array]$lsCurrentSchedule=@(),
    [string]$sVMClientId="mvt"

)
#>
#this is media detector, it will detect new media and schedule the media when time permits
$sARTUri="http://mvf1:3000"
$sARTServerUri=$sARTUri
$taskMediaDetection="Media_Detection"
$taskVMDeployment="taskDeployStandardVHDImage"
#$DebugPreference = "Continue"


$ScheduleMode=@{
    EveryNewMedia="EveryNewMedia"
}
iex ((New-Object System.Net.WebClient).DownloadString("$sARTServerUri/api/ps/VMDeployment@VMDeployment_Library.ps1"))
iex ((New-Object System.Net.WebClient).DownloadString("$sARTServerUri/api/ps/ARTLibrary.ps1"))
iex ((New-Object System.Net.WebClient).DownloadString("$sARTServerUri/api/ps/Library.ps1"))



$taskVMDeployment=$Task.taskVMDeployment


#2nd load for debugging purpose
if($DebugPreference -eq "Continue"){
    .(Join-Path -Path $sRootFolder -ChildPath ARTLibrary.ps1)
    $sRootFolder=Split-Path -Path ([System.IO.Path]::GetDirectoryName($myInvocation.MyCommand.Definition)) -Parent
    .(Join-Path -Path $sRootFolder -ChildPath (Join-Path -Path "Manager" -ChildPath .\VMDeployment_Library.ps1))

}
#


#load information for current vm


$sRemoteVmPath=""
if($sRemoteVmPath -eq "")
{
    #iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/CommonHeader.ps1"))
    $sRemoteVmPath=Load-Setting -sARTServerUri $sARTServerUri -vision $vision -task $taskVMDeployment -key base_vhd_path    
    $Email_List=Load-Setting -sARTServerUri $sARTServerUri -project $blueprint -task $taskVMDeployment -key Email_List -LoadOnce
    $iVmMemorySize=Load-Setting -sARTServerUri $sARTServerUri -project $blueprint -task $taskVMDeployment -key memory_size
    $iCPUCores=Load-Setting -sARTServerUri $sARTServerUri -project $blueprint -task $taskVMDeployment -key cpu_cores
    $VM_Username=Load-Setting -sARTServerUri $sARTServerUri -project $blueprint -task $taskVMDeployment -key VM_Username
    $VM_Pass=Load-Setting -sARTServerUri $sARTServerUri -project $blueprint -task $taskVMDeployment -key VM_Pass
    $lsCurrentSchedule=([array](Load-Setting -sARTServerUri $sARTUri -vision $vision -task $Task.mediaDetection -key current_schedule))
    $Installation_File=$lsCurrentSchedule[$lsCurrentSchedule.Length-1]
}
else
{
    $Installation_File=$null
}




#chose right space for VHD deployment
Write-Host -Object "$((Get-Date).tostring())#chose right space for VHD deployment"
$iVHDSize_Mb=(Get-VHDSize -sARTUri $sARTServerUri -vhdID $sRemoteVmPath)/1024/1024*1.5

#$diskSelection=Get-VolumeforVHD -sARTUri $sARTUri -machine $env:COMPUTERNAME -disk_size_in_mb $iVHDSize_Mb
#$sVHD_Local_Folder=
$diskSelection=Get-CurrentDiskProfile|Sort-Object SizeRemaining -Descending|Select-Object -First 1
$sVHD_Local_Folder=Join-Path -Path ($diskSelection.DriveLetter+':') -ChildPath VHD

if((Test-Path -Path $sVHD_Local_Folder) -eq $false)
{
    New-Item -Path $sVHD_Local_Folder -ItemType Directory
}

#clean up dorm info in the server
Remove-Dorm -sARTUri $sARTUri -dormName $sVMClientId


#clean up related vm if any
Write-Host -Object "$((Get-Date).tostring())#clean up related vm if any"
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


#clean up dorm information for the related vm


#copy vhd to local vhd folder

Write-Host -Object "$((Get-Date).tostring())#copy vhd to local vhd folder"
$sExtension=(Get-VHDFromServer -sARTUri $sARTUri -vhdID $sRemoteVmPath).storage.originalname
$sVHDName=([guid]::NewGuid()).Guid+"_"+$sExtension   #Create a new name for vhd based on VM name
$sLocalVHDPath=Join-Path -Path $sVHD_Local_Folder -ChildPath $sVHDName
Download-VHD -sARTUri $sARTUri -imageId $sRemoteVmPath -localPath $sLocalVHDPath




#mount the vhd and get the drive letter of VHD
Write-Host -Object "$((Get-Date).tostring())#mount the vhd and get the drive letter of VHD"
Dismount-VHD -Path $sLocalVHDPath -ErrorAction SilentlyContinue
$pipe=Wait-PipelineFree -Pipelinename "ART_Mount_VHD" -iTimeout 600 #block while mounting vhd
$VHDObj=Mount-VHD -Path $sLocalVHDPath -Passthru
Get-Disk|where{$_.OperationalStatus -eq "Offline"}|foreach{Set-Disk -InputObject $_ -IsOffline:$false}
$lastDrive= $VHDObj|Get-Disk|Get-Partition|Select-Object -Last 1
$firstDrive=$VHDObj|Get-Disk|Get-Partition|Select-Object -First 1
$sDriverLetter=$lastDrive.DriveLetter+":"
$pipe.Dispose()





#copy minimum ART installer to vm image
Write-Host -Object "$((Get-Date).tostring())#copy minimum ART installer to vm image "
$sArt_VHD=Join-Path $sDriverLetter -ChildPath ".\p4\ART\"
if((Test-Path -Path $sArt_VHD) -eq $false)
{
    New-Item -Path $sArt_VHD -ItemType directory    #create ART root folder
}


#copy detected media from hqfiler to drive
if($Installation_File -ne $null -and (Test-Path -Path $Installation_File))
{
    Write-Host -Object "$((Get-Date).tostring())#copy detected from hqfiler to drive"
    Wait-FileAvailable -TimeOut 3600 -Path $Installation_File
    $Local_Media_Storage=Join-Path -Path $sDriverLetter -ChildPath p4
    if((Test-Path -Path $Local_Media_Storage) -eq $false)
    {
        md $Local_Media_Storage
    }

    Copy-Item -Path $Installation_File -Destination $Local_Media_Storage -Force -Verbose
    $sLocal_Media_Path=Join-Path -Path $Local_Media_Storage -ChildPath (Split-Path -Path $Installation_File -Leaf)
}




$VMSetting=@{
    ND_User="corp\svc-mvfwAdmin"
    ND_Password='7by$O3qI'
    VM_Username=$VM_Username
    VM_Password=$VM_Pass
    VM_Name=$sVMClientId
}
$sVMSettingPath=Join-Path -Path $sArt_VHD -ChildPath setting.json
$VMSetting|ConvertTo-Json -Depth 50|Out-File -FilePath $sVMSettingPath -Force
$sVMManagerUri="$sARTServerUri/api/ps/VMManager.ps1"
$lsVMManagerContent=(New-Object System.Net.WebClient).DownloadString($sVMManagerUri)
$sVmManagerPathInVM=Join-Path -Path $sArt_VHD -ChildPath VMManager.ps1
$lsVMManagerContent|Out-File -FilePath $sVmManagerPathInVM -Force
'powershell "..\..\..\..\..\..\p4\art\VMManager.ps1"'|Out-File -FilePath (Join-Path $sDriverLetter -ChildPath "\ProgramData\Microsoft\Windows\Start Menu\Programs\StartUp\startVMManager.bat") -Encoding ascii

#fix boot section in case of any error
Write-Host "$((Get-Date).tostring())#fix boot section in case of any error"
$sBootDriveLetter=$firstDrive.DriveLetter+":"
$sWindowsDirectory=Join-Path -Path $sDriverLetter -ChildPath Windows
&bcdboot.exe $sWindowsDirectory /s $sBootDriveLetter /f ALL|Out-Host


Dismount-VHD -Path $sLocalVHDPath

#deploy VM
Write-Host -Object "$((Get-Date).tostring())#Deploy VM"

$VM=Hyper-V\New-VM -VHDPath $sLocalVHDPath -Name $sVMClientId -MemoryStartupBytes $iVmMemorySize
$VM|Hyper-V\Set-VM -ProcessorCount $iCPUCores
Start-Sleep -Seconds 1
$VM|Hyper-V\Start-VM
#wait until VM is off so that we can change the switch
Write-Host -Object "$((Get-Date).tostring())#Configuring VM name"

$startDate=Get-Date
while($VM.State -ne "Off")
{
       
    Start-Sleep -Seconds 10        
    $Duration=((Get-Date)-$startDate).TotalMinutes
    Write-Progress -Activity "Waiting for VM to be off. Have been waiting for $Duration min"

}

#connect to virtual switch and make it online
Write-Host -Object "$((Get-Date).tostring())#connect to virtual switch and make it online"
$VM_Switch=Get-VirtualSwitch
$switchName=($VM_Switch.Name -replace "vEthernet (\w*)","")
$iLength=$switchName.Length
$switchName=$switchName.Substring(1,$iLength-2)

Connect-VMNetworkAdapter -VMName $sVMClientId -SwitchName $switchName
$VM|Hyper-V\Start-VM

#vm deployment is done, send out email notification

$vhdInfo=Get-VHDFromServer -sARTUri $sARTUri -vhdID $sRemoteVmPath

$productTable=$vhdInfo.content.installed_products|where{$_.Name -match "aspen" -or $_.Name -match "analytics"}|Select-Object name,build|ConvertTo-Html -As Table

$mediaInfo=$vhdInfo.content.installed_media.name
Write-Host -Object "Wait for 180s so that we can get ip information"
Start-Sleep -Seconds 240

$IPAddress=[string]($VM.NetworkAdapters[0].IPAddresses)

$content="
Hello All,<br>
    <br>
    Thank you very much for using automatic media deployment service from quality team. The following products has been installed into the machine automatically. You can log in right now.<br>
    <br>
    <br>
    Action Performed:<br>
    1. Clean up environment<br>
    2. Download VHD image with media installed<br>
    3. Deploy VHD based on user spec<br>
    4. Perform post-deployment configuration if any<br>
    5. Send out notification email<br>
    <br>
    <br>
    Installed Media: $mediaInfo <br>
    <br>
    Machine name: $sVMClientId ($IPAddress) <br>
    <br>
    Username: $sVMClientId\administrator <br>
    <br>
    Password: Aspen100 <br>
    <br>

Best,<br>
<br>
Automation Team<br>
<br>
Installed Products: <br>
<br>
$productTable

"

Send-MailMessage -From "MVT@aspentech.com" -SmtpServer "smtp.aspentech.local" -Subject "VM Deployment is ready for $blueprint" -Body $content -To $Email_List -BodyAsHtml


