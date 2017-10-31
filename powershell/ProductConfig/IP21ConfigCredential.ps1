$sARTUri='http://mvf1:3000'

$DebugPreference="Continue"
$DebugPreference='SilentlyContinue'
iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/ARTLibrary.ps1"))
iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/MediaInstallation@MediaInstallationLibrary.ps1"))
iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/Library.ps1"))
iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/CommonHeader.ps1"))
$taskName=$Task.taskIP21CredentialConfiguration




Import-Module ServerManager
Add-WindowsFeature Web-Scripting-Tools
Import-Module WebAdministration

$sUserName="$($env:COMPUTERNAME)\administrator"

#change service credential
$serviceList=@("AtAuditAndComplianceServer","CimTskSrvgroup200","CalculatorServerService")
foreach($serviceName in $serviceList)
{
    $service=Get-WmiObject -Class win32_service -ComputerName $env:COMPUTERNAME|where{$_.name -match $serviceName}
    $service.Change($null,$null,$null,$null,$null,$null,"$sUserName","Aspen100")
    $service.StopService()
    $service.StartService()

}

#change app pool setting
$appPoolList=@('AspenAnalyticsAppPool','AspenProcessDataAppPool','AspenProcessDataAppPoolx64')
foreach($app in $appPoolList)
{
    Set-ItemProperty -Path "IIS:\AppPools\$app" -Name processModel -Value @{userName="$sUserName";password='Aspen100';identitytype=3}
    Restart-WebAppPool -Name $app -Verbose
}

#change ip21 machine name
Start-Process -FilePath 'C:\Program Files\AspenTech\InfoPlus.21\db21\code\IP21Rename.exe' -ArgumentList "-nq" -WorkingDirectory 'C:\Program Files\AspenTech\InfoPlus.21\db21\code\' -Wait

#configuration is done. Move on to next
Set-NextProject -sARTServerUri $sARTUri -vision $vision -project $projectId