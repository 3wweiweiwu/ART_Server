$projectStatus=@{
    Pending=5;
    Running=3;
    Retired=4;
}

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


function Invoke-LocalProject($sARTUri,$Project){
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
    }
    Write-SettingForProcess -sARTUri $sARTUri -processId $processId -key ProjectFeed -value $ProjectFeed -dorm $env:COMPUTERNAME
    #change tht project status to 3, current task is ongoing
    Set-ProjectStatus -sARTServerUri $sARTUri -projectId $Project._project._id -statusId 3
    
    #update the PID in the project
    Set-ProcessIdInProject -sARTServerUri $sARTUri -projectId $Project._project._id -processId $processId

    
    return $processId
}