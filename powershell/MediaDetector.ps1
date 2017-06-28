﻿#this is media detector, it will detect new media and schedule the media when time permits
$sARTUri='http://mvf1:3000'
$sARTServerUri=$sARTUri
$taskMediaDetection="Media_Detection"



$ScheduleMode=@{
    EveryNewMedia="EveryNewMedia"
}

iex ((New-Object System.Net.WebClient).DownloadString("$sARTServerUri/api/ps/ARTLibrary.ps1"))
iex ((New-Object System.Net.WebClient).DownloadString("$sARTServerUri/api/ps/Library.ps1"))

$projectDorm="Dorm_$($env:COMPUTERNAME)"

$vision=Get-SettingForCurrentDorm -sARTUri $sARTUri -key vision
$blueprint=Get-SettingForCurrentDorm -sARTUri $sARTUri -key blueprint
$projectId=Get-SettingForCurrentDorm -sARTUri $sARTUri -key projectId



#2nd load for debugging purpose
$sRootFolder=[System.IO.Path]::GetDirectoryName($myInvocation.MyCommand.Definition)
.(Join-Path -Path $sRootFolder -ChildPath ARTLibrary.ps1)


$sMediaPath=Load-Setting -sARTServerUri $sARTServerUri -project $blueprint -task $taskMediaDetection -key media_path
$sFamily=Load-Setting -sARTServerUri $sARTServerUri -project $blueprint -task $taskMediaDetection -key family
$lsMedia_Folder_Snapshot=[array](Load-Setting -sARTServerUri $sARTServerUri -project $blueprint -task $taskMediaDetection -key "Media_Folder_Snapshot")
$sScheduleMode=Load-Setting -sARTServerUri $sARTServerUri -project $blueprint -task $taskMediaDetection -key "schedule_mode"
$lsCurrentSchedule=[array](Load-Setting -sARTServerUri $sARTServerUri -project $blueprint -task $taskMediaDetection -key "current_schedule")

#if media folder snapshot is empty, then initalize it
if($lsMedia_Folder_Snapshot -eq ""){
    $lsMedia_Folder_Snapshot=@()
}

#get the current folder snapshot


#merge the media folder snapshot
$lsFiles=(Get-ChildItem -Path $sMediaPath -File).Name
foreach($item in $lsFiles){
    if(!$lsMedia_Folder_Snapshot.Contains($item)){
        $lsMedia_Folder_Snapshot+=@($item)
    }
}

#update the remote snapshot in the server
Write-Setting -project $blueprint -task $taskMediaDetection -key "Media_Folder_Snapshot" -value $lsMedia_Folder_Snapshot -sARTServerUri $sARTServerUri

#keep pulling the server to find out if new media is posted
while($true){
    Start-Sleep -Seconds 10

    #start of media detection
        #if new file is found, then test it
        $lsFiles=(Get-ChildItem -Path $sMediaPath -File).Name
        foreach($file in $lsFiles){
        
            #check each individual file against the snapshot to find out new staff
            $result=@($false)
            if(!$lsMedia_Folder_Snapshot.Contains($file)){
                if($file -match "upload"){
                    #if upload is detected, then just skip it
                    #just wait...
                    $result=@($false)
                }
                else{
                    #check the file pattern to understand its nature
                    $result=checkFileName -family $sFamily -fileName $file                    

                }
            
                #update the media folder snaptshot because something new is detected
                $lsMedia_Folder_Snapshot+=@($file)
                Write-Setting -project $blueprint -task $taskMediaDetection -key "Media_Folder_Snapshot" -value $lsMedia_Folder_Snapshot -sARTServerUri $sARTServerUri            

                #if the new file proved to be a media, then add that into schedule
                if($result[0] -eq $true){
                    #based on the schedule mode, decide how to invoke application
                    if($sScheduleMode -eq $ScheduleMode.EveryNewMedia){
                        $sCurrentMediaPath=Join-Path -Path $sMediaPath -ChildPath $file
                    
                        $lsCurrentSchedule=@($sCurrentMediaPath)

                        Write-Setting -project $blueprint -task $taskMediaDetection -key "current_schedule" -value $lsCurrentSchedule -sARTServerUri $sARTServerUri
                    }
                }


            }

        }    

    #end of media detection


    #start of media schedule        
        #if the first item in curernt schedule is not run, then schedule the first item
        $lsCurrentSchedule=[array](Load-Setting -sARTServerUri $sARTServerUri -project $blueprint -task $taskMediaDetection -key "current_schedule")
        if($lsCurrentSchedule.Length -gt 0 -and $lsCurrentSchedule[0] -notmatch 'run'){
            #schedule next project
            Set-NextProject -vision $vision -project $projectId

            #update current schedule queue
            $lsCurrentSchedule=@('run')+$lsCurrentSchedule
            Write-Setting -sARTServerUri $sARTServerUri -project $blueprint -task $taskMediaDetection -key current_schedule -value $lsCurrentSchedule
        }
        
    #end of media schedule

}