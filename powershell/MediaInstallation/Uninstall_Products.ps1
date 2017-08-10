$sARTUri='http://mvf1:3000'
$taskName="Uninstall_Media"


iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/ARTLibrary.ps1"))
$debugPID=$PID
$computerName=$env:COMPUTERNAME
$projectFeed=Get-SettingForProcess -sARTUri $sARTUri -key ProjectFeed -processId $debugPID -dorm $computerName
$projectDorm="Dorm_$computerName"
$vision=$projectFeed.vision
$blueprint=$projectFeed.blueprint
$projectId=$projectFeed.projectId
$sVMClientId=$projectFeed.vmId




#Start-Process -FilePath (Join-Path -Path $sParentFolder -ChildPath uninstall.exe)
$Product_Uninstall_List=Load-Setting -sARTServerUri $sARTUri -vision $vision -project $blueprint -task $taskName -key 'Product_Uninstall_List'

if($Product_Uninstall_List.Count -eq 0 -or $Product_Uninstall_List[0] -match "all")
{
    Get-WmiObject -Class Win32_Product|Where-Object{$_.Vendor -match "AspenTech"}|ForEach-Object -Process{$_.Uninstall()}|Out-Host

}
else
{
    $UninstallList=$Product_Uninstall_List
    $InstalledProductList=Get-WmiObject -Class Win32_Product|Where-Object{$_.Vendor -match "AspenTech"}
        foreach($InstalledProduct in $InstalledProductList)           
        {
        if($UninstallList.Contains($InstalledProduct.Name))
        {
            $InstalledProduct.Uninstall()
        }
        }
}
            
Set-NextProject -sARTServerUri $sARTUri -vision $vision -project $projectId
Restart-Computer -Force
Start-Sleep -Seconds 3600