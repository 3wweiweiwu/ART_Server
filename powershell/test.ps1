﻿#this script is adaptor we used to run/kill process in the machine
$sARTUri='http://MVF2:3000'
$sARTServerUri=$sARTUri
$DebugPreference="Continue"
$DebugPreference='SilentlyContinue'
iex ((New-Object System.Net.WebClient).DownloadString("$sARTServerUri/api/ps/Library.ps1"))
iex ((New-Object System.Net.WebClient).DownloadString("$sARTServerUri/api/ps/ARTLibrary.ps1"))
iex ((New-Object System.Net.WebClient).DownloadString("$sARTServerUri/api/ps/MachineManagerLibrary.ps1"))

$windowTitle="ART2 Machine Manager - $($env:COMPUTERNAME)"

$Host.UI.RawUI.WindowTitle =$windowTitle

#2nd load for debugging purpose
if($DebugPreference -eq "Continue")
{
    $sParentFolder=[System.IO.Path]::GetDirectoryName($myInvocation.MyCommand.Definition)
    .(Join-Path -Path $sParentFolder -ChildPath ARTLibrary.ps1)
    .(Join-Path -Path $sParentFolder -ChildPath MachineManagerLibrary.ps1)

}




$Global:diskProfile=Get-CurrentDiskProfile

#initialize current disk space for current host
Add-NewServerToArt -sARTServerUri $sARTUri
Set-DormDiskSpace -sARTServerUri $sARTUri -dormName $env:COMPUTERNAME

#keep pulling the project that associate with this machine
#if there is project that is gone, then try to delete that
#if there is project that is in ready to schedule state, then try to schedule it



while($true){
    
    #Check _project that are in ready to run state, schedule them if we have enough resource
    #pull the project every 5 second
    Start-Sleep -Seconds 5
    Write-Host -Object "Waiting for task from server"
    $lsCurrentMachineProjects=[array](Get-ProjectsInMachine -sARTServerUri $sARTUri)
    
    #go through existing powershell console window, kill unrelated window to avoid double schedule
        Kill-UnrelatedPowershellConsole -lsProjectList $lsCurrentMachineProjects -lsException @($windowTitle)
        



    #check existing project in the machine to ensure they are up and running
        $lsRunningProject=[array](Get-RunningProject -lsCurrentMachineProjects $lsCurrentMachineProjects)
        foreach($project in $lsRunningProject){
            $recordedProcessId=$Project._project.pid
            #if recorded process id is not running in this machine, then re-invoke that
            if((Get-Process).Id -contains "$recordedProcessId" -eq $false -or $recordedProcessId -eq $null){
                Write-Warning "We are unable to find blueprint $($Project._project._bluePrint.name) with PID $recordedProcessId. Restart it"
                #if task is found, then start the script in the task
                $sPID=Invoke-LocalProject -Project $project -sARTUri $sARTServerUri        
                Start-Sleep -Seconds 10
            }
        }
    
    #Check existing project in the machine to see if they are in ready-to-delete state, if so delete
        
        $lsRetiredProject=[array](Get-RetiredProject -lsCurrentMachineProjects $lsCurrentMachineProjects)
        #for retired process, just kill it
        foreach($project in $lsRetiredProject){            
            #KILL process based on process id
            Get-Process -Id $Project._project.pid|Stop-Process -Force
            Start-Sleep -Seconds 10
            #TODO- kill VM based on VID
            #TODO- release VM Disk Space in registry

            #KILL the project in current_projects

            Remove-ProjectFromProjectCurrentProject -sARTUri $sARTServerUri -visionName $Project.vision.name -projectId $Project._project._id


        }
        
    
    
    #Schedule current project and launch first task
        $lsReadyToRunProjects=Get-ProjectsWatingForRunning -lsCurrentMachineProjects $lsCurrentMachineProjects
        foreach($project in $lsReadyToRunProjects){
            Write-Host -Object "We are about to invoke $project"
        
            #if task is found, then start the script in the task
            $sPID=Invoke-LocalProject -Project $project -sARTUri $sARTServerUri -diskProfile $diskProfile
            Start-Sleep -Seconds 5

        }

}