$sARTUri='http://mvf1:3000'
$taskName="VHD_Checkin"
iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/ARTLibrary.ps1"))


#iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/CommonHeader.ps1"))


#load installed products from the install_media tas
    $installed_products=Load-Setting -sARTServerUri $sARTUri -project $blueprint -task $Task.installMedia -key InstalledProductInfo
    $vhd_serie=Load-Setting -sARTServerUri $sARTUri -project $blueprint -task $Task.taskVHDCheckin -key vhd_serie
    
#modify the installed series based on check in info
    $installed_products.series=$vhd_serie
    Write-Host -Object "The installation product info are $installed_products"

#If vm is not off, then wait for 1 minutes and turn it of
    $objVm=Hyper-V\Get-VM -Name $sVMClientId

    if($objVm.State -ne "Off")
    {
        Start-Sleep -Seconds 5 -Verbose
        $objVm|Hyper-V\Stop-VM -Force -Verbose
        Start-Sleep -Seconds 60 -Verbose
    }

#check in script to the remote shelf
    Write-Host -Object "$((Get-Date).tostring())# Start VHD upload"
    Upload-FileToServer -sARTUri $sARTUri -fieldName file -filePath $objVm.HardDrives.Path -otherFieldInfo $installed_products
    Write-Host -Object "$((Get-Date).tostring())# Finish VHD upload"

