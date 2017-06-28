
$sParentFolder=[System.IO.Path]::GetDirectoryName($myInvocation.MyCommand.Definition)
$sARTUri='http://mvf1:3000'


#keep pulling the project that associate with this machine
#if there is project that is gone, then try to delete that
#if there is project that is in ready to schedule state, then try to schedule it
function Get-ProjectsWatingForRunning($lsCurrentMachineProjects){
    
    #filter out waiting for running project in the machine
    $lsResult=@()
    #convert current projects into array
    $lsCurrentMachineProjects=[array]($lsCurrentMachineProjects)
    foreach($item in $lsCurrentMachineProjects){
        if($item._project.status -eq 5){
            $lsResult+=@($item)
        }

    }
    return $lsResult
}

function Invoke-LocalProject($Project){
    #invoke the provided project
    $taskList=[array]($Project._project.pending_tasks)
    $task=$taskList[0]
    $processId=Invoke-NewPowershellConsole -sArtUri $sARTUri -script $task.task.task_script_path

    #feed in required variable for the project
    Write-SettingForProcess -sARTUri $sARTUri -key vision -value $Project.vision.name
    Write-SettingForProcess -sARTUri $sARTUri -key blueprint -value $Project._project._bluePrint.name
    Write-SettingForProcess -sARTUri $projectId -key blueprint -value $Project._project._id


    
}


#while($true){
    #pull the project every 5 second
    Start-Sleep -Seconds 5
    $lsCurrentMachineProjects=[array](Get-ProjectsInMachine -sARTServerUri $sARTUri)
    #TODO - check existing project in the machine to ensure they are up and running

    #TODO - Check existing project in the machine to see if they are in ready-to-delete state, if so delete them
    
    #Check _project that are in ready to run state, schedule them if we have enough resource
    $lsReadyToRunProjects=Get-ProjectsWatingForRunning -lsCurrentMachineProjects $lsCurrentMachineProjects
#}