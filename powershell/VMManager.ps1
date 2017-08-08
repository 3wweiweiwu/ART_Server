#this is the script that runs to setupthe VM
function Set-StartupUser{
    param(
        [string]$sUsername,
        [string]$sPassword,
        [string]$Domain=$env:COMPUTERNAME
    )
    if($Domain -notmatch("\\$"))
    {
        $Domain+=$Domain+"\"
    }
    if($sUsername -notmatch "\\")
    {
        $sUsername=$Domain+$sUsername
    }

    Set-ItemProperty -Path 'HKLM:\SOFTWARE\Microsoft\Terminal Server Client' -Name AuthenticationLevelOverride -Value 0 -ErrorAction SilentlyContinue
    New-ItemProperty -Path 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon' -Name AutoAdminLogon -Value 1 -ErrorAction SilentlyContinue
    Set-ItemProperty -Path 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon' -Name AutoAdminLogon -Value 1 -ErrorAction SilentlyContinue
    New-ItemProperty -Path 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon' -Name DefaultUserName -Value "$sUsername" -ErrorAction SilentlyContinue
    Set-ItemProperty -Path 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon' -Name DefaultUserName -Value "$sUsername" -ErrorAction SilentlyContinue
    New-ItemProperty -Path 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon' -Name DefaultPassword -Value "$sPassword" -ErrorAction SilentlyContinue
    Set-ItemProperty -Path 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon' -Name DefaultPassword -Value "$sPassword" -ErrorAction SilentlyContinue
}



$sARTUri='http://mvf1:3000'
$sARTServerUri=$sARTUri
$machineManagerPath=$sARTUri+"/api/ps/MachineManager.ps1"
$installBatchPath=$sARTUri+"/api/ps/install.bat"


$sParentFolder=([System.IO.Path]::GetDirectoryName($myInvocation.MyCommand.Definition))
$sSettingPath=Join-Path -Path $sParentFolder -ChildPath 'setting.json'
$sSetting=[string](Get-Content -Path $sSettingPath)
$SETTING=$sSetting|ConvertFrom-Json

$ND_User=$SETTING.ND_User
$passWord=ConvertTo-SecureString -String $SETTING.ND_Password -AsPlainText -Force
$Cred=New-Object -TypeName System.Management.Automation.PSCredential -ArgumentList $ND_User,$passWord
$sVMname=$SETTING.VM_Name
#check if current machine name match with expected machine name from setting.ini

if ($sVMname -ne $null -and $env:COMPUTERNAME -ne $sVMname)
{    
    #change startup credential
    $VM_Username=$SETTING.VM_Username
    $VM_Password=$SETTING.VM_Password
    Set-StartupUser -sUsername $VM_Username -sPassword $VM_Password -Domain $sVMname

    #shutdown the machine if it is first time the machine runs
    Rename-Computer -NewName $sVMname -DomainCredential $Cred -Force   
    
    Stop-Computer -Force
    Start-Sleep -Seconds 3600
}
Start-Process -FilePath powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command `"iex ((New-Object System.Net.WebClient).DownloadString('$machineManagerPath'))`"" -PassThru
Start-Process -FilePath powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command `"iex ((New-Object System.Net.WebClient).DownloadString('$installBatchPath'))`"" -PassThru
