#check execution policy
$Status=@{
    ExecutionPolicy=$true
    RunAsAdmin=$true
    HyperVEnabled=$true
    BITSEnabled=$true
}

cls
$policy=Get-ExecutionPolicy
if($policy -match "Unrestricted" -or $policy -match "bypass")
{
    Write-Host -Object "Powershell Execution is unrestricted"
    
}
else
{
    Write-Host -ForegroundColor Red -Object "Powershell execution policy is $policy."
    $Status.ExecutionPolicy=$false    
}


#Check if we are currently running as admin
$wid=[System.Security.Principal.WindowsIdentity]::GetCurrent()
$prp=new-object System.Security.Principal.WindowsPrincipal($wid)
$adm=[System.Security.Principal.WindowsBuiltInRole]::Administrator
$IsAdmin=$prp.IsInRole($adm)
if($IsAdmin)
{
    Write-Host -Object "Admin Check Passed!"
}
else
{
    Write-Host -ForegroundColor Red -Object "Please restart batch file as admin."
    $Status.RunAsAdmin=$false
}

#check if hyper-v is running
$service=Get-Service -Name vmms
if($service.Status -match "Running")
{
    Write-Host -Object "Hyper-V Service is up and running"
}
else
{
    Write-Host -ForegroundColor Red -Object "Please enable hyper-v service before running this script"
    $Status.HyperVEnabled=$false
}

#check if bits service is enabled
$bitService=Get-Service -Name BITS
if($bitService.Status -match "Running")
{
    Write-Host -Object "BITS Service is up and running"
}
else
{
    Write-Host -ForegroundColor Red -Object "Please enable BITS service before running this script"
    $Status.BITSEnabled=$false
}

#send out report
$body=$Status|ConvertTo-Json|ConvertFrom-Json|ConvertTo-Html
Send-MailMessage -From "MVT@aspentech.com" -SmtpServer "smtp.aspentech.local" -Subject "MVT2 Agent has started on $env:COMPUTERNAME" -Body “$body” -To "weiwei.wu@aspentech.com" -BodyAsHtml 
#final check
if(!$Status.ExecutionPolicy -or !$Status.RunAsAdmin -or !$Status.HyperVEnabled)
{
    
    $Status
    Read-Host -Prompt "Fix the issue before start again"
    

}





 