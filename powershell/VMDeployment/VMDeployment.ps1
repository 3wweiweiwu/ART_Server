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






#2nd load for debugging purpose
if($DebugPreference -eq "Continue"){
    .(Join-Path -Path $sRootFolder -ChildPath ARTLibrary.ps1)
    $sRootFolder=Split-Path -Path ([System.IO.Path]::GetDirectoryName($myInvocation.MyCommand.Definition)) -Parent
    .(Join-Path -Path $sRootFolder -ChildPath (Join-Path -Path "Manager" -ChildPath .\VMDeployment_Library.ps1))

}
#


#load information for current vm
iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/CommonHeader.ps1"))




$sRemoteVmPath=Load-Setting -sARTServerUri $sARTServerUri -project $blueprint -task $taskVMDeployment -key base_vhd_path
$iVmMemorySize=Load-Setting -sARTServerUri $sARTServerUri -project $blueprint -task $taskVMDeployment -key memory_size
$iCPUCores=Load-Setting -sARTServerUri $sARTServerUri -project $blueprint -task $taskVMDeployment -key cpu_cores
$VM_Username=Load-Setting -sARTServerUri $sARTServerUri -project $blueprint -task $taskVMDeployment -key VM_Username
$VM_Pass=Load-Setting -sARTServerUri $sARTServerUri -project $blueprint -task $taskVMDeployment -key VM_Pass

$lsCurrentSchedule=([array](Load-Setting -sARTServerUri $sARTUri -vision $vision -task $Task.mediaDetection -key current_schedule))
$Installation_File=$lsCurrentSchedule[$lsCurrentSchedule.Length-1]


#chose right space for VHD deployment
Write-Host -Object "$((Get-Date).tostring())#chose right space for VHD deployment"
$iVHDSize_Mb=(Get-VHDSize -sARTUri $sARTServerUri -vhdID $sRemoteVmPath)/1024/1024

$diskSelection=Get-VolumeforVHD -sARTUri $sARTUri -machine $env:COMPUTERNAME -disk_size_in_mb $iVHDSize_Mb

$sVHD_Local_Folder=Join-Path -Path ($diskSelection.disk.drive_letter+':') -ChildPath VHD
if((Test-Path -Path $sVHD_Local_Folder) -eq $false)
{
    New-Item -Path $sVHD_Local_Folder -ItemType Directory
}

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
$sDriverLetter=$lastDrive.DriveLetter+":"
$pipe.Dispose()





#copy minimum ART installer to vm image
Write-Host -Object "$((Get-Date).tostring())#copy minimum ART installer to vm image "
$sArt_VHD=Join-Path $sDriverLetter -ChildPath ".\p4\ART\"
if((Test-Path -Path $sArt_VHD) -eq $false)
{
    New-Item -Path $sArt_VHD -ItemType directory    #create ART root folder
}


#copy detected from hqfiler to drive
Write-Host -Object "$((Get-Date).tostring())#copy detected from hqfiler to drive"
Wait-FileAvailable -TimeOut 3600 -Path $Installation_File
$Local_Media_Storage=Join-Path -Path $sDriverLetter -ChildPath p4
if((Test-Path -Path $Local_Media_Storage) -eq $false)
{
    md $Local_Media_Storage
}

Copy-Item -Path $Installation_File -Destination $Local_Media_Storage -Force|Out-Host -Verbose
$sLocal_Media_Path=Join-Path -Path $Local_Media_Storage -ChildPath (Split-Path -Path $Installation_File -Leaf)


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
Write-Host -Object "$((Get-Date).tostring())#Deploy VM"

$VM=Hyper-V\New-VM -VHDPath $sLocalVHDPath -Name $sVMClientId -MemoryStartupBytes $iVmMemorySize
$VM|Hyper-V\Set-VM -ProcessorCount $iCPUCores
Start-Sleep -Seconds 1
$VM|Hyper-V\Start-VM
#wait until VM is off so that we can change the switch
Write-Host -Object "$((Get-Date).tostring())#Configuring VM name"
while($VM.State -ne "Off")
{
       
    Start-Sleep -Seconds 10        
    Write-Host -Object "Wait until VM is off"

}

#connect to virtual switch and make it online
Write-Host -Object "$((Get-Date).tostring())#connect to virtual switch and make it online"
$VM_Switch=Get-VMSwitch
Connect-VMNetworkAdapter -VMName $sVMClientId -SwitchName $VM_Switch.Name
$VM|Hyper-V\Start-VM



