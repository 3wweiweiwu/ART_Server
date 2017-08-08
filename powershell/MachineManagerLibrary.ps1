$projectStatus=@{
    Pending=5;
    Running=3;
    Retired=4;
}
$sTaskVmDeployment="VM_Deployment"
function Get-ProjectsWatingForRunning($lsCurrentMachineProjects){
    
    #filter out waiting for running project in the machine
    $lsResult=@()
    #convert current projects into array
    $lsCurrentMachineProjects=[array]($lsCurrentMachineProjects)
    foreach($item in $lsCurrentMachineProjects){
        $pendingTasks=[array]($item._project.pending_tasks)
        if($item._project.status -eq $projectStatus.Pending -and $pendingTasks -ne 0){
            $lsResult+=@($item)
        }

    }
    return $lsResult
}
function Get-RunningProject($lsCurrentMachineProjects){
    #filter out projects that is currently running
    $lsResult=@()
    #convert current projects into array
    $lsCurrentMachineProjects=[array]($lsCurrentMachineProjects)
    foreach($item in $lsCurrentMachineProjects){
        $pendingTasks=[array]($item._project.pending_tasks)
        if($item._project.status -eq $projectStatus.Running -and $pendingTasks -ne 0){
            $lsResult+=@($item)
        }

    }
    return $lsResult
}
function Get-RetiredProject($lsCurrentMachineProjects){
    #filter out the projects that is ready to retire
    $lsResult=$lsCurrentMachineProjects|where{$_._project.status -eq $projectStatus.Retired}
    return [array]($lsResult)
}


function Invoke-LocalProject($sARTUri,$Project,$diskProfile){
    #this function will launch local project, and then will keep waiting until projectId beging set to loadded
    
    #invoke the provided project
    $taskList=[array]($Project._project.pending_tasks)
    $task=$taskList[0]
    $processId=Invoke-NewPowershellConsoleFromUri -uri $task.task.task_script_path
    
    Start-Sleep -Seconds 5
    

    #feed in required variable for the project
    $ProjectFeed=@{
        vision=$Project.vision.name
        blueprint=$Project._project._bluePrint.name
        projectId=$Project._project._id
        vmId=$Project._project.vid
    }
    Write-SettingForProcess -sARTUri $sARTUri -processId $processId -key ProjectFeed -value $ProjectFeed -dorm $env:COMPUTERNAME
    #change tht project status to 3, current task is ongoing
    Set-ProjectStatus -sARTServerUri $sARTUri -projectId $Project._project._id -statusId 3
    
    #update the PID in the project
    Set-ProcessIdInProject -sARTServerUri $sARTUri -projectId $Project._project._id -processId $processId

    #exmine the task we launched, if it is VM_Deployment, then we will need to find space for it
        if($task.task.name -eq $sTaskVmDeployment){
            #load remote vhd path
            $sRemoteVmPath=Load-Setting -sARTServerUri $sARTUri -project $Project._project._bluePrint.name -task $sTaskVmDeployment
            $result=Get-CompatibleDriveForVM -sRemoteVmPath $sRemoteVmPath
            if($result.Result -eq $true){
                Write-SettingForProcess -sARTUri $sARTUri -key "Local_VHD_Path" -value $result.VHD_Path -processId $processId
            }
            else{
                Write-Error -Message "Does not have enough space for $Project._project._bluePrint.name"
            }
        }
    return $processId
}





function Get-CompatibleDriveForVM([string]$sRemoteVmPath)
{
    #[OutputType([String])]
    
    #Initialize ARTProfile
    if($Global:diskProfile -eq $null){
       $Global:diskProfile=Get-CurrentDiskProfile
    }
    
    
    #calculate required size for VM
    $vhd=Get-VHD -Path $sRemoteVmPath
    $iVmMaxSizeInByte=$vhd.Size
    $iVmFileSizeInByte=$vhd.FileSize
    $iVmStorageSize=($iVmMaxSizeInByte)

    #sort out the drive with enough space
    $sResult=$null
    $drive=([array]($Global:diskProfile|where{$_.ART_Space -gt $iVmStorageSize}|Sort-Object -Property ART_Space))[0]
    if($drive -ne $null)
    {
        $bResult=$true

        $drive.ART_Space-=$iVmStorageSize

        $sResult=$drive.DriveLetter+":"
        $sResult=Join-Path -Path $sResult -ChildPath "VM_Image"
        if((Test-Path -Path $sResult) -eq $false)
        {
            New-Item -ItemType Directory -Path $sResult|Out-Null
        }
    }
    else{
        $bResult=$false
    }

    $result=@{
        Result=$bResult;
        ARTProfile=$Global:diskProfile;
        VHD_Path=$sResult;
    }
    Write-Debug -Message "$result"
    return $result
}