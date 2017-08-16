#this is media detector, it will detect new media and schedule the media when time permits
$sARTUri='http://mvf1:3000'
$sARTServerUri=$sARTUri
$taskMediaDetection="Media_Detection"
$taskVMDeployment="VM_Deployment"
$taskNewCheckPoint="New_CheckPoint"
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
if($DebugPreference -eq "Continue"){
    $debugPID=6524
}
$projectFeed=Get-SettingForProcess -sARTUri $sARTUri -key ProjectFeed -processId $debugPID -dorm $computerName
$projectDorm="Dorm_$computerName"
$vision=$projectFeed.vision
$blueprint=$projectFeed.blueprint
$projectId=$projectFeed.projectId
$sVMClientId=$projectFeed.vmId
#create ui identifier
$Host.UI.RawUI.WindowTitle ="$blueprint==$projectId==$debugPID"

while($true){
    Start-Sleep -Seconds 10
    $lsProjects=$null
    $lsProjects=[array](Get-ProjectsInMachine -sARTServerUri $sARTUri -sMachineName $sVMClientId)



    $lsTasks=[array](Get-PendingTasks -sARTUri $sARTUri -projectId $projectId)

    #if # of task is 0, then quit the node watch. we are all set with this project
        if($lsTasks.Length -eq 0){
            break;
        }

    #if current project is null and current project length is greater than 0 and current project is equivalent to client task, then continue
        if($lsProjects -ne $null -and $lsProjects.Length -gt 0 -and $lsProjects[0] -eq $lsTasks[0])
        {
            continue
        }


    #if current task is different from what we see in the client, then schedule current task

    #if current task is vm deployment, then deploy the vm
        if($lsTasks[0] -eq $taskVMDeployment)
        {
            iex ((New-Object System.Net.WebClient).DownloadString("$sARTServerUri/api/ps/VMDeployment.ps1"))
            Set-NextProject -sARTServerUri $sARTUri -vision $vision -project $projectId
        }
        elseif($lsTasks[0] -eq $taskNewCheckPoint){
        }
        else{
            #the current task is client side task
            New-ClientSideProjectBasedOnTask -sARTUri $sARTUri -visionName $vision -vmName $sVMClientId.ToUpper() -taskName $lsTasks[0] -blueprintName $blueprint
            
            #validate if this is a new task

        
        }
    

}




