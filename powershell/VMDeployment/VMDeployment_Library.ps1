iex ((New-Object System.Net.WebClient).DownloadString("$sARTServerUri/api/ps/Library.ps1"))
iex ((New-Object System.Net.WebClient).DownloadString("$sARTServerUri/api/ps/ARTLibrary.ps1"))
function Get-CompatibleDriveForVM([string]$sRemoteVmPath)
{
    [OutputType([String])]
    #calculate required size for VM
    $vhd=Get-VHD -Path $sRemoteVmPath
    $iVmMaxSizeInByte=$vhd.Size
    $iVmFileSizeInByte=$vhd.FileSize
    $iVmStorageSize=($iVmMaxSizeInByte+$iVmFileSizeInByte)/2+2.5*1024*1024*1024

    #sort out the drive with enough space
    $sResult=$null
    $drive=Get-Volume|where{$_.SizeRemaining -gt $iVmStorageSize}|Sort-Object -Property SizeRemaining|Select-Object -First 1
    if($drive -ne $null)
    {
        $sResult=$drive.DriveLetter+":"
        $sResult=Join-Path -Path $sResult -ChildPath "VM_Image"
        if((Test-Path -Path $sResult) -eq $false)
        {
            New-Item -ItemType Directory -Path $sResult|Out-Null
        }
    }

    return [string]$sResult
}

function Get-VirtualSwitch()
{
    
    #if there is existing ART virtual switch, then we are going to quit
    $ART_Switch=(Get-NetAdapter|where{$_.DriverDescription -eq "Hyper-V Virtual Ethernet Adapter"}|Select-Object -First 1)
    if($ART_Switch -ne $null)
    {
        return $ART_Switch
    }
    
    $ethernet=Get-NetAdapter -Name Ethernet
    
    $ART_Switch=New-VMSwitch -Name $ART_Switch_Name -NetAdapterName $ethernet.Name -AllowManagementOS $true

}