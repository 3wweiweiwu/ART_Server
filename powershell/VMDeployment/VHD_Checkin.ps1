$sARTUri='http://mvf1:3000'
$taskName="VHD_Checkin"
iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/ARTLibrary.ps1"))

iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/CommonHeader.ps1"))


#load installed products from the install_media tas
    $installed_products=Load-Setting -sARTServerUri $sARTUri -project $blueprint -task $Task.installMedia -key InstalledProductInfo

#If vm is not off, then wait for 1 minutes and turn it of
    $objVm=Hyper-V\Get-VM -Name $sVMClientId

    if($objVm.State -ne "Off")
    {
        Start-Sleep -Seconds 60
        $objVm|Hyper-V\Stop-VM -Force
    }

#check in script to the remote shelf
    Write-Host -Object "Start VHD upload"
    Upload-FileToServer -sARTUri $sARTUri -fieldName file -filePath $objVm.HardDrives.Path -otherFieldInfo $installed_products
    Write-Host -Object "Finish VHD upload"

