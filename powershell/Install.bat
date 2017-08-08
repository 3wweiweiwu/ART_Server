netsh advfirewall set  currentprofile state off
netsh advfirewall set domainprofile state off
netsh advfirewall set privateprofile state off
netsh advfirewall set publicprofile state off
netsh advfirewall set  allprofiles state off


powercfg /change -monitor-timeout-dc 0
powercfg /change -monitor-timeout-ac 0

reg add "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsUpdate\Auto Update" /v AUOptions /t REG_DWORD /d 1 /f 

%windir%\System32\reg.exe ADD HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System /v EnableLUA /t REG_DWORD /d 0 /f

powershell.exe set-executionpolicy unrestricted -Force
powershell.exe Enable-PSRemoting -Force
powershell.exe Set-Item WSMan:\localhost\Client\TrustedHosts * -Force
powershell.exe restart-service winrm -Force
