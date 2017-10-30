$sARTUri='http://mvf1:3000'
$taskName="VHD Detection"
$DebugPreference="Continue"
$DebugPreference='SilentlyContinue'
iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/Library.ps1"))
iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/ARTLibrary.ps1"))
iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/CommonHeader.ps1"))


while($true)
{
    
    #load series info    
    $seriesName=Load-Setting -sARTServerUri $sARTUri -project $blueprint -task $taskName -key series
    Write-Progress -Activity "Checking VHD Status $(Get-Date) for $seriesName"

    #get vhd feed
    $lsVhdFeed=[array](Get-VHDFeedForVision -sARTUri $sARTUri -seriesName $seriesName -visionName $vision)

    #get right vhd
    $iFeedLength=$lsVhdFeed.Length
    if($iFeedLength -eq 0)
    {
        
        Start-Sleep -Milliseconds ([int]($iTimeout*10))
        continue

    }
    
    #detect new vhd,then schedule it and move forward
    $vhdFeed=$lsVhdFeed[$iFeedLength-1]
    if($vhdFeed._id -eq $null)
    {
        continue
    }


    Write-Host -Object "new VHD:[$($vhdFeed._id)] is detected for series [$seriesName]" -ForegroundColor DarkGreen
    Write-Setting -sARTServerUri $sARTUri -vision $vision -task $Task.taskVMDeployment -key base_vhd_path -value $vhdFeed._id
    Write-Setting -sARTServerUri $sARTUri -vision $vision -task $Task.mediaDetection -key current_schedule -value ""
    Set-NextProject -vision $vision -project $projectId -sARTServerUri $sARTUri
    break

}




