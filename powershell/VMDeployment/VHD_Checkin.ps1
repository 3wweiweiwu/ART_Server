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


