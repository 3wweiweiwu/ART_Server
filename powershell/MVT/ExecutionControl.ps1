

$sARTUri='http://mvf1:3000'

$DebugPreference="Continue"
$DebugPreference='SilentlyContinue'
iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/ARTLibrary.ps1"))
iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/MediaInstallation@MediaInstallationLibrary.ps1"))
iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/Library.ps1"))
iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/CommonHeader.ps1"))

$taskName=$Task.taskResume


#Including
$sParentFolder="c:\mvt2\mvt"
$sResultFolder=$sParentFolder
$localSetting=Join-Path -Path $sParentFolder -ChildPath localsetting.ini

#Initialization
    
    $iSelenium_MultiThreading_Count=Load-Setting -sARTServerUri $sARTUri -project $blueprint -task $taskName -key iSelenium_MultiThreading_Count
    $Subtestcase_Detection=Load-Setting -sARTServerUri $sARTUri -project $blueprint -key Subtestcase_Detection #default value YES#potential result yes/no. If yes, then find subtestcase, otherwise, testcase name has to be exact the same
    $iRestartAfterScripts=Load-Setting -sARTServerUri $sARTUri -project $blueprint -task $taskName -key iRestartAfterScripts
    $iMaxTrial=Load-Setting -sARTServerUri $sARTUri -project $blueprint -task $taskName -key iMaxTrial
    $iErrTestCasePerPlan=Load-Setting -sARTServerUri $sARTUri -project $blueprint -task $taskName -key iErrTestCasePerPlan
    $iTimeout=Load-Setting -sARTServerUri $sARTUri -project $blueprint -task $taskName -key iTimeout        
    $P4_Project_Support=[array](Load-Setting -sARTServerUri $sARTUri -project $blueprint -key P4_Project_Support)
    $P4_Work_Space_Folder=Load-Setting -sARTServerUri $sARTUri -project $blueprint -key P4_Work_Space_Folder
    $CSharp_Sln_List=Load-Setting -sARTServerUri $sARTUri -project $blueprint -key CSharp_Sln_List
    $Email_List=Load-Setting -sARTServerUri $sARTUri -project $blueprint -task $taskName -key 'Email_List'
    $vhdId=Load-Setting -sARTServerUri $sARTUri -vision $vision -task $Task.taskVMDeployment -key "base_vhd_path" -LoadOnce
    


    $CQList=Get-CQList -sProjectFolder $sProjectFolder
#Declaration
$Result_Merge_Mode="NewIteration"    
$iRestartToken=0
#Launch Performance Base




#Converting support folder from p4 format into normal format


for($i=0;$i -lt $P4_Project_Support.Count;$i++)
{
    $P4_Project_Support[$i]=Convert-P4LocationToWinLocation -P4Location $P4_Project_Support[$i] -P4_Work_Space_Folder $P4_Work_Space_Folder
}



$P4_Project_Support=[array]($P4_Project_Support|select -Unique)
$lsProjectScript=Get-ScriptFileList -sProjectFolders $P4_Project_Support
$lsScriptCQ=[array](Get-CQList -lsProjectScript $lsProjectScript)
#Test whether the remote result file folder exists or not. If it is exist, te
$bResultDetailUpload=$false


#Find sln file in folders synced from p4

$lsSlnPath=@()
$sSlnPathList=""
if ($CSharp_Sln_List -eq "NoResult")
{
    $lsSlnPath=@()
    $sSlnPathList=""
    foreach($item in $P4_Project_Support)
    {
        $lsSlnPath+=@((Get-ChildItem -Path $item -Recurse|where{$_.Name.tolower() -like "*.sln"}).FullName)
    }
    $lsSlnPath=$lsSlnPath|where{$_ -ne $null}


    $lsSlnPath|foreach{$sSlnPathList+=","+$_}
    $CSharp_Sln_List=$lsSlnPath|select -Unique
    Write-Setting -sARTServerUri $sARTUri -project $blueprint -key CSharp_Sln_List -value $sSlnPathList

}
$CSharp_Sln_List=$CSharp_Sln_List|select -Unique

#Map CQ from sln file
Write-Host -Object "Start to Map CQ from Sln file, please wait...." -ForegroundColor Yellow
$lsMstestCQMap=Get-MStestCQMapFromSlnList -lsSlnPath $CSharp_Sln_List
Write-Host -Object "Mapping Done" -ForegroundColor Yellow

#Rebuild All the file
foreach($sln in $CSharp_Sln_List)
{
    #remove dll items in the build path
    if($sln -eq $null -or $sln -eq "")
    {
        continue
    }
    $sBuildPath=Get-BuildPathFromSln -slnPath $sln
    Get-ChildItem -Path $sBuildPath|where{$_.Name -match ".dll"}|Remove-Item -Force
    Build-Project -msBuild "" -slnPath $sln -rebuild -CompressOutput
}

$lsThreadObjInfo=@(); #this list contain obj that associate with a thread
$lsThread=@() #this list contain information of each thread we execute

while ($true)
{
    $iRestartToken++
    #Clean up SilkTest project to avoid tag problems
    foreach($File in $P4_Project_Support)
    {
        #Get Rid of [FileList] to enable silktest clean execution
        
        if($File -eq $null){continue}
        $sVtpFileName=((dir (Join-Path -Path $File -ChildPath *.vtp*)).FullName)
        if($sVtpFileName -eq $null)
        {
            continue
        }
        else
        {
            $sProjectini=$sVtpFileName.replace("vtp","ini")
        }
        
        
        


        #perform a check on vtp file
        if((Test-Path -Path $sProjectini) -eq $false)
        {
            continue
        }
    
        $sProjectiniFile=Get-Content -Path $sProjectini
        $lsProjectini=@()
        $bFileListSection=$false
        foreach($_ in $sProjectiniFile)
        {
            if($bFileListSection -eq $true)
            {
                if($_ -notmatch "\[" -and  $_ -notmatch "]"){continue}
                else {$bFileListSection=$false}

            }
        
        

            if($_ -match "FileList")
            {
               $lsProjectini+=$_
               $lsProjectini+=""
                $bFileListSection=$true
            }
            else
            {
                if($_ -match "ResultsPath=")
                {continue}
                else
                {$lsProjectini+=$_}            
            
            }
        }
        $lsProjectini|Out-File -FilePath $sProjectini -Encoding ascii

        #Set [ResultsExport]Field to make sure that it will export right file
        if($sProjectini -ne $null -and (Test-Path $sProjectini))
        {
            Write-ValueToSetting -Path $sProjectini -Key ErrorCount -Value TRUE
            Write-ValueToSetting -Path $sProjectini -Key TestCase -Value TRUE
            Write-ValueToSetting -Path $sProjectini -Key Machine -Value TRUE
            Write-ValueToSetting -Path $sProjectini -Key WarningText -Value TRUE
            Write-ValueToSetting -Path $sProjectini -Key WarningCount -Value TRUE
            Write-ValueToSetting -Path $sProjectini -Key Elapsed -Value TRUE
            Write-ValueToSetting -Path $sProjectini -Key ErrorText -Value TRUE
            Write-ValueToSetting -Path $sProjectini -Key DateTime -Value TRUE
            Write-ValueToSetting -Path $sProjectini -Key TestData -Value TRUE
            Write-ValueToSetting -Path $sProjectini -Key Script -Value TRUE
            Write-ValueToSetting -Path $sProjectini -Key TestPlan -Value TRUE
        }
    }
    
    
    
    #Read from Queue to pick-up the execution
    Write-Host "Read from Queue to pick-up the execution"
    
    [array]$lsQueue=@()
    [array]$lsQueue+=Get-Content -Path (Join-Path -Path $sResultFolder -ChildPath "ExecutionQueue.inc")
    

    $lsRecord=Import-Csv -Path (Join-Path -Path $sResultFolder -ChildPath "Progress.csv")    
    
    #When the number of failures>=number of testcases per plan, then generate the plan file and add it to the queue. When there is no member in the queue, then flush everything out
    
    
    [array]$lsTemp=[array]($lsRecord|where{([int]($_.Iteration) -gt 0)-and([int]($_.Iteration) -le [int]($iMaxTrial))-and(($_.Result -eq "")-or($_.Result -eq $null))})
    $lsPlan=@()
    Write-Host ("check whether the new plan should be generated. #Current Failures="+$lsTemp.Length+"   #Failure cases per plan"+$iErrTestCasePerPlan+"    #Tasks in the queue"+$lsQueue.Length)
    
    if (($lsTemp.Length -ge $iErrTestCasePerPlan)-or($lsQueue.Length -eq 0))
    {
        #IF the queue is empty, then update the search criteria, and run all of the empty case
        if($lsQueue.Length -eq 0)
        {
            [array]$lsTemp=$lsRecord|where{(([int]$_.Iteration) -le $iMaxTrial)-and(($_.Result -eq "")-or($_.Result -eq $null))}
        }
        
        
        #if there is no content in the lsTemp, it means that all the scripts within the csv file has been executed and fulfill all the execution requirements
        if ($lsTemp.Length -eq 0) 
        {
            Write-Host ("All the scripts has been executed successfully")
            break
        }                        
        Write-Host ("New plan file is generating")
        
        $iNumberInPlan=0
        foreach($sTemp in $lsTemp)
        {
            $iNumberInPlan++
                            
            #Figure out where the script comes from
            if ($sTemp.Find_In_Script -match ".t" -or $sTemp.Find_In_Script -match ".cs")
            {
                $sTemp1=$sTemp.Find_In_Script
            }
            else
            {
                $sTemp1=$sTemp.Script_Name
            }
            $sTemp_ScriptLocation=$sTemp1
                        
            #This place is for Silk Classic Only
            if($sTemp.Find_In_Script.replace(" ","") -like "*.t")
            {            
                #generate plan file                
                $lsPlan=GeneratePlanFile $sTemp_ScriptLocation $sTemp.Sub_TestCase           
            
            
                #add the new plan file's name to the queue and generate the plan file
                $sPlanFileLocation=(Join-Path -Path $sResultFolder -ChildPath ($sTemp.Sub_TestCase+"_"+(Get-Date -f ddMMyyyy_hhmmss).ToString()+ ".pln"))
                $sNewPlanFileLocation=$sPlanFileLocation
                $ProjectFileLocation=FindSolution -sCurrentFolder $sTemp_ScriptLocation
                $sPlanFileLocation="partner.exe -proj '$ProjectFileLocation' -q -resextract -resexport -r '$sNewPlanFileLocation'"
                [string]$Temp=[char]13+$sTemp -as [string]
                #Output the result into plan file
                #Add-Content $sPlanFileLocation $lsPlan -Encoding Ascii
                $lsPlan|Out-File -FilePath $sNewPlanFileLocation
            }
            else
            {
                #Put Sub_Testcase into the queue because that's only identifer we used for mstest project
                $sPlanFileLocation=$sTemp.Sub_TestCase
            }
            #update the queue
            [array]$lsQueue=Get-Content -Path (Join-Path -Path $sResultFolder -ChildPath "ExecutionQueue.inc")
            $lsQueue+=($sPlanFileLocation)
            $currentJobList=[array]((Get-Job).Name)

            if($currentJobList -eq $null)
            {
                $currentJobList=@()
            }
            
            #Dont put current job into the plan file
            if($currentJobList.Contains($sPlanFileLocation))
            {
                $iNumberInPlan--
            }
            else
            {
                $lsQueue|Out-File -FilePath (Join-Path -Path $sResultFolder -ChildPath "ExecutionQueue.inc")

            }


            
        

            
            if($iNumberInPlan -ge $iErrTestCasePerPlan)
            {
                break
            }
        }
                        

        


        
        
        
        
        


    }   
    
    
    #Check the next plan file and see whether there is any testcase inside require to execute in sequence
    Write-Host ("Sequence Check Start")
    #An exmaple of $lsQueue[$lsQueue.Length-1] is "partner.exe -proj 'C:\p4\qe\dev\AUTOMATION\Aspen Plus\MyLibraryV8.8\AspenPlus.vtp' -q -resextract -resexport -r 'C:\p4\qe\dev\AUTOMATION\BAF\AutomaticRegressionFramework\Version\V5\CQ00247893.pln'"
    #Cut the string and ony going to get the plan file part
    
    #Check if next task is a silk project or not. If so, we are going to do a sequence check

    $nextTask=$lsQueue[$lsQueue.Length-1]
    if($nextTask -match "partner.exe")
    {
        $PlanStringIndex1=$lsQueue[$lsQueue.Length-1].IndexOf(" -r ")+5
        $PlanFileLocation=$lsQueue[$lsQueue.Length-1].Substring($PlanStringIndex1,$lsQueue[$lsQueue.Length-1].Length-$PlanStringIndex1-1)
    
        $lsTemp=[array](Get-Content -Path $PlanFileLocation)

        if($lsTemp[0] -eq "//Sequence Check Done")
        {
            Write-Host ("Sequence Check has performed before. Move on without further execution")
        }
        else
        {
            #Get testcase that we are going to execute
            $lsCQ=@()
            $lsScript=@()
            foreach($Entry in $lsTemp)
            {
                if($Entry -match "script:")
                {
                    $lsScript+=@($Entry.Replace("[ ] script: ",""))
                }
                if($Entry -match "testcase:")
                {
                    $lsCQ+=@($Entry.Split(":")[1].Replace(" ",""))
                }
            }

            # TBD: Check with the server to see whether we should execute the specified testcase or not
        
            #Check against the record to see whether there is a need for the sequencial execution
        
            $lsPlan=@("//Sequence Check Done")
            $iScriptIndex=-1
            foreach($sCQ in $lsCQ)
            {
                $iScriptIndex++


                [string]$Sequence=($lsRecord|where{$_.Sub_TestCase -eq $sCQ}).Sequence
                if($Sequence -eq "" -or $Sequence -eq $null -or ($Sequence.Replace(" ","").Length -eq 0))
                {
                    $Sequence="1_"+$sCQ
                }
                #To which point silktest will execute. The example format is 1_CQ1,CQ2, it menas that we are going to execute to CQ1
                $SequenceIndex=[int]($Sequence.Split("_")[0])
            
                #Convert sequence string into sequence list
                $lsSequence=[array]($Sequence.Remove(0,"$($Sequence.Split("_")[0])_".Length).Split(",")|where{$_ -ne "" -and $_ -ne $null})
                
                #Add the sequence that is required by the testcase
                for($iSequence=0;$iSequence -lt $SequenceIndex;$iSequence++)
                {
                    $CQScriptInfo=Get-CQFromScript -ExpectedScript (Split-Path -Path $lsScript[$iScriptIndex] -Leaf) -sCQ $lsSequence[$iSequence] -lsProjectScript $lsProjectScript -lsScriptCQ $lsScriptCQ
                    #If we can find the specific CQ, then generate new plan file otherwise log the error info to the server
                    if ($CQScriptInfo[0] -eq $true)
                    {
                        $ScriptFolder=Get-ScriptFolder -sProjectFolder (Split-Path -Path (FindSolution -sCurrentFolder (Split-Path -Path $lsScript[$iScriptIndex] -Parent)) -Parent)
                        $lsPlan+=GeneratePlanFile -sScriptLocation $CQScriptInfo[1] -sTestCase ($CQScriptInfo[2].Replace(",",""))
                    }
                    else
                    {
                        Write-Host ("Sequence Check found ERROR: Cannot find $sCQ from $sProjectFolder")
                    }
                }
            
            }

        
            #Check to see whether the plan file is empty or not. If the plan file is empty, then remove the last item from the execution queue
            $bEmpty=$true
            foreach($Entry in $lsPlan)
            {
                if ($Entry -match "testcase:")
                {
                    $bEmpty=$false
                    break
                }
            }
            $lsNewQueue=@()
            #if the plan file is empty, then output the progress in the local machine as well as server side
            if($bEmpty)
            {
                for($i=0;$i -lt $lsQueue.Length-1;$i++)
                {
                    $lsNewQueue+=$lsQueue[$i]
                }
                $lsNewQueue|Out-File (Join-Path -Path $sResultFolder -ChildPath "ExecutionQueue.inc")
                $lsQueue=$lsNewQueue
            
                Output-Result -lsRecord $lsRecord -sResultFolder $sResultFolder -sServerDirectory $sServerDirectory
            
                continue
            }
            else
            {
                $lsPlan|Out-File -FilePath $PlanFileLocation
            }


        

        }

    }

    
    
    #Fire execution if there is something in the queue otherwise just quit the loop
    
    Write-Host ("#Fire execution if there is something in the queue otherwise just quit the loop")
    

    
    
    if ($lsQueue.Length -gt 0)
    {
        
        $sTemp=Get-FirstItemInExecutionQueue -sResultFolder $sParentFolder -bIsDequeue $false
        $Entry=$null
        $Entry=$lsRecord|where{$_.Sub_TestCase -eq $sTemp}
        if($Entry.Iteration -gt $iMaxTrial)
        {
            Write-Host "Incorrect iteration has been detected in current execution queue, fixing it right now...."
            $sTemp=Get-FirstItemInExecutionQueue -sResultFolder $sParentFolder -bIsDequeue $true
            continue
        }

        $bNextProjectSilk=$false
        if($sTemp -match "partner.exe")
        {
            $bNextProjectSilk=$true
        }
        #Get the Initial process list
        $lsInitialProcess=[array]((Get-Process).ProcessName)
        
        $bDequeue=$true#In current execution, shall we dequeue in item in the executionQueue.inc? For Silk Classic execution, it is true all the time because we also accept one instance. However, for MSTEST, it depends on whether we start new execution
        
        #Check what's next project. If it is silk project, then we are going to use silk way to start project
        if($bNextProjectSilk)
        {

            

            #Get testcase name for current execution

            $sTestCase=Get-SilktestCQFromExecutionCommand -Command $sTemp

            Write-Host ("Execute $sTemp")

            #Execute the command to run silktest script
            Invoke-Expression -Command $sTemp
            #&partner.exe -proj "$((dir (Join-Path -Path $sProjectFolder -ChildPath *.vtp*)).FullName)" -q -resextract -resexport -r "$sTemp"
            $iTime=0
            while ((Get-Process|where{$_.ProcessName -eq "partner"}) -eq $null)
            {            
                Start-Sleep -Seconds 1
                $iTime++
                Write-Host ("Waiting for partner.exe to launch")
                if ($iTime -ge $iTimeout)
                {
                    break
                }
            }
            Write-Host ("Waiting for execution to finish")

            
            
            
            #wait until execution is done
            while ((Get-Process|where{$_.ProcessName -eq "partner"}) -ne $null)
            {
            
            
                $Exp=$null
                $Exp=Get-Process -Name explorer
                if($Exp -eq $null)
                {
                    Start-Process explorer.exe
                    Start-Sleep -Seconds $iTimeout
                }

            
            
                Start-Sleep -Seconds 10

                Write-Host ("The execution is in progress")

                [array]$LicenseUnavailable=Get-Process|where{$_.MainWindowTitle -match "License Unavailable"}
                if($LicenseUnavailable.Length -gt 0)
                {
                    $LicenseUnavailable|Stop-Process -Force
                    Get-Process|where{$_.ProcessName -eq "partner"}|Stop-Process -Force
                    Write-Host ("License is unavailable while executing $($PlanFileLocation)")
                }
                #HeartBeatUpdate -Status ("Resume")
                if($Exp.Responding -eq $false)
                {
                
                    Write-Host ("explorer frozen detected")
                    Stop-Process -Name explorer
                    Start-Sleep -Seconds 60
                }
            }

            
        }
        else
        {
            #If next project is nonsilk, then we assume it to be mstest project
            
            if($Subtestcase_Detection -match "YES")
            {
                $lsSubTestCase=[array]($lsMstestCQMap|where{$_.Sub_TestCase -match $sTemp -or $sTemp -match $_.Sub_TestCase})
            }
            else
            {
                $lsSubTestCase=[array]($lsMstestCQMap|where{$_.Sub_TestCase -eq $sTemp})
            }
            
            if($lsSubTestCase.Count -gt 0)
            {
                $objSubTestRecord=$lsSubTestCase[0]
            }            
            
            
            
            
            if($lsThread.Count -lt $iSelenium_MultiThreading_Count)
            {
                $lsThreadObjInfo+=@($objSubTestRecord)
                Write-Host ("Currently Running - "+$objSubTestRecord.Sub_TestCase)
                

                #start job for execution
                $job=Start-Job -ArgumentList $objSubTestRecord,$sParentFolder -Name ($sTemp) -ScriptBlock{
                    param($objSubTestRecord,$sParentFolder)
                    .(Join-Path -Path $sParentFolder -ChildPath wwwErrorAnalysis.ps1)
                    $newResultName=Run-MSTest -Find_In_CsProj $objSubTestRecord.Find_In_CsProj -dll $objSubTestRecord.Find_In_Dll -testCase $objSubTestRecord.Sub_TestCase
                    $sRexLocation=Join-Path -Path $sParentFolder -ChildPath $newResultName                    
                    
                    return $sRexLocation
                }
                
                
                

                #create respective dialogbox to indicate current progress
                $msg=Start-Job -Name ($job.Name+"_dlg") -ArgumentList $job -ScriptBlock{
                    param($job)
                    $sPid=("PID-$PID")
                    $sPid    
                    [System.Reflection.Assembly]::LoadWithPartialName("System.Windows.Forms") |Out-Null
                    $Status=[System.Windows.Forms.MessageBox]::Show("Current executing $($job.name), Do you think we shall fail it?" , "Status")
    
                }
                
                #get pid info of dialogbox we just created
                while($true)
                {
                    $PIDInfo=Receive-Job -Job $msg
                    Start-Sleep -Seconds 1
                    if($PIDInfo -match "PID-")
                    {
                        $iPID=$PIDInfo.Replace("PID-","")
                        break
                    }
                }

                #Create a object to store lsThreads
                $Obj=New-Object PSObject
                $Obj|Add-Member -MemberType NoteProperty -Name "ExecutionID" -Value $job.Id
                $Obj|Add-Member -MemberType NoteProperty -Name "DialogJob" -Value $msg
                $Obj|Add-Member -MemberType NoteProperty -Name "DialogPID" -Value $iPID

                $lsThread+=@($Obj)

            }
            else
            {
                #not dequeue this time because we don't start new execution
                $bDequeue=$false;
                $iRestartToken--
            }
        }
        

        #generate dialogbox
        
        if($bDequeue)
        {                    
            #Delete the last task in the queue because it has been done
            Write-Host ("#Delete the last task in the queue("+$PlanFileLocation+") because it has been done")
            $lsQueOutput=@()
            #get rid of last item in the queue
            if($lsQueue.Length -ge 1)
            {        
                for($i=0;$i -lt $lsQueue.Length-1;$i++)
                {            
                    $lsQueOutput+=$lsQueue[$i]
                }
            }
            $lsQueOutput|Out-File (Join-Path -Path $sResultFolder -ChildPath ExecutionQueue.inc)   
        }

        
        


        
        [gc]::Collect()


    }
    else
    {
        Write-Host ("The queue is empty, quit the queue")
        break
    }   
    if($bNextProjectSilk)
    {
        #After the execution, record the location of latest .rex file    
        $sRexLocation=$PlanFileLocation.Split(".")[0]+".rex"

 

        #Analyze whether the .rex file is generated or not. If not, then throw an error and go. IF yes, then update the .res file and .xlg file into the remote server
        Write-Host ("#Analyze whether the .rex file is generated or not. If not, then throw an error and go")
    
        if ((Test-Path -Path $sRexLocation) -eq $false)
        {
            Write-Host ("Fail to Find .rex file in "+$sRexLocation)
            continue
        }
        else
        {

            if($bResultDetailUpload)
            {
                Copy-Item -Path $sRexLocation.replace(".rex",".res") -Destination $Result_Upload_Batch_Folder -Force
                Copy-Item -Path $sRexLocation.replace(".rex",".xlg") -Destination $Result_Upload_Batch_Folder -Force
            }
        }


        $lsRex=Get-Content -Path $sRexLocation

    
        #Result Analysis to the failed testcase. Log pass, add iteration if failed. #If one testcase is executed more than one time in a specified plan file, then it might cause trouble
        Write-Host ("Result Analysis")

        foreach($sRex in $lsRex)
        {
            if($sRex.StartsWith([char]34))
            {
                $lsDetail=ResultDetailGenerator($sRex)
                #If the script pass, then log the result. If not, then check whether the number exceed maximum number of trials, if not, then add the number. When the number of failures>=number of testcases per plan, then generate the plan file and add it to the queue
                if($lsDetail[1] -eq 0)
                {
                    #log pass
                    #Process one result at a time because some times people might enter duplicate value
                    $Entry=([array]($lsRecord|where{$_.Sub_TestCase.replace(" ","") -eq $lsDetail[0].replace(" ","")}))
                    $Entry[0].Result="PASS"
                }
                else
                {
                    #check whether the number exceed maximum number of trials, if not, then add the number by 1, and log the result for the iteration
                    #Add iteration number by 1
                    $Entry=([array]($lsRecord|where{$_.Sub_TestCase.replace(" ","") -eq $lsDetail[0].replace(" ","")}))
                    $iTemp=$Entry[0].Iteration -as [int]
                    $iTemp++
                    $Entry[0].Iteration=$iTemp
                    $Entry[0].Detail+="[Iteration "+$iTemp.ToString()+"]: "+$lsDetail[2]+[char]13
                    #if number exceed the maximum number, Perform detail analysis and log the result
                    if($Entry[0].Iteration -gt $iMaxTrial)
                    {
                        $Entry[0].Result=DetailAnalyzer($lsDetail[2])
                    }
               
                }
            }
        

        }

    }
    else
    {
        
        $completeJobList=@()

        

        foreach($item in $lsThread)
        {
            $job=Get-Job -Id $item.ExecutionID
            $msg=$item.DialogJob
            #if execution job is done, then move to complete list
            if($job.State -eq "Completed")
            {
                $completeJobList+=$item
            }
            
            #if message box has been closed, then stop execution job as well
            if($msg.State -eq "Completed")
            {
                Write-Host "#if msg box been closed properly, then it means that we want to stop associated mstest execution"
                $job.StopJob()
                $completeJobList+=$item 
                #TODO-MARK FAIL IN THE EXCEL SPREADSHEET DIRECLY
                ($lsRecord|where{$_.Sub_TestCase -eq $job.Name}).Result="TBD"
                ($lsRecord|where{$_.Sub_TestCase -eq $job.Name}).Iteration=[int]$iMaxTrial+1
            }


        }
        
        if($completeJobList.Count -gt 0)
        {
            #We don't use for loop here because we are going to process these things one at a time
            $completeJob=$completeJobList[0]
            Write-Host ("Run Complete - "+(Get-Job -Id $completeJob.ExecutionID).Name)

            #get the index of complete and get data out of it
            $indexData=$lsThread.IndexOf($completeJob)
            $objSubTestRecord=$lsThreadObjInfo[$indexData]

            $sRexLocation=Receive-Job -id $completeJob.ExecutionID
            
            #remove job from job list/lsthread queue/lsthread data queue
            Remove-Job -Id $completeJob.ExecutionID -Force 
            $lsThread= $lsThread|where{$_ -ne $completeJob}
            $lsThreadObjInfo=$lsThreadObjInfo|where{$_ -ne $lsThreadObjInfo[$indexData]}

            #kill the dialog box and remove its job from job list
            Stop-Process -Id $completeJob.DialogPID -Force
            Remove-Job -Job $completeJob.DialogJob -Force                
            


        }
        else
        {
            #if there is no task complete, then we will continue looping until something finished
            continue
            $iRestartToken--
        }
        
        
        
        #copy result location to result upload folder
        if((Test-Path -Path ($sRexLocation.replace(".rex",".res"))) -and  (Test-Path -Path ($Result_Upload_Batch_Folder)))
        {
            Copy-Item -Path $sRexLocation.replace(".rex",".res") -Destination $Result_Upload_Batch_Folder -Force
        }
        

        #Analyze result file
        $rexResult=Run-MSTestResultAnalysis -sResultPath $sRexLocation

        #Convert .trx to html
        #$sTrx2HtmlExe=Join-Path -Path $sParentFolder -ChildPath "ARTSetting\trx2Html\trx2html.exe"
        #&$sTrx2HtmlExe $sRexLocation
        

        #Update result Structure
        #If the script pass, then log the result. If not, then check whether the number exceed maximum number of trials, if not, then add the number. When the number of failures>=number of testcases per plan, then generate the plan file and add it to the queue
        if($rexResult.Result -eq "Passed")
        {
            #log pass
            #Process one result at a time because some times people might enter duplicate value
            $Entry=([array]($lsRecord|where{$_.Sub_TestCase.replace(" ","") -eq $objSubTestRecord.Sub_TestCase.replace(" ","")}))
            $Entry[0].Result="PASS"
        }
        else
        {
            #check whether the number exceed maximum number of trials, if not, then add the number by 1, and log the result for the iteration
            #Add iteration number by 1
            $Entry=([array]($lsRecord|where{$_.Sub_TestCase.replace(" ","") -eq $objSubTestRecord.Sub_TestCase.replace(" ","")}))
            $iTemp=$Entry[0].Iteration -as [int]
            $iTemp++
            $Entry[0].Iteration=$iTemp
            $Entry[0].Detail+="[Iteration "+$iTemp.ToString()+"]: "+$rexResult.Comment+[char]13
            #if number exceed the maximum number, Perform detail analysis and log the result
            if($Entry[0].Iteration -gt $iMaxTrial)
            {
                $Entry[0].Result="TBD"
            }
               
        }


    }
    #Upload Result file to remote folder
    
    

    #output the new new progress file to the server as well as local domain
    Write-Host ("Output the new new progress file")
  
    Output-Result -lsRecord $lsRecord -sResultFolder $sResultFolder -sServerDirectory $sServerDirectory

    # When the number of failures>=number of testcases per plan, then restart the computer to prepare the environment for the next execution.
    
    $sParentFolder=[System.IO.Path]::GetDirectoryName($myInvocation.MyCommand.Definition)
    [array]$lsQueue=Get-Content -Path (Join-Path -Path $sResultFolder -ChildPath "ExecutionQueue.inc")
    [array]$lsTemp=$lsRecord|where{($_.Iteration -gt 0)-and($_.Iteration -le $iMaxTrial)-and(($_.Result -eq "")-or($_.Result -eq $null))}
    Write-Host ("#of testcases fall within the re-execution region="+$lsTemp.Length+" # of scripts executed="+$iRestartToken+"")
    $lsPlan=@()
    if (($lsTemp.Length -ge $iErrTestCasePerPlan)-or($lsQueue.Length -eq 0)-or($iRestartToken -ge $iRestartAfterScripts))
    {
        Write-Host ("Prepare to Restart the computer")
        #Zerolize restart token
        $iRestartToken=0
        #if there is no content in the lsTemp, it means that all the scripts within the csv file has been executed and fulfill all the execution requirements. Quit the execution
        if (($lsTemp.Length -eq 0) -and ($lsQueue.Length -eq 0))
        {
            $lsTemp=$lsRecord|where{(([int]$_.Iteration) -le $iMaxTrial)-and(($_.Result -eq "")-or($_.Result -eq $null))}
            if($lsTemp.Length -eq 0)
            {
                Write-Host ("No testcases are within execution range and no scripts in the queue, all the execution finish successfully")
                break    
            }
        }

        #restart the computer
        Restart-Computer -Force
        Start-Sleep -Seconds 3600
        Restart-Computer -Force
    }                        


}
if (($lsRecord|where ($_.Result -eq "")).Length -eq 0)
{
    $json=$lsRecord|ConvertTo-Json -Depth 99
    Write-Setting -sARTServerUri $sARTUri -project $blueprint -key ExecutionResult -value $json
    
    $lsRecord|Export-Csv -Path (Join-Path -Path $sResultFolder -ChildPath "ExecutionResult.csv")
    $startTime=Load-ValueFromSetting -SettingPath $localSetting -Value Plan_Generation_Time
    
    $vhdInfo=Get-VHDFromServer -sARTUri $sARTUri -vhdID $vhdId
    $html=[string](generateHTMLfromCSV -media ($vhdInfo.content.installed_media.name) -startTime $startTime -endTime (Get-Date) -resultsFile (Join-Path -Path $sResultFolder -ChildPath "ExecutionResult.csv") -clientConfig $((Get-WmiObject -Class Win32_OperatingSystem).Name) -clientName $env:COMPUTERNAME)
    $attachmentPath=(Join-Path -Path $sResultFolder -ChildPath "ExecutionResult.csv")
    
    Send-MailMessage -Attachments @($attachmentPath) -From "MVT@aspentech.com" -To $Email_List -Subject $blueprint -Body $html -SmtpServer smtp.aspentech.local -BodyAsHtml
    
    Set-NextProject -sARTServerUri $sARTUri -vision $vision -project $projectId
    #Write-ValueToSetting -Path $sParentFolder -Key "Status" -Value "Idle"   
    #&powershell.exe "$(Join-Path -Path $sParentFolder -ChildPath ClientPrep.ps1)"
}
