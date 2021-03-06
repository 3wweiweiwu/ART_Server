﻿$sParentFolder=[System.IO.Path]::GetDirectoryName($myInvocation.MyCommand.Definition)
$sARTUri='http://MVF1:3000'
$iTimeout=500 #set global timeout for rest api call to be # ms
$ProcessSetting=@{
    InitializationKey='Initialization'    
    DoneKey='done'
}

$Task=@{
    mediaDetection="Media_Detection"
    installMedia='Install_Media'
    taskVHDSeriesManagement='VHD_Series_Management'
    taskVMDeployment="taskDeployStandardVHDImage"
    taskNewCheckPoint="New_CheckPoint"
    taskVHDCheckin="VHD_Checkin"
    taskVHDDetection='VHD Detection'
    taskPlanGeneration="Plan_Generation"
    taskResume="Resume"
    taskInstallPatch="Install_Patch"
    taskIP21CredentialConfiguration='IP.21 Credentials Configuration'
    taskPrestagingReadyEmail="Prestaging_Ready_Email"
    taskSLMConfiguration="SLM_Configuration"
    taskAnalyticsPostConfiguration="Analytics_Post_Configuration"
}

function Download-FromServertunnel($sARTUri,$From,$To)
{
    $downloadUrl=$From.replace("\","@")
    $url=Join-Url -parentPath $sARTUri -childPath "/api/ps/tunnel/$downloadUrl"
    
    while($true)
    {
        try
        {
            Start-BitsTransfer -Source $url -Destination $To -Description "Copying item from $From to $To with $url" -ErrorAction Stop
            break
        }
        catch
        {
            Resolve-RestError
            Write-Warning -Message "Download-FromServertunnel($sARTUri,$From,$To)"
            Start-Sleep -Seconds 15
            
        }
        
    }
}

function Send-ARTMail($sARTUri,$From,$To,$Subject,$Body,$filePath)
{

    function main()
    {
        $url = Join-Url -parentPath $sARTUri -childPath "/api/mail"
        
        $otherFieldInfo=@{
            Subject=$Subject;
            From=$From;
            To=$To;
            Body=$Body
        }
        #convert otherfieldinfo to object
        $otherFieldInfo=$otherFieldInfo|ConvertTo-Json|ConvertFrom-Json

        #start upload
            Add-Type -AssemblyName 'System.Net.Http'

            $client = New-Object System.Net.Http.HttpClient
            $client.Timeout=[timespan]::FromHours(8)
            $content = New-Object System.Net.Http.MultipartFormDataContent
            $fileStream = [System.IO.File]::OpenRead($filePath)
            $fileName = [System.IO.Path]::GetFileName($filePath)
            $fileContent = New-Object System.Net.Http.StreamContent($fileStream)
        

            #add respective field information
            foreach($key in ($otherFieldInfo|Get-Member|where{$_.MemberType -eq "NoteProperty"}).Name){

                $value=[string]($otherFieldInfo.$key)
                $MultipartContent=New-Object System.Net.Http.StringContent($value)
                $content.Add($MultipartContent,$key)
            }
        
            $content.Add($fileContent, 'file', $fileName)
            $result = $client.PostAsync($url, $content).Result
            $result.EnsureSuccessStatusCode()

        #final cleanup
    
        if ($MultipartContent -ne $null) {$MultipartContent.Dispose() }
        if ($client -ne $null) { $client.Dispose() }
        if ($content -ne $null) { $content.Dispose() }
        if ($fileStream -ne $null) { $fileStream.Dispose() }
        if ($fileContent -ne $null) { $fileContent.Dispose() }
    }

    while($true)
    {
        try
        {
            main
            break
        }
        catch
        {
            Resolve-RestError
            Write-Warning -Message "Send-ARTMail($sARTUri,$From,$To,$Subject,$Body,$filePath)"
        }
    }

        
}

function Remove-Dorm($sARTUri,$dormName)
{
    $url=Join-Url -parentPath $sARTUri -childPath "/api/dorm/$dormName"
    while($true)
    {
        try
        {
            Invoke-RestMethod -Method Delete -Uri $url
            break
        }
        catch
        {
            Write-Warning "Remove-Dorm($sARTUri,$dormName)"
            Resolve-RestError
            
        }
    }
}

function Resolve-RestError()
{
    $result=@{
        bConnectionDropped=$false
    }
    
    if($Error[0].ToString() -match "Unable to connect to the remote server")
    {
        $result.bConnectionDropped=$true
        Write-Warning -Message "Connection is dropped...wait for connection to come back"        
        Start-Sleep -Milliseconds ($iTimeout*50)
        
    }
    Write-Host -Object "$((Get-Date).tostring()) # $($Error[0].ToString())" -ForegroundColor Red
    Start-Sleep -Milliseconds ($iTimeout*50)
    $Error.Clear()
    return $result
}

function Get-RandomName($extension)
{
    $sTempName=(Get-Date).ToFileTimeUtc().ToString()+(Get-Random).ToString()+$extension
    return $sTempName
}
function Kill-UnrelatedPowershellConsole($lsProjectList,$lsException=@())
{
    #kill unrelated powershell console
    #criteria
        #The powershell's title is not equal to the name in exception list
        #The powershell's title is not included in project's id list
        #The powershell's title is does contain two ==(which is the distinguishing mark of ART2? I hope...)
    $lsPowershellConsole=[array](Get-Process -Name powershell)

    #merge the project id into exception list
    foreach($project in $lsProjectList)
    {
        $lsException+=@($project._project._id)
    }

    #loop through  powershell console and check against the exception list
    foreach($item in $lsPowershellConsole)
    {
        $bKill=$true
        foreach($name in $lsException)
        {
            if($item.MainWindowTitle -match $name -or $item.MainWindowTitle -notmatch "==")
            {
                $bKill=$false
                break;
            }
        }
        if($bKill)
        {
            Write-Host "kill $($item.Id) with title $($item.MainWindowTitle)"
            $item|Stop-Process -Force
        }
    }

}

function Get-AllVHDInShelf($sARTUri)
{
    $url = Join-Url -parentPath $sARTUri -childPath "/api/shelf/vhd"
    try
    {
        $reponse=Invoke-RestMethod -Method Get -Uri $url
    }
    catch
    {
        Write-Warning -Message "Get-All($sARTUri)"
        Get-AllVHDInShelf -sARTUri $sARTUri
    }
    
    
    
}

function Get-VHDSize($sARTUri,$vhdID)
{
    #Start-Sleep -Seconds 1
    $url = Join-Url -parentPath $sARTUri -childPath "/api/shelf/vhd/$vhdID/size"
    while($true)
    {
        try
        {
            $reponse=Invoke-RestMethod -Method Get -Uri $url
            return $reponse.size
        }
        catch
        {
            Write-Warning -Message "Get-VHDSize($sARTUri,$vhdID)"
            Resolve-RestError
        }
        Start-Sleep -Milliseconds $iTimeout
    }  
    
    
}

function Get-VHDFromServer($sARTUri,$vhdID)
{
    while($true)
    {
        try
        {
            Write-Host -Object "$sARTUri,$vhdID"
            $url = Join-Url -parentPath $sARTUri -childPath "/api/shelf/vhd/$vhdID"
        
            $reponse=Invoke-RestMethod -Method Get -Uri $url
    
    
            return $reponse
        }
        catch
        {
        
            Write-Warning -Message "Get-VHD($sARTUri,$vhdID)"
            Resolve-RestError            
        }
    }

}
function Start-CustomizedBitTransfer($activity,$url,$localPath)
{
        
    $start_time = Get-Date
    Write-Host -Object "Start to download from $url to $localPath"
    #(New-Object System.Net.WebClient).DownloadFile($url, $localPath)
    $bit=Start-BitsTransfer -Source $url -Destination $localPath -Description "Copying item from $url to $localPath" -Asynchronous
    while($true)
    {
        Write-Progress -Activity "ART Transfer" -Status "Copying item from $url to $localPath. Currently $($bit.BytesTransferred) / $($bit.BytesTotal)." -PercentComplete $($bit.BytesTransferred/$bit.BytesTotal*100)
        Start-Sleep -Seconds 1
        if($bit.JobState -match "TransientError")
        {
            $bit=$bit|Resume-BitsTransfer -Asynchronous
            Write-Host -Object "$((Get-Date).ToString()) # unstable network connection is detected"
        }
        elseif($bit.JobState -match "Transferred" )
        {
            $bit|Complete-BitsTransfer
            Write-Host -Object "Bit transfer has finished successfully"
            break
        }
    }
    Write-Output "Time taken: $((Get-Date).Subtract($start_time).TotalMinutes) min"
}

function Download-VHD($sARTUri,$imageId,$localPath)
{

    while($true)
    {
        $url = Join-Url -parentPath $sARTUri -childPath "/api/shelf/vhd/download/$imageId"
        try
        {
            Start-CustomizedBitTransfer -activity "Download VHD" -url $url -localPath $localPath
            break
        }    
        catch
        {
            Resolve-RestError
            Write-Warning "Download-VHD($sARTUri,$imageId,$localPath)"
        }
    }

}
function Join-Url($parentPath,$childPath)
{
    $url=$parentPath -replace("http://","")

    $url=$url+="/"+$childPath

    $url=$url.replace("//","/").replace("//","/")

    $url='http://'+$url

    return $url
}

function Upload-FileToServer($sARTUri,$fieldName,$filePath,$otherFieldInfo)
{



    function main()
    {
        $url = Join-Url -parentPath $sARTUri -childPath "/api/shelf/vhd"


        #convert otherfieldinfo to object
        $otherFieldInfo=$otherFieldInfo|ConvertTo-Json|ConvertFrom-Json

        #start upload
            Add-Type -AssemblyName 'System.Net.Http'

            $client = New-Object System.Net.Http.HttpClient
            $client.Timeout=[timespan]::FromHours(8)
            $content = New-Object System.Net.Http.MultipartFormDataContent
            $fileStream = [System.IO.File]::OpenRead($filePath)
            $fileName = [System.IO.Path]::GetFileName($filePath)
            $fileContent = New-Object System.Net.Http.StreamContent($fileStream)
        

            #add respective field information
            foreach($key in ($otherFieldInfo|Get-Member|where{$_.MemberType -eq "NoteProperty"}).Name){
                if($otherFieldInfo.$key.GetType().name -eq "Object[]" -or $otherFieldInfo.installed_media.GetType().Name -eq "PSCustomObject"){
                    $value=$otherFieldInfo.$key|ConvertTo-Json
                
                }
                else
                {
                    $value=[string]($otherFieldInfo.$key)
                }
                $MultipartContent=New-Object System.Net.Http.StringContent($value)
                $content.Add($MultipartContent,$key)
            }
        
            $content.Add($fileContent, $fieldName, $fileName)
            $result = $client.PostAsync($url, $content).Result
            $result.EnsureSuccessStatusCode()

        #final cleanup
    
        if ($MultipartContent -ne $null) {$MultipartContent.Dispose() }
        if ($client -ne $null) { $client.Dispose() }
        if ($content -ne $null) { $content.Dispose() }
        if ($fileStream -ne $null) { $fileStream.Dispose() }
        if ($fileContent -ne $null) { $fileContent.Dispose() }
    }

    while($true)
    {
        try
        {
            main
            break
        }
        catch
        {
            Resolve-RestError
            Write-Warning -Message "Upload-FileToServer($sARTUri,$fieldName,$filePath,$otherFieldInfo)"
        }
    }

        

}

function Add-NewServerToArt($sARTServerUri=$sARTUri){
    
    $CPU=(Get-WmiObject Win32_Processor).NumberOfCores
    #if CPU come back to be array
    if($CPU.GetType().ToString().contains("["))
    {
        $iCPUCount=0
        foreach($count in $CPU)
        {
            $iCPUCount+=$count
        }
        $CPU=$iCPUCount    
    }
    
    $totalMemory=(gwmi Win32_ComputerSystem  ).TotalPhysicalMemory/1024/1024
    $freeMemory=(gwmi Win32_OperatingSystem).FreePhysicalMemory/1024
    $dormStatus=@{
        name=$env:COMPUTERNAME
        system_resource=@{
            CPU=$CPU
            total_memory_mb=$totalMemory
            free_memory_mb=$freeMemory
            disk_total=@(
                @{
                    drive_letter='c'
                    total_disk_space_mb=999999
                    free_disk_space_mb=888
                }

            )
    
        }
    }
    $dormJson=$dormStatus|ConvertTo-Json -Depth 4
    $response=Invoke-RestMethod -Uri "$sARTServerUri/api/dorm" -Method Post -Body $dormJson -ContentType 'application/json'
    Start-Sleep -Milliseconds $iTimeout

    if($response.result -eq "ok"){
        return $true
    }
    else{
        return $false
    }

}   

function Write-Setting($sARTServerUri,$vision="Template",$project="Template",$task="Template",$key,$value){
    #write setting to server
    $value=@{
        value=($value|ConvertTo-Json)
    }
    $valueJson=$value|ConvertTo-Json -Depth 99
    while($true)
    {
        try
        {
            $response=Invoke-RestMethod -Uri "$sARTServerUri/api/registry/vision/$vision/project/$project/task/$task/key/$key" -Method Post -Body $valueJson -ContentType 'application/json'
            Start-Sleep -Milliseconds $iTimeout
            break
        }
        catch
        {            
            Write-Warning -Message "Write-Setting($sARTServerUri,$vision,$project,$task,$key,$value)"
            Resolve-RestError
        }
        
    }
    
    Write-Debug -Message "$sARTServerUri,$vision,$project,$task,$key,$value"
}

function Load-CompleteSetting($sARTServerUri,$vision="Template",$project="Template",$task="Template",$key,[switch]$LoadOnce)
{
    #load setting from server
    while($true)
    {
        try{
            $url=Join-Url -parentPath $sARTServerUri -childPath "/api/registry/vision/$vision/project/$project/task/$task/key/$key/all"
            $response=Invoke-RestMethod -Uri $url -Method Get -ContentType 'application/json'
            Start-Sleep -Milliseconds $iTimeout

            return $response
        }
        catch{
            Start-Sleep -Seconds 1
            Write-Warning "unable to Load-CompleteSetting $sARTServerUri | $vision | $project | $task | $key |"
            if($LoadOnce.IsPresent){
                break
            }
        }
    }
}
function Set-RegistryExpired($sARTServerUri,$vision="Template",$project="Template",$task="Template",$key)
{
    while($true)
    {
        try
        {
            $url=Join-Url -parentPath $sARTServerUri -childPath "/api/registry/vision/$vision/project/$project/task/$task/key/$key/expired"
            $response=Invoke-RestMethod -Uri $url -Method Put -ContentType 'application/json'
            break
            
        }
        catch
        {
            Start-Sleep -Milliseconds $iTimeout*2
            Write-Progress -Activity Warning -Status "Warning - Set-RegistryExpired($sARTServerUri,$vision,$project,$task,$key)"
        }
    }
}
function Load-Setting($sARTServerUri,$vision="Template",$project="Template",$task="Template",$key,[switch]$LoadOnce){
    #load setting from server
    if($LoadOnce.IsPresent)
    {
        $response=Load-CompleteSetting -sARTServerUri $sARTServerUri -vision $vision -project $project -task $task -key $key -LoadOnce
    }
    else
    {
        $response=Load-CompleteSetting -sARTServerUri $sARTServerUri -vision $vision -project $project -task $task -key $key
    }

    #convert value to json
    try{
        $result=$response.value|ConvertFrom-Json

    }
    catch{
        $result=$response.value
    }
    Write-Debug "value for $key is $result"
    return $result
    

    
}
function Get-CurrentDiskProfile(){
    $profile=Get-Volume|where{[int]($_.DriveLetter) -ne 0}|where{$_.DriveType -eq "Fixed"}
    $ARTProfile=[array]($profile|select *,'ART_Space')
    foreach($item in $ARTProfile){
        $item.ART_Space=$item.SizeRemaining
    } 
    return $ARTProfile
}
function Get-DormInfo($sARTUri,$dormName=$env:COMPUTERNAME)
{
    while($true)
    {
        try
        {
            $result=Invoke-RestMethod -Uri "$sARTUri/api/dorm/$dormName" -Method Get 
            Start-Sleep -Milliseconds $iTimeout

            return $result
        }
        catch
        {
            Resolve-RestError            
            Write-Warning -Message "Get-DormInfo($sARTUri,$dormName=$env:COMPUTERNAME)"
            
        }

    }
}
function Set-DormDiskSpace($sARTServerUri,$dormName){
    $profile=([array](Get-CurrentDiskProfile))
    
    $lsDisk=@()
    foreach($item in $profile){
        $disk=@{
            DriveLetter=$item.DriveLetter;
            Size=$item.Size;
            SizeRemaining=$item.SizeRemaining;
        }
        $lsDisk+=@($disk)

    }
    $diskJson=@{diskProfile=$lsDisk}|ConvertTo-Json
    while($true)
    {
        try
        {
            Invoke-RestMethod -Uri "$sARTServerUri/api/dorm/DiskInitializationSignal/$dormName" -Method Put -Body $diskJson -ContentType 'application/json'
            Start-Sleep -Milliseconds $iTimeout
            break
        }
        catch
        {
            Resolve-RestError
            Write-Warning -Message "Fail to invoke Set-DormDiskSpace $sARTServerUri,$dormName"            
        }
    }
    
}

function Set-ProcessIdInProject($sARTServerUri,$projectId,$processId){
    while($true)
    {
        try
        {
            Invoke-RestMethod -Uri "$sARTServerUri/api/project/$projectId/PID/$processId" -Method Put 
            Start-Sleep -Milliseconds $iTimeout
            break
        }
        catch
        {
            Write-Warning -Message "Set-ProcessIdInProject($sARTServerUri,$projectId,$processId)"
            Resolve-RestError            
        }

    }




}

function Set-ProjectStatus($sARTServerUri,$projectId,$statusId){
    while($true)
    {
        try
        {
            $response=Invoke-RestMethod -Uri "$sARTServerUri/api/project/$projectId/status/$statusId" -Method Put -ContentType 'application/json'
            Start-Sleep -Milliseconds $iTimeout
            break
        }
        catch
        {
            Write-Warning -Message "Set-ProjectStatus($sARTServerUri,$projectId,$statusId)"
            Resolve-RestError
            
        }

    }


}

function Set-NextProject($sARTServerUri,$vision,$project){
    while($true)
    {
        try
        {
            #current project is done, move to next project    
            $response=Invoke-RestMethod -Uri "$sARTServerUri/api/schedule/vision/$vision/next/$project" -Method Post -ContentType 'application/json'
            Start-Sleep -Milliseconds $iTimeout
            break
        }
        catch
        {
            Write-Warning -Message "Set-NextProject($sARTServerUri,$vision,$project){"            
            Resolve-RestError
        }
    }

}

function Get-ProjectsInMachine($sARTServerUri,$sMachineName=$env:COMPUTERNAME){
    while($true)
    {
        try{
            $response=Invoke-RestMethod -Uri "$sARTServerUri/api/schedule/machine/$sMachineName/projects" -Method Get -ContentType 'application/json'
            Start-Sleep -Milliseconds $iTimeout
            try{
                $result=$response.result|ConvertFrom-Json

            }
            catch{
                $result=$response.result
            }
            
            return $result
        }
        catch{
            
            #if failure is due to connection drop, then continue
            $result=Resolve-RestError
            if($result.bConnectionDropped)
            {
                continue
            }
            #if failure is due to other reason, then stop
            Start-Sleep -Seconds 1
            Write-Host "unable to find project for $sMachineName from $sARTServerUri"
            

            break
        }    
    }
}

function Write-SettingForProcess($sARTUri,$key,$value,$processId,$dorm){
    Write-Setting -sARTServerUri $sARTUri -project "Dorm_$dorm" -task $processId -key $key -value $value
}

function Get-SettingForProcess($sARTUri,$key,$processId,$dorm){
    #in the debug mode, do not check expiration
    while($DebugPreference -ne "Continue")
    {
        
        $expireStatus=Load-CompleteSetting -sARTServerUri $sARTUri -project "Dorm_$dorm" -task $processId -key $key
        if($expireStatus.expired -eq $false)
        {
            break
        }
        Write-Progress -Activity "$((Get-Date).ToString()) Get-SettingForProcess" -Status "Project feed is expired, waiting..."
        Start-Sleep -Milliseconds $iTimeout
    }
    
    
    $result=Load-Setting -sARTServerUri $sARTUri -project "Dorm_$dorm" -task $processId -key $key
    $expired=Set-RegistryExpired -sARTServerUri $sARTUri -project "Dorm_$dorm" -task $processId -key $key
    return $result
}

function Get-CurrentProcessSetting($sARTUri,$key){
    return Get-SettingForProcess -sARTUri $sARTUri -key $key -processId $PID -dorm $env:COMPUTERNAME
}

function Write-SettingForCurrentProcess($sARTUri,$key,$value){
    Write-SettingForProcess -sARTUri $sARTUri -key $key -value $value -processId $PID -dorm $env:COMPUTERNAME
}
function Invoke-NewPowershellConsole($sArtUri,$script){
    $app=Start-Process -FilePath powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command `"iex ((New-Object System.Net.WebClient).DownloadString('$sArtUri/api/ps/$script'))`"" -PassThru
    return $app.Id
}

function Invoke-NewPowershellConsoleFromUri($uri,[switch]$ise){
    $sTempName=(Get-Date).ToFileTimeUtc().ToString()+(Get-Random).ToString()+".ps1"
    $sTempPath=Join-Path -Path $env:TEMP -ChildPath $sTempName
    
    while($true)
    {
        try
        {
            ((New-Object System.Net.WebClient).DownloadString($uri))|Out-File -FilePath $sTempPath -Force
            Start-Sleep -Milliseconds $iTimeout
            break
        }
        catch
        {
            Write-Warning -Message "Invoke-NewPowershellConsoleFromUri($uri,[switch]$ise)"
        }
    }
    
    



    if($ise.IsPresent -or $DebugPreference -eq "Continue")
    {

        
        $app=Start-Process -FilePath powershell_ise.exe -ArgumentList $sTempPath -PassThru
        $app=@{Id=$PID}
    }
    else
    {
        #$app=Start-Process -FilePath powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command `"iex ((New-Object System.Net.WebClient).DownloadString('$uri'))`"" -PassThru
        $app=Start-Process -FilePath powershell.exe -ArgumentList "-ExecutionPolicy Bypass -Command `"$sTempPath`"" -PassThru
    }
    
    return $app.Id
}

function Write-NewSettingToProcess($sARTUri,$processId,$key,$value){
    
    #This function is used by the machine manager to write setting for the project
    #it is intended to use with Get-FreshSettingForCurrentProcess
    
    $value=$ProcessSetting.InitializationKey
    while($value -eq $ProcessSetting.InitializationKey){
        Start-Sleep -Seconds 0.5
        $value=Get-SettingForProcess -sARTUri $sARTUri -key $key -processId $processId
    }
    Write-SettingForProcess -sARTUri $sARTUri -processId $processId -dorm $env:COMPUTERNAME -key $key -value


}
function Get-FreshSettingForCurrentProcess($sARTUri,$key){
    #This function is used to get the setting from machine manager for the specific process
    #it is intended to use with Write-NewSettingToProcess
    
    $value=$ProcessSetting.InitializationKey
    Write-SettingForCurrentProcess -sARTUri $sARTUri -key $key $ProcessSetting.InitializationKey
    while($value -ne $ProcessSetting.InitializationKey){
        try
        {
            $value=Get-CurrentProcessSetting -sARTUri $sARTUri -key $key
            Start-Sleep -Seconds $iTimeout

        }
        catch
        {
            Write-Host -Object "unable to Get-FreshSetting $sARTUri,$key"
            Start-Sleep -Seconds $iTimeout
            continue
        }
        
    }
    
    Write-SettingForCurrentProcess -sARTUri $sARTUri -key $key -value $ProcessSetting.DoneKey
    return $value

}


function Remove-ProjectFromProjectCurrentProject($sARTUri,$visionName,$projectId){
    #delete project from current project list
    while($true)
    {
        try
        {
            $response=Invoke-RestMethod -Uri "$sARTUri/api/vision/$visionName/current_projects/$projectId" -Method Delete -ContentType 'application/json'
            Start-Sleep -Milliseconds $iTimeout
            break
        }
        catch
        {
            Write-Warning -Message "Remove-ProjectFromProjectCurrentProject($sARTUri,$visionName,$projectId)"
            Resolve-RestError
            
        }
    }

}


function Get-VolumeforVHD($sARTUri,$machine,$disk_size_in_mb){
    while($true)
    {
        try
        {
            $response=Invoke-RestMethod -Method Put -Uri "$sARTUri/api/dorm/$machine/vm/$disk_size_in_mb/drive/*"
            Start-Sleep -Milliseconds $iTimeout
            return $response
        }
        catch
        {
            Write-Warning -Message "Get-VolumeforVHD($sARTUri,$machine,$disk_size_in_mb){"
            Resolve-RestError
            
        }
    }

}

function Return-VHDSpace($sARTUri,$machine,$vhd_Path){

    while($true)
    {
        if((Test-Path -Path $vhd_Path) -eq $false)
        {
            return
        }
        
        try
        {
            $VHD=Hyper-V\Get-VHD -Path $vhd_Path
            $sDriveLetter=$VHD.Path[0]
            $disk_size_in_mb=$VHD.Size/1024/1024*-1

            $response=Invoke-RestMethod -Method Put -Uri "$sARTUri/api/dorm/$machine/vm/$disk_size_in_mb/drive/$sDriveLetter"
            Start-Sleep -Milliseconds $iTimeout
            return $response.result
        }
        catch
        {
        
            Write-Warning -Message "Return-VHDSpace($sARTUri,$machine,$vhd_Path) <$sARTUri/api/dorm/$machine/vm/$disk_size_in_mb/drive/$sDriveLetter>"
            Resolve-RestError
            
        }
    }

}

function Get-Project($sARTUri,$projectId)
{
    while($true)
    {
        try
        {
            $response=Invoke-RestMethod -Method Get -Uri "$sARTUri/api/project/$projectId"
            Start-Sleep -Milliseconds $iTimeout
            return $response
        }
        catch
        {
            Write-Warning -Message "Get-Project($sARTUri,$projectId)"            
            Resolve-RestError
        }
    }
}

function New-ClientSideProjectBasedOnTask($sARTUri,$visionName,$vmName,$blueprintName,$taskName)
{
    while($true)
    {
        try
        {
            $response=Invoke-RestMethod -Method Post -Uri "$sARTUri/api/schedule/vision/$visionName/vm/$vmName/blueprint/$blueprintName/task/$taskName"
            Start-Sleep -Milliseconds $iTimeout
            return $response    
        }
        catch
        {
            Write-Warning -Message "New-ClientSideProjectBasedOnTask($sARTUri,$visionName,$vmName,$blueprintName,$taskName)"
            
            Resolve-RestError
        }
    }
}

function Get-VHDFeedForVision($sARTUri,$seriesName,$visionName)
{
    while($true)
    {
        try
        {
            
            $url=Join-Url -parentPath $sARTUri -childPath ("api/shelf/vhd/series/$seriesName/subscriber/$visionName/feed")
            $response=Invoke-RestMethod -Method Get -Uri $url
            Start-Sleep -Milliseconds $iTimeout
            return $response   
        }
        catch
        {
            Write-Warning -Message "Get-VHDFeedForVision($sARTUri,$seriesName,$visionName)"
            
            Resolve-RestError
        }
    }
}

function Resolve-Error ($ErrorRecord=$Error[0])
{
   $ErrorRecord | Format-List * -Force
   $ErrorRecord.InvocationInfo |Format-List *
   $Exception = $ErrorRecord.Exception
   for ($i = 0; $Exception; $i++, ($Exception = $Exception.InnerException))
   {   "$i" * 80
       $Exception |Format-List * -Force
   }
}

Write-Host "ART Library is loaded. V2" -ForegroundColor DarkMagenta
