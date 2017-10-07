$sARTUri='http://mvf1:3000'

$DebugPreference="Continue"
$DebugPreference='SilentlyContinue'
iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/ARTLibrary.ps1"))
iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/MediaInstallation@MediaInstallationLibrary.ps1"))
iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/Library.ps1"))
iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/CommonHeader.ps1"))
$taskName=$Task.taskPlanGeneration



#Including

#$sParentFolder=[System.IO.Path]::GetDirectoryName($myInvocation.MyCommand.Definition)
$sParentFolder="c:\mvt2\mvt"

New-Item -Path $sParentFolder -ItemType directory
$localSetting=Join-Path -Path $sParentFolder -ChildPath localsetting.ini
Write-ValueToSetting -Path $localSetting -Key "Plan_Generation_Time" -Value (Get-Date).ToString()
$sResultFolder=$sParentFolder

#Input
 
    $bTestMode=$false
    
    
    $Subtestcase_Detection=Load-Setting -sARTServerUri $sARTUri -project $blueprint -key Subtestcase_Detection
    
    $P4_Project_Support=[array](Load-Setting -sARTServerUri $sARTUri -project $blueprint -key P4_Project_Support)
    $P4_Work_Space_Folder=Load-Setting -sARTServerUri $sARTUri -project $blueprint -key P4_Work_Space_Folder

    $P4_Username=Load-Setting -sARTServerUri $sARTUri -project $blueprint -key P4_Username
    $P4_Password=Load-Setting -sARTServerUri $sARTUri -project $blueprint -key P4_Password
    $P4_WorkSpaceName=Load-Setting -sARTServerUri $sARTUri -project $blueprint -key P4_WorkSpaceName    
    $P4_Server=Load-Setting -sARTServerUri $sARTUri -project $blueprint -key P4_Server
    
    
    
    $lsRecord=Load-Setting -sARTServerUri $sARTUri -project $blueprint -task $taskName -key Record
    
    
    
    $iTestCasePerPlan=1
    

    #sync automation script from p4
    Sync-FromP4 -P4_Location_List $P4_Project_Support -P4_User $P4_Username -P4_Server $P4_Server -P4_PASSWORD $P4_Password -P4_Work_Space_Folder $P4_Work_Space_Folder -P4_Work_Space_Name $P4_WorkSpaceName
    
    #Local direcotry pass technology


    #Initialization
    $iPlanLineIndex=0
    $iPlanFile=0
    $lsPlanFile=@()
    $lsScriptCQ=@(@())
    $iScriptCQIndex=-1
    $iProjectScriptIndex=-1 #Total number to scripts within our project
    $sFailtoFindTestCase="Fail to find testcases in all the script file"
    
    


#Main Program

  
#Converting support folder from p4 format into normal format
    
    
    
    for($i=0;$i -lt $P4_Project_Support.Count;$i++)
    {
        
        if($P4_Work_Space_Folder -ne (Convert-P4LocationToWinLocation -P4Location $P4_Project_Support[$i] -P4_Work_Space_Folder $P4_Work_Space_Folder) -and 
            ($P4_Work_Space_Folder+"\") -ne (Convert-P4LocationToWinLocation -P4Location $P4_Project_Support[$i] -P4_Work_Space_Folder $P4_Work_Space_Folder))
        {
            $P4_Project_Support[$i]=Convert-P4LocationToWinLocation -P4Location $P4_Project_Support[$i] -P4_Work_Space_Folder $P4_Work_Space_Folder
        }
    }

#Build a list of scripts file  
    
    
    
    $lsProjectScript=Get-ScriptFileList -sProjectFolders $P4_Project_Support
    
    $objSlnMap=Get-MStestCQMapFromSlnList -lsSlnPath $P4_Project_Support

    


#Build a list of project file
    
#Build a list of Result file    
    [array]$lsResultFiles=Get-ChildItem -Path $sResultFolder -Name| Where-Object {$_ -like "*.rex"}
#Clear all the plan file/csv/.inc track file under output folder
    $sTemp=Join-Path -Path $sResultFolder -ChildPath (Get-Date -f ddMMyyyy_hhmmss)
    Copy-Item -Path (Join-Path -Path $sResultFolder -ChildPath *.pln) -Destination $sTemp
    Copy-Item -Path (Join-Path -Path $sResultFolder -ChildPath *.csv) -Destination $sTemp
    Copy-Item -Path (Join-Path -Path $sResultFolder -ChildPath *.inc) -Destination $sTemp
    Copy-Item -Path (Join-Path -Path $sResultFolder -ChildPath *.xlg) -Destination $sTemp
    Copy-Item -Path (Join-Path -Path $sResultFolder -ChildPath *.rex) -Destination $sTemp

    Remove-Item (Join-Path -Path $sResultFolder -ChildPath *.pln) -Force
    
    Remove-Item (Join-Path -Path $sResultFolder -ChildPath *.inc) -Force
    Remove-Item (Join-Path -Path $sResultFolder -ChildPath *.xlg) -Force
    Remove-Item (Join-Path -Path $sResultFolder -ChildPath *.rex) -Force
    
    
    

    #Read remove record file
    #We are going to read local copy if we cannot establish server connection


    [array]$lsRecord=$lsRecord|Select-Object *,@{Name='SubTest_Count_bak';Expression={'0'}},@{Name='Find_In_Script';Expression={''}},@{Name='Sub_TestCase';Expression={}},@{Name='Result';Expression={}},@{Name='Detail';Expression={}},@{Name='Iteration';Expression={'0'}}
    $lsRecord|foreach{$_.SubTest_Count_bak=$_.SubTest_Count}





#Generate a list with id & script name


$lsScriptCQ=[array](Get-CQList -lsProjectScript $lsProjectScript)



#Validate whether the Script field from Query existed or not. If not, it will try to find out where is the testcases
    for($iRecordIndex=0;$iRecordIndex -lt $lsRecord.Length;$iRecordIndex++)
    {
        $CQScriptInfo=Get-CQFromScript -ExpectedScript $lsRecord[$iRecordIndex].Script_Name -sCQ $lsRecord[$iRecordIndex].id -lsProjectScript $lsProjectScript -lsScriptCQ $lsScriptCQ
        if ($CQScriptInfo[0] -eq $true)
        {
            $lsRecord[$iRecordIndex].Find_In_Script=$CQScriptInfo[1]
            $lsRecord[$iRecordIndex].Sub_TestCase+=","
            $lsRecord[$iRecordIndex].Sub_TestCase+=$CQScriptInfo[2]
        }
        else
        {
            $lsRecord[$iRecordIndex].Find_In_Script=$sFailtoFindTestCase
            $lsRecord[$iRecordIndex].Result=$sFailtoFindTestCase
        }   
        
    }


#Map CQ from sln file
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








Write-Host -Object "Start to Map CQ from Sln file, please wait...." -ForegroundColor Yellow
$lsMstestCQMap=Get-MStestCQMapFromSlnList -lsSlnPath $CSharp_Sln_List
Write-Host -Object "Mapping Done" -ForegroundColor Yellow
#Populate lsRecord with those results from sln
foreach($record in $lsRecord)
{
    try
    {
        $sNumberPart=([int]::parse($record.id.Replace("CQ",""))).ToString()
    }
    catch
    {
        $sNumberPart=""
    }
    foreach($mstest in $lsMstestCQMap)
    {
        if(($sNumberPart -ne "" -and $mstest.Sub_TestCase -match $sNumberPart) -or $record.id -match $mstest.Sub_TestCase -or $mstest.Sub_TestCase -match $record.id)
        {
            if($Subtestcase_Detection -match "no" -and $record.id -ne $mstest.Sub_TestCase)
            {
                #potential result yes/no. If yes, then find subtestcase, otherwise, testcase name has to be exact the same
                continue

            }

            if($record.Sub_TestCase -eq $sFailtoFindTestCase)
            {
                $record.Sub_TestCase=""
            }

            if($record.Find_In_Script -eq $sFailtoFindTestCase)
            {
                $record.Find_In_Script=$mstest.Find_In_Script
                $record.Result=""
            }
            
            
            $record.Sub_TestCase+=","
            $record.Sub_TestCase+=$mstest.Sub_TestCase
        }
        
    
    }
    
}


#Rearrange the Sub_TestCase field so that there is only one testcase associate with one CQ

    [array]$lsTemp=$lsRecord|where{$_.Sub_TestCase -match ","}

    foreach($sTemp in $lsTemp)
    {
        $lsRecord=$lsRecord|where{$_ -ne $sTemp}
        
        [array]$lsTemp1=$sTemp.Sub_TestCase.Split(",")|where{$_ -ne ""}
        $sTemp.SubTest_Count=$sTemp.SubTest_Count/$lsTemp1.Length            
        foreach($sTemp1 in $lsTemp1)
        {
            
            $sTemp.Sub_TestCase=$sTemp1
            $sTemp|Export-Csv -Path (Join-Path -Path $sResultFolder -ChildPath "temp.csv")
            $lsRecord+=Import-Csv -Path (Join-Path -Path $sResultFolder -ChildPath "temp.csv")
            Remove-Item -Path (Join-Path -Path $sResultFolder -ChildPath "temp.csv")
        }
    }



#Rearrange according to the sequence field so that testcase with lower sequence will be put on the buttom. In this way, those testcase will be executed at first

    $lsRecord=$lsRecord|Sort-Object Sequence -Descending





#Generate Plan files. Every file should contain 20 testcases
    $lsPlanFile=@()

    $iPlanNameIndex=0
    
    foreach($sRecord in $lsRecord)
    {
        #skip this case if Sub_TestCase column is blank
        if ($sRecord.Sub_TestCase -eq $null)
        {
            continue
        }        
       
              
        #Generate first couple lines of the plan file if plan file is new
        if ($lsPlanFile.Length -eq 0)
        {
            $lsPlanFile+=@("Generated by Weiwei Wu's powershell plan file automatic generation tool")
        }

       $iPlanLineIndex++
       
       #if it is the end of the record, then we want to flush the plan file
       if($sRecord -eq $lsRecord[$lsRecord.Length-1])
       {
            $iPlanLineIndex=$iTestCasePerPlan+1
       }



        #Figure out where the script comes from
        if ($sRecord.Find_In_Script -match ".t")
        {
            $sTemp=$sRecord.Find_In_Script
        }
        else
        {
            $sTemp=$sRecord.Script_Name
        }
        




        $lsPlanFile=GeneratePlanFile -sScriptLocation $sTemp -sTestCase $sRecord.Sub_TestCase

        $FileLocation=$sTemp

        #Flush the result out
       if (($iPlanLineIndex -ge ($iTestCasePerPlan)))       
       {
            #When the plan file is full, then iPlanLineIndex=0 and write the plan file into the file and then clean the plan file
            
            $iPlanFile++    
            $sTemp=(Join-Path -Path $sResultFolder -ChildPath $sRecord.Sub_TestCase)+".pln"
            $lsPlanFile>>$sTemp
            $lsPlanFile=@()
            $iPlanLineIndex=0            
       }
        #Output Quefile
        $sTemp=(Join-Path -Path $sResultFolder -ChildPath $sRecord.Sub_TestCase)+".pln"
        

        if($sRecord.Find_In_Script -like "*.t")
        {
            $SolutionPath=FindSolution -sCurrentFolder $FileLocation
            $Command="partner.exe -proj '$SolutionPath' -q -resextract -resexport -r `"$sTemp`""
        }
        else
        {
            $Command=$sRecord.Sub_TestCase
        }
        
        $Command>>(Join-Path -Path $sResultFolder -ChildPath ExecutionQueue.inc)
        

    
    }



#Get the Product and Build Information
#Output csv file as a record
    $lsRecord|Sort-Object -Property Sub_TestCase -Unique|Export-Csv -Path (Join-Path -Path $sResultFolder -ChildPath Progress.csv)
    Set-NextProject -sARTServerUri $sARTUri -vision $vision -project $projectId