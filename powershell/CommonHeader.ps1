$debugPID=$PID
$computerName=$env:COMPUTERNAME
$projectFeed=Get-SettingForProcess -sARTUri $sARTUri -key ProjectFeed -processId $debugPID -dorm $computerName
$projectDorm="Dorm_$computerName"
$vision=$projectFeed.vision
$blueprint=$projectFeed.blueprint
$projectId=$projectFeed.projectId
$sVMClientId=$projectFeed.vmId
$Host.UI.RawUI.WindowTitle ="$vision==$blueprint==$projectId==$debugPID"

Write-Host -Object "Common Header Loaded!" -ForegroundColor DarkMagenta
Write-Debug -Message $debugPID
Write-Debug -Message $projectFeed