﻿$sARTUri='http://mvf1:3000'
$taskName="Uninstall_Products"
iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/ARTLibrary.ps1"))
iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/CommonHeader.ps1"))
<#
$debugPID=$PID
$computerName=$env:COMPUTERNAME
$projectFeed=Get-SettingForProcess -sARTUri $sARTUri -key ProjectFeed -processId $debugPID -dorm $computerName
$projectDorm="Dorm_$computerName"
$vision=$projectFeed.vision
$blueprint=$projectFeed.blueprint
$projectId=$projectFeed.projectId
$sVMClientId=$projectFeed.vmId
#>



#Start-Process -FilePath (Join-Path -Path $sParentFolder -ChildPath uninstall.exe)

$Product_Uninstall_List=Load-Setting -sARTServerUri $sARTUri -project $blueprint -task $taskName -key 'Product_Uninstall_List'

if($Product_Uninstall_List.Count -eq 0 -or $Product_Uninstall_List[0] -match "all")
{
    Write-Host -Object "About to uninstall alll Aspen Products"
    Get-WmiObject -Class Win32_Product|Where-Object{$_.Vendor -match "AspenTech"}|ForEach-Object -Process{$_.Uninstall()}|Out-Host

}
else
{
    $UninstallList=$Product_Uninstall_List
    Write-Host -Object "About to uninstall all $UninstallList"
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


