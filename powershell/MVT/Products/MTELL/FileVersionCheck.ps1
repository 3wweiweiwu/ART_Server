$sARTUri='http://mvf1:3000'

$DebugPreference="Continue"
$DebugPreference='SilentlyContinue'
iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/ARTLibrary.ps1"))
iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/CommonHeader.ps1"))

#get the media name
$sRemoteVmPath=Load-Setting -sARTServerUri $sARTUri -vision $vision -task $Task.taskVMDeployment -key base_vhd_path    
$vhdInfo=Get-VHDFromServer -sARTUri $sARTUri -vhdID $sRemoteVmPath
$mediaName=$vhdInfo.content.installed_media.name
#######################################Start of main application########################################################
$aspenPath = @()

$aspenPath += 'C:\Program Files (x86)\AspenTech\'
$aspenPath += 'C:\Program Files\AspenTech\'
$aspenPath += 'C:\inetpub\wwwroot\AspenTech'

$exception = '\\becharad1\MTELL\FileVersionException.txt'

$exceptionList = Get-Content -Path $exception 
$aspenFiles = @()
foreach ($path in $aspenPath){

$aspenFiles += Get-ChildItem -Path $path -Recurse | Where-Object {$_.Name -like "*dll*"} | Select-Object -Property Name, FullName, CreationTime, @{Name="FileVersion"; Expression = {$_.VersionInfo.FileVersion}} ##| Export-Csv -NoTypeInformation -Path "c:\trustme\test.csv"

}


$aspenFiles = $aspenFiles | Sort-Object -Property "FileVersion" -Descending

$fail=0
$pass=0
$all=0
$skipped=0

$startTime = Get-Date



$bodyMain = "<html><head>"

$bodyMain +="<style>
td {border: 1px solid black;}
table {border: 1px solid black;}
th { background-color: #5E7BCE; color:white; border: 1px solid black; width: auto;}
</style></head><body>"

$bodyData = "<table><tr><th colspan='7'>Failures</th></tr><tr><th>FileName</th><th>Base Full Path</th><th>Base Creation Time</th><th>Base File Version</th><th>Compared Path</th><th>Compared File Version</th><th>Compared File Creation Time</th></tr>"
$bodyApproved = "<table><tr><th colspan='7'>RnD Approved Differences</th></tr><tr><th>FileName</th><th>Base Full Path</th><th>Base Creation Time</th><th>Base File Version</th><th>Compared Path</th><th>Compared File Version</th><th>Compared File Creation Time</th></tr>"
$bodyPass = "<table><tr><th colspan='7'>Passed</th></tr><tr><th>FileName</th><th>Base Full Path</th><th>Base Creation Time</th><th>Base File Version</th><th>Compared Path</th><th>Compared File Version</th><th>Compared File Creation Time</th></tr>"
$listOfChecked = @()
foreach($file in $aspenFiles){

if($listOfChecked -contains $file.Name){}
else{

 foreach($file2 in $aspenFiles){

        if ($file.Name -eq $file2.Name){
            if ($file.FullName -eq $file2.FullName){}
            else{
                if($file.FileVersion -eq $null){
            ##"Skipped Verification :: $($file.Name) does not contain a version info"
            $all++
            $skipped++
            }
                else{
            
                if($file.FileVersion -eq $file2.FileVersion){
                
                
                    $store = "<tr><td>$($file.Name)</td><td>$($file.FullName)</td><td>$($file.CreationTime)</td><td>$($file.FileVersion)</td><td>$($file2.FullName)</td><td>$($file2.FileVersion)</td><td>$($file2.CreationTime)</td></tr>"
                    $bodyPass += $store
                    ##"Pass :: $($file.Name) :: The File Version of $($file.FullName) matches $($file2.FullName) :: $($file2.VersionInfo.FileVersion)"
                    $all++
                    $pass++
                }
                else{
                    if($exceptionList -contains $file2.FullName){
                   

                    $store = "<tr><td>$($file.Name)</td><td>$($file.FullName)</td><td>$($file.CreationTime)</td><td>$($file.FileVersion)</td><td>$($file2.FullName)</td><td>$($file2.FileVersion)</td><td>$($file2.CreationTime)</td></tr>"
                    $bodyApproved+=$store

                     $pass++
                    $all++
                    }
                    else{
                        Write-Host  "Fail:::::::::::::::::::::::Start"
                        Write-Host "$($file.FileVersion) :: $($file.FullName) "-ForegroundColor Red
                        Write-Host "$($file2.FileVersion) :: $($file2.FullName)" -ForegroundColor Red
                        Write-Host  "Fail:::::::::::::::::::::::End"
                        $store = "<tr><td>$($file.Name)</td><td>$($file.FullName)</td><td>$($file.CreationTime)</td><td>$($file.FileVersion)</td><td>$($file2.FullName)</td><td>$($file2.FileVersion)</td><td>$($file2.CreationTime)</td></tr>"
                        $bodyData += $store
                        $fail++
                        $all++
                    }
                }
            }
            }
              $listOfChecked += $file.Name
        }
        else{}

      

    }
  }
  
    
}

$bodyData += "</table></br></br>"
$bodyApproved += "</table></br></br>"
$bodyPass += "</table></br></br>"
$endTime = Get-Date
$timeComplete=$endTime-$startTime
$passRate = [Math]::Round($(($pass/($fail+$pass))*100),1)

$subject = "PassRate: $passRate %  || Mtell Results for File Version Tool on $($startTime.DateTime) [$($mediaName)]"

$bodyPerformance = "</br><table>"

$bodyPerformance += "<tr><td>Failure Detected</td><td>$fail</td></tr>"
$bodyPerformance += "<tr><td>Total Files Scanned</td><td>$all</td></tr>"
$bodyPerformance += "<tr><td>Pass Rate</td><td> $passRate % </td></tr>"
$bodyPerformance += "</table></br>"

$body = $bodyMain + $bodyPerformance + $bodyData + $bodyApproved  + $bodyPass
$body += "</body></html>"

"Failures Detected   :: $fail" 
"Passes Detected     :: $pass"
"Total Files Scanned :: $all"
"Pass % :: $(($pass/($fail+$pass))*100) % "  
"Time to Complete:: $($timeComplete.TotalSeconds) seconds"

<#
"Failures Detected   :: $fail"  | Out-File -FilePath "c:\trustme\short_results.txt" -Append
"Passes Detected     :: $pass" | Out-File -FilePath "c:\trustme\short_results.txt" -Append
"Total Files Scanned :: $all" | Out-File -FilePath "c:\trustme\short_results.txt" -Append
"Pass % :: $(($pass/($fail+$pass))*100) % "  | Out-File -FilePath "c:\trustme\short_results.txt" -Append
"Time to Complete:: $($timeComplete.TotalSeconds) seconds" | Out-File -FilePath "c:\trustme\short_results.txt" -Append
#>
$Email_List=@("david.bechara@aspentech.com","weiwei.wu@aspentech.com","Manasi.Tilwalli@aspentech.com","Sunil.Pillai@aspentech.com")
Send-MailMessage -From "MVT@aspentech.com" -SmtpServer "SMTP.ASPENTECH.LOCAL" -To $Email_List -Subject $subject -Body $body -Priority High -BodyAsHtml
###############################################################end of main application ######################################################################################
Set-NextProject -sARTServerUri $sARTUri -vision $vision -project $projectId               