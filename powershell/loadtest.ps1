#Start-Process -FilePath powershell.exe -ArgumentList '-ExecutionPolicy Bypass C:\Users\Administrator\ARTServer\powershell\loadtest.ps1'

#Start-Process -FilePath powershell.exe -ArgumentList "-ExecutionPolicy Bypass -Command `"iex ((New-Object System.Net.WebClient).DownloadString('http://mvf1:3000/api/ps/VMDeployment@VMDeployment_Library.ps1')"
iex ((New-Object System.Net.WebClient).DownloadString('http://mvf1:3000/api/ps/VMDeployment@VMDeployment_Library.ps1'))
Read-Host

