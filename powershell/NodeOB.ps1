#This task is NodeOB


#this is media detector, it will detect new media and schedule the media when time permits
$sARTUri='http://mvf1:3000'
$sARTServerUri=$sARTUri
iex ((New-Object System.Net.WebClient).DownloadString("$sARTServerUri/api/ps/NodeOB_Library.ps1"))







$ScheduleMode=@{
    EveryNewMedia="EveryNewMedia"
}






#2nd load for debugging purpose
if($DebugPreference -eq "Continue"){
    
    $sRootFolder=Split-Path -Path ([System.IO.Path]::GetDirectoryName($myInvocation.MyCommand.Definition)) -Parent
    .(Join-Path -Path $sRootFolder -ChildPath ARTLibrary.ps1)
    .(Join-Path -Path $sRootFolder -ChildPath (Join-Path -Path "Manager" -ChildPath .\VMDeployment_Library.ps1))

}
#


#load information for current vm

iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/CommonHeader.ps1"))

#get the client side task

#so far no client side project is scheduled
$bClientProjectScheduled=$false
while($true){
    Start-Sleep -Seconds 10
    
    $lsProjects=$null #client side project list
    $lsTaskInClient=$null
    $lsProjects=[array](Get-ProjectsInMachine -sARTServerUri $sARTUri -sMachineName $sVMClientId.ToUpper())
    
    
    if($lsProjects -ne $null -and $bClientProjectScheduled)
    {
        #while there is project scheduled in client, then we are trying to get the task
        $lsTaskInClient=[array](Get-PendingTasks -sARTUri $sARTUri -projectId $lsProjects[0]._project._id)
    }
    
    
    $lsTasks=[array](Get-PendingTasks -sARTUri $sARTUri -projectId $projectId) #get task in server side

    #if we have completed all server tasks, then quit the node watch. we are all set with this project
        if($lsTasks.Length -eq 0){
            Read-Host -Prompt "Project is completed successfully"
            break;
        }
    #if there used to be a client side project scheduled, and now the project is gone, it means that the client side project is done, make server side project move forward
        if ($bClientProjectScheduled -and $lsProjects -eq $null)
        {
            #schedule next server task and change the client side project status to not scheduled
            Set-NextProject -sARTServerUri $sARTUri -vision $vision -project $projectId
            $lsTasks=[array](Get-PendingTasks -sARTUri $sARTUri -projectId $projectId)
            $bClientProjectScheduled=$false
        }
        elseif ($bClientProjectScheduled)
        {
            #there is ongoing project in the client, then continue
            continue
        }


    #there is no client side project scheduled and we have pending task in client side, then schedule one  

    
        Write-Host -Object "$((Get-Date).tostring())# Executing $($lsTasks[0])..." -ForegroundColor DarkMagenta -BackgroundColor White
        
        if($lsTasks[0] -eq $Task.taskVMDeployment)
        {
            
            Write-Host -Object "#schedule server side task vm deployment" -ForegroundColor DarkMagenta -BackgroundColor White
            iex ((New-Object System.Net.WebClient).DownloadString("$sARTServerUri/api/ps/VMDeployment@VMDeployment.ps1"))
            Set-NextProject -sARTServerUri $sARTUri -vision $vision -project $projectId
        }
        elseif($lsTasks[0] -eq $Task.taskVHDCheckin)
        {
            #schedule server side task vhd checkin   
            Write-Host -Object "#schedule server side task vhd checkin" -ForegroundColor DarkMagenta -BackgroundColor White
            iex ((New-Object System.Net.WebClient).DownloadString("$sARTServerUri/api/ps/VMDeployment@VHD_Checkin.ps1"))
            Set-NextProject -sARTServerUri $sARTUri -vision $vision -project $projectId
        }
        elseif($lsTasks[0] -eq $Task.taskVHDSeriesManagement)
        {
            #schedule VHD Series management
        }
        else
        {
            #schedue client side task, and flip client project schedule status
            Write-Host -Object "#schedue client side task, and flip client project schedule status" -ForegroundColor DarkMagenta -BackgroundColor White
            New-ClientSideProjectBasedOnTask -sARTUri $sARTUri -visionName $vision -vmName $sVMClientId.ToUpper() -taskName $lsTasks[0] -blueprintName $blueprint -ServerSideProjectId $projectId
            $bClientProjectScheduled=$true
        
        }
    

}




