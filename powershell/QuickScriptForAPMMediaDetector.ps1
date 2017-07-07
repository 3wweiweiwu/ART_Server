iex ((New-Object System.Net.WebClient).DownloadString("$sARTServerUri/api/ps/ARTLibrary.ps1"))
iex ((New-Object System.Net.WebClient).DownloadString("$sARTServerUri/api/ps/Library.ps1"))
$sARTUri='http://mvf1:3000'
Write-Setting -sARTServerUri $sARTUri -project APM_Media_Detection -task Media_Detection -key Media_Folder_Snapshot -value "Run"
Write-Setting -sARTServerUri $sARTUri -project APM_Media_Detection -task Media_Detection -key schedule_mode -value "EveryNewMedia"
Write-Setting -sARTServerUri $sARTUri -project APM_Media_Detection -task Media_Detection -key current_schedule -value " "