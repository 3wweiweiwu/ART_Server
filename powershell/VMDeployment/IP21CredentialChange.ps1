$service=Get-WmiObject -Class win32_service -ComputerName $env:COMPUTERNAME|where{$_.name -match "CimTskSrvgroup200"}
$service.Change($null,$null,$null,$null,$null,$null,"$($env:COMPUTERNAME)\administrator","Aspen100")
$service.StopService()
$service.StartService()

