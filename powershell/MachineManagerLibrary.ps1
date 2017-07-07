function Get-ProjectsWatingForRunning($lsCurrentMachineProjects){
    
    #filter out waiting for running project in the machine
    $lsResult=@()
    #convert current projects into array
    $lsCurrentMachineProjects=[array]($lsCurrentMachineProjects)
    foreach($item in $lsCurrentMachineProjects){
        $pendingTasks=[array]($item._project.pending_tasks)
        if($item._project.status -eq 5 -and $pendingTasks -ne 0){
            $lsResult+=@($item)
        }

    }
    return $lsResult
}

function Invoke-LocalProject($Project){
    #this function will launch local project, and then will keep waiting until projectId beging set to loadded
    
    #invoke the provided project
    $taskList=[array]($Project._project.pending_tasks)
    $task=$taskList[0]
    $processId=Invoke-NewPowershellConsoleFromUri -uri $task.task.task_script_path
    

    #feed in required variable for the project
    $ProjectFeed=@{
        vision=$Project.vision.name
        blueprint=$Project._project._bluePrint.name
        projectId=$Project._project._id
    }
    Write-SettingForProcess -sARTUri $sARTUri -processId $processId -key ProjectFeed -value $ProjectFeed -dorm $env:COMPUTERNAME
    return $processId
}