
$sParentFolder=[System.IO.Path]::GetDirectoryName($myInvocation.MyCommand.Definition)
$sARTUri='http://mvf1:3000'

$ProcessSetting=@{
    InitializationKey='Initialization'    
    DoneKey='done'
}

function Add-NewServerToArt($sARTServerUri=$sARTUri){
    
    $CPU=(Get-WmiObject Win32_Processor).NumberOfCores
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
    $response=Invoke-RestMethod -Uri "$sARTServerUri/api/registry/vision/$vision/project/$project/task/$task/key/$key" -Method Post -Body $valueJson -ContentType 'application/json'
    Write-Host -Message "$sARTServerUri,$vision,$project,$task,$key,$value"
}

function Load-Setting($sARTServerUri,$vision="Template",$project="Template",$task="Template",$key){
    #load setting from server
    while($true)
    {
        try{
            $response=Invoke-RestMethod -Uri "$sARTServerUri/api/registry/vision/$vision/project/$project/task/$task/key/$key" -Method Get -ContentType 'application/json'
            try{
                $result=$response.result|ConvertFrom-Json

            }
            catch{
                $result=$response.result
            }
            Write-Debug "value for $key is $result"
            return $result
        }
        catch{
            Start-Sleep -Seconds 1
            Write-Warning "unable to load-setting $sARTServerUri | $vision | $project | $task | $key |"
        }
    }

    
}



function Set-ProjectStatus($sARTServerUri,$projectId,$statusId){
    $response=Invoke-RestMethod -Uri "$sARTServerUri/api/project/$projectId/status/$statusId" -Method Put -ContentType 'application/json'
}

function Set-NextProject($sARTServerUri,$vision,$project){
    #current project is done, move to next project    
    $response=Invoke-RestMethod -Uri "$sARTServerUri/api/schedule/vision/$vision/next/$project" -Method Post -ContentType 'application/json'
}

function Get-ProjectsInMachine($sARTServerUri,$sMachineName=$env:COMPUTERNAME){
    try{
        $response=Invoke-RestMethod -Uri "$sARTServerUri/api/schedule/machine/$sMachineName/projects" -Method Get -ContentType 'application/json'
        try{
            $result=$response.result|ConvertFrom-Json

        }
        catch{
            $result=$response.result
        }
            
        return $result
    }
    catch{
        Start-Sleep -Seconds 1
        Write-Host "unable to find $sARTServerUri | $vision | $project | $task | $key |"
    }    
}

function Write-SettingForProcess($sARTUri,$key,$value,$processId,$dorm){
    Write-Setting -sARTServerUri $sARTUri -project "Dorm_$dorm" -task $processId -key $key -value $value
}

function Get-SettingForProcess($sARTUri,$key,$processId,$dorm){
    return Load-Setting -sARTServerUri $sARTUri -project "Dorm_$dorm" -task $processId -key $key
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
    if($ise.IsPresent)
    {
        $app=Start-Process -FilePath powershell_ise.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command `"iex ((New-Object System.Net.WebClient).DownloadString('$uri'))`"" -PassThru
    }
    else
    {
        $app=Start-Process -FilePath powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command `"iex ((New-Object System.Net.WebClient).DownloadString('$uri'))`"" -PassThru
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
            Start-Sleep -Seconds 0.5
        }
        catch
        {
            Write-Host -Object "unable to Get-FreshSetting $sARTUri,$key"
            Start-Sleep -Seconds 1
            continue
        }
        
    }
    
    Write-SettingForCurrentProcess -sARTUri $sARTUri -key $key -value $ProcessSetting.DoneKey
    return $value

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

Write-Host "ART Library is loaded. V2"