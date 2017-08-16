$sARTUri='http://mvf1:3000'
$taskName="Wait"

Start-Sleep -Seconds 60
Set-NextProject -sARTServerUri $sARTUri -vision $vision -project $projectId