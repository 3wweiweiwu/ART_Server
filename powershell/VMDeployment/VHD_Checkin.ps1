$sARTUri='http://mvf1:3000'
$taskName="VHD_Checkin"
iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/ARTLibrary.ps1"))

$debugPID=$PID
$computerName=$env:COMPUTERNAME
$projectFeed=Get-SettingForProcess -sARTUri $sARTUri -key ProjectFeed -processId $debugPID -dorm $computerName
$projectDorm="Dorm_$computerName"
$vision=$projectFeed.vision
$blueprint=$projectFeed.blueprint
$projectId=$projectFeed.projectId
$sVMClientId=$projectFeed.vmId


#load installed products from the install_media tas
    $installed_products=Load-Setting -vision $vision -sARTServerUri $sARTUri -project $blueprint -task $Task.taskInstallMedia -key InstalledProductInfo

#If vm is not off, then wait for 1 minutes and turn it of
    $objVm=Hyper-V\Get-VM -Name $sVMClientId

    if($objVm.State -ne "Off")
    {
        Start-Sleep -Seconds 60
        $objVm|Hyper-V\Stop-VM -Force
    }

#check in script to the remote shelf
    Upload-FileToServer -sARTUri $sARTUri -fieldName file -filePath 'C:\temp\a.txt' -otherFieldInfo $installed_products