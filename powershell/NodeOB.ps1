#this is media detector, it will detect new media and schedule the media when time permits
$sARTUri='http://mvf1:3000'
$sARTServerUri=$sARTUri

$Task=@{
    taskMediaDetection="Media_Detection"
    taskVMDeployment="taskDeployStandardVHDImage"
    taskNewCheckPoint="New_CheckPoint"
    taskVHDCheckin="VHD_Checkin"
    taskInstallMedia="Install_Media"
}




$DebugPreference = "Continue"


$ScheduleMode=@{
    EveryNewMedia="EveryNewMedia"
}
iex ((New-Object System.Net.WebClient).DownloadString("$sARTServerUri/api/ps/VMDeployment_Library.ps1"))
iex ((New-Object System.Net.WebClient).DownloadString("$sARTServerUri/api/ps/ARTLibrary.ps1"))
iex ((New-Object System.Net.WebClient).DownloadString("$sARTServerUri/api/ps/Library.ps1"))
iex ((New-Object System.Net.WebClient).DownloadString("$sARTServerUri/api/ps/VMDeployment_Library.ps1"))
iex ((New-Object System.Net.WebClient).DownloadString("$sARTServerUri/api/ps/NodeOB_Library.ps1"))





#2nd load for debugging purpose
if($DebugPreference -eq "Continue"){
    
    $sRootFolder=Split-Path -Path ([System.IO.Path]::GetDirectoryName($myInvocation.MyCommand.Definition)) -Parent
    .(Join-Path -Path $sRootFolder -ChildPath ARTLibrary.ps1)
    .(Join-Path -Path $sRootFolder -ChildPath (Join-Path -Path "Manager" -ChildPath .\VMDeployment_Library.ps1))

}
#


#load information for current vm


$debugPID=$PID
$computerName=$env:COMPUTERNAME

$projectFeed=Get-SettingForProcess -sARTUri $sARTUri -key ProjectFeed -processId $debugPID -dorm $computerName
$projectDorm="Dorm_$computerName"
$vision=$projectFeed.vision
$blueprint=$projectFeed.blueprint
$projectId=$projectFeed.projectId
$sVMClientId=$projectFeed.vmId
#create ui identifier
$Host.UI.RawUI.WindowTitle ="$blueprint==$projectId==$debugPID"

while($true){
    #Start-Sleep -Seconds 10
    $lsProjects=$null
    $lsProjects=[array](Get-ProjectsInMachine -sARTServerUri $sARTUri -sMachineName $sVMClientId.ToUpper())

    $lsTaskInClient=[array](Get-PendingTasks -sARTUri $sARTUri -projectId $lsProjects[0]._project._id)

    $lsTasks=[array](Get-PendingTasks -sARTUri $sARTUri -projectId $projectId)

    #if # of task in server is 0, then quit the node watch. we are all set with this project
        if($lsTasks.Length -eq 0){
            break;
        }

    #if current project is null and current project length is greater than 0 and current project is equivalent to client task, then continue
        if($lsProjects -ne $null -and $lsProjects.Length -gt 0)
        {

            if($lsTaskInClient -eq $null -or $lsTaskInClient.Length -eq 0)
            {
                #client side task is ready, move toward next task
                Set-NextProject -sARTServerUri $sARTUri -vision $vision -project $projectId
                $lsTasks=[array](Get-PendingTasks -sARTUri $sARTUri -projectId $projectId)
            }
            elseif($lsTaskInClient[0] -eq $lsTasks[0]){
                #keep waiting because we are still executing the same task
                continue
            }
            
        }


    #if current task is different from what we see in the client, then schedule current task

    #if current task is vm deployment, then deploy the vm
        if($lsTasks[0] -eq $Task.taskVMDeployment)
        {
            iex ((New-Object System.Net.WebClient).DownloadString("$sARTServerUri/api/ps/VMDeployment@VMDeployment.ps1"))
            Set-NextProject -sARTServerUri $sARTUri -vision $vision -project $projectId
        }
        elseif($lsTasks[0] -eq $Task.taskVHDCheckin){
            iex ((New-Object System.Net.WebClient).DownloadString("$sARTServerUri/api/ps/VMDeployment@VHD_Checkin.ps1"))
            Set-NextProject -sARTServerUri $sARTUri -vision $vision -project $projectId
        }
        else{
            #the current task is client side task
            New-ClientSideProjectBasedOnTask -sARTUri $sARTUri -visionName $vision -vmName $sVMClientId.ToUpper() -taskName $lsTasks[0] -blueprintName $blueprint -ServerSideProjectId $projectId
            


        
        }
    

}




