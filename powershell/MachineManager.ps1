iex ((New-Object System.Net.WebClient).DownloadString("$sARTServerUri/api/ps/ARTLibrary.ps1"))
iex ((New-Object System.Net.WebClient).DownloadString("$sARTServerUri/api/ps/Library.ps1"))
iex ((New-Object System.Net.WebClient).DownloadString("$sARTServerUri/api/ps/MachineManagerLibrary.ps1"))


#2nd load for debugging purpose
$sParentFolder=[System.IO.Path]::GetDirectoryName($myInvocation.MyCommand.Definition)
.(Join-Path -Path $sParentFolder -ChildPath ARTLibrary.ps1)
.(Join-Path -Path $sParentFolder -ChildPath MachineManagerLibrary.ps1)

$sARTUri='http://mvf1:3000'


#keep pulling the project that associate with this machine
#if there is project that is gone, then try to delete that
#if there is project that is in ready to schedule state, then try to schedule it



while($true){
    
    #Check _project that are in ready to run state, schedule them if we have enough resource
    #pull the project every 5 second
    Start-Sleep -Seconds 5
    $lsCurrentMachineProjects=[array](Get-ProjectsInMachine -sARTServerUri $sARTUri)
    #TODO - check existing project in the machine to ensure they are up and running

    #TODO - Check existing project in the machine to see if they are in ready-to-delete state, if so delete
    
    
    
    
    #Schedule current project and launch first task
    $lsReadyToRunProjects=Get-ProjectsWatingForRunning -lsCurrentMachineProjects $lsCurrentMachineProjects
    foreach($project in $lsReadyToRunProjects){
        Write-Host -Object "We are about to invoke $project"
        
        #if task is found, then start the script in the task
        $sPID=Invoke-LocalProject -Project $project
        
        #change tht project status to 3, current task is ongoing
        Set-ProjectStatus -sARTServerUri $sARTUri -projectId $Project._project._id -statusId 3
    }

}