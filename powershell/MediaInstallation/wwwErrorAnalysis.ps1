param(
    [string]$Function="",
    $FileWatcherDirectoryInput="",
    [string]$FileWatcherName="Event Watcher",
    [string]$FileWatcherStartTime="",
    [string]$OutputFolder,
    [string]$SCVMM_Usernamea,
    [string]$SCVMM_Passworda
    )


$wshell = New-Object -ComObject wscript.shell
[void](import-Module -Name "virtualmachinemanager")
$sParentFolder=[System.IO.Path]::GetDirectoryName($myInvocation.MyCommand.Definition)
$sClientSettingINI=Join-Path -Path $sParentFolder -ChildPath "setting.ini"
$sCenterControlINI=Join-Path -Path $sParentFolder -ChildPath "CenterControl.ini"
$dailyDashBoardControlSQLTableName="DailyDashBoardControl"
#$Global:VMClientList=@()

if($Global:AllSettings -eq $null)
{
    $Global:AllSettings=@()
}
if($Global:Project -eq $null -or $Global:Project -eq "")
{
    $Global:Project="GLOBAL"
}




function Add-NewServerToArt($sARTServerUri='http://mvf1:3000'){
    
    $CPU=(Get-WmiObject Win32_Processor).NumberOfCores
    $totalMemory=(gwmi Win32_ComputerSystem  ).TotalPhysicalMemory/1024/1024
    $freeMemory=(gwmi Win32_OperatingSystem).FreePhysicalMemory/1024
    $dormStatus=@{
        name=$env:COMPUTERNAME
        system_resource=@{
            CPU=$CPU
            total_memory_mb=$totalMemory
            free_memory_mb=$freeMemory
            disk_total=@(
                @{
                    drive_letter='c'
                    total_disk_space_mb=999999
                    free_disk_space_mb=888
                }

            )
    
        }
    }
    $dormJson=$dormStatus|ConvertTo-Json -Depth 4
    $response=Invoke-RestMethod -Uri "$sARTServerUri/api/dorm" -Method Post -Body $dormJson -ContentType 'application/json'

    if($response.result -eq "ok"){
        return $true
    }
    else{
        return $false
    }

}   


function Get-EmergencyStatus($sSettingFilePath,$iTimeOutForResponseInSec)
{
    $TimeStart=Get-Date
    
    $Process=Start-Process -FilePath $sSettingFilePath -PassThru
    while($true)
    {
        
        $sEmergencyStatus=Load-ValueFromSetting -SettingPath $sSettingFilePath -Value "EmergencyStatus"
        #quit to the loop if elapsed time is more than we expect
        
        $TimeNow=Get-Date
        $iTimeElapsed=($TimeNow-$TimeStart).TotalSeconds
        Write-Host -Object "WAITING FOR EMERGENCY INPUT: $iTimeElapsed / $iTimeOutForResponseInSec"
        if($iTimeElapsed -gt $iTimeOutForResponseInSec)
        {
            
            $sResult="GO"
            break
        }

        if($sEmergencyStatus -match "STOP")
        {
            $sResult="STOP"
            break
        }

        if($sEmergencyStatus -match "GO")
        {
            $sResult="GO"
            break
        }        

    }

    $Process|Stop-Process -Force
    return $sResult


}

function Get-FirstItemInExecutionQueue($sResultFolder,$bIsDequeue=$false)
{
    $sQLocation=(Join-Path -Path $sResultFolder -ChildPath ExecutionQueue.inc)
    $lsQueue=[array](Get-Content -Path $sQLocation)

    if($lsQueue -eq $null -or $lsQueue[0] -eq "")
    {
        return "None"
    }
    
    $FirstItem=$lsQueue[$lsQueue.Length-1]
    if($bIsDequeue -eq $false)
    {
        return $FirstItem
    }


    
    $lsQueOutput=@()
    #get rid of last item in the queue
    if($lsQueue.Length -ge 1)
    {        
        for($i=0;$i -lt $lsQueue.Length-1;$i++)
        {            
            $lsQueOutput+=$lsQueue[$i]
        }
    }
    $lsQueOutput|Out-File -FilePath $sQLocation -Force
    return $FirstItem
}

function Get-MSTestExecutionTime($sResultFolder=$sParentFolder)
{
    $trxFiles=Get-ChildItem -Path $sResultFolder -Recurse|where{$_.fullname.tolower() -like "*.trx"}
    $doubleCurrentHours=0
    foreach($trx in $trxFiles)
    {
        $xml=[xml](Get-Content -Path $trx.FullName)
        $doubleCurrentHours+=([timespan]::Parse($s1.TestRun.Results.UnitTestResult.duration)).TotalHours
    }
    return $doubleCurrentHours
}
function Start-SettingWatcher([int]$iTimeOutBeforeSecondValidation=60*60,[int]$iNewFileCritiera=3*60*60)
{
    $sServerDirectory=Load-ValueFromSetting -SettingPath $sClientSettingINI -Value sServerDirectory
    $sMachineManagementFolder=Split-Path -Path $sServerDirectory -Parent
    $sMachineManagementFolder=Split-Path -Path $sMachineManagementFolder -Parent
    $sMachineManagementFolder=Join-Path -Path $sMachineManagementFolder -ChildPath MachineManagement
    $sClientMachineFolder=Join-Path -Path $sMachineManagementFolder -ChildPath $env:COMPUTERNAME
    $sRemoteSetting=Join-Path -Path $sClientMachineFolder -ChildPath "setting.ini"
    $sCurrentSetting=$sClientSettingINI
    Start-ServerSettingPoller -sRemoteSetting $sRemoteSetting -sCurrentSetting $sCurrentSetting -iTimeOutBeforeSecondValidation $iTimeOutBeforeSecondValidation -iNewFileCritiera $iNewFileCritiera
}

function Start-ServerSettingPoller([string]$sRemoteSetting,[string]$sCurrentSetting,[int]$iTimeOutBeforeSecondValidation=60*60,[int]$iNewFileCritiera=3*60*60)
{
    
    
    #Detect Settting.ini which is newer than current file and posted within last 3 hours
    #Please make sure the timeout is less than second criteira for test, otherwise it will never invoke this method!
    $iTimeOut=$iTimeOutBeforeSecondValidation
    [int]$iSecondCriteria=$iNewFileCritiera
    if($iSecondCriteria -lt $iTimeOut)
    {
        Write-Host "Please choose a timeout that is less than $iSecondCriteria, otherwise this function will never get invoked!"
    }
    while($true)
    {
        Start-Sleep -Seconds 1
        if(!(Test-Path $sRemoteSetting) -or !(Test-Path $sCurrentSetting) ){continue}
        if(Test-RemoteCurrentLocalTimeRelationship -sRemoteSetting $sRemoteSetting -sCurrentSetting $sCurrentSetting -iSecondCriteria $iSecondCriteria)
        {
            Write-Host -Object "start checking "
            Start-Sleep -Seconds $iTimeOut
            if(Test-RemoteCurrentLocalTimeRelationship -sRemoteSetting $sRemoteSetting -sCurrentSetting $sCurrentSetting -iSecondCriteria $iSecondCriteria)
            {
                #copy remote setting file to current folder                
                Copy-Item -Path $sRemoteSetting -Destination $sCurrentSetting -Force -Verbose

                #Sync Latest Framework Based on new setting.ini
                
                #Read value for the P4 sync
                Load-ValueFromSetting -SettingPath $sCurrentSetting -Value P4_Execution_Frame_Folder
                $P4_User=Load-ValueFromSetting -SettingPath $sCurrentSetting -Value "P4_User" -DefaultValue "wuwei"
                $P4_Work_Space_Name=Load-ValueFromSetting -SettingPath $sCurrentSetting -Value P4_Work_Space_Name -DefaultValue "ART"
                $P4_PASSWORD=Load-ValueFromSetting -SettingPath $sCurrentSetting -Value P4_PASSWORD -DefaultValue "Perforce562"
                $P4_Work_Space_Folder=Load-ValueFromSetting -SettingPath $sCurrentSetting -Value P4_Work_Space_Folder -DefaultValue "c:\p4"
                $P4_Execution_Frame_Folder=Load-ValueFromSetting -SettingPath $sCurrentSetting -Value P4_Execution_Frame_Folder -DefaultValue "//depot/qe/dev/AUTOMATION/BAF/AutomaticRegressionFramework/Version/V6/"
                $P4_Server=Load-ValueFromSetting -SettingPath $sCurrentSetting -Value ($sProject+"_P4_Server") -DefaultValue "hqperforce2:1666"
                $P4_Frame_Shared_Folder=Load-ValueFromSetting -SettingPath $sCurrentSetting -Value P4_Frame_Shared_Folder -DefaultValue "//depot/qe/dev/AUTOMATION/BAF/Shared Features/"

                #Re-sync whole framework again
                Sync-FromP4 -P4_Location_List $P4_Execution_Frame_Folder -P4_User $P4_User -P4_Server $P4_Server -P4_PASSWORD $P4_PASSWORD -P4_Work_Space_Folder $P4_Work_Space_Folder -P4_Work_Space_Name $P4_Work_Space_Name
                Sync-FromP4 -P4_Location_List $P4_Frame_Shared_Folder -P4_User $P4_User -P4_Server $P4_Server -P4_PASSWORD $P4_PASSWORD -P4_Work_Space_Folder $P4_Work_Space_Folder -P4_Work_Space_Name $P4_Work_Space_Name
                
                $sNewFrameworkFolder=Convert-P4LocationToWinLocation -P4Location $P4_Execution_Frame_Folder -P4_Work_Space_Folder $P4_Work_Space_Folder
                $sNewSettingFile=Join-Path -Path $sNewFrameworkFolder -ChildPath "setting.ini"
                

                #copy remote setting file to current folder again in case there is setting.ini in p4..which shouldn't happen though
                Copy-Item -Path $sRemoteSetting -Destination $sNewFrameworkFolder -Force -Verbose
                #load current queue. add a ClientPrepRegistration to the queue
                $Task_Queue=Load-ValueFromSetting -SettingPath $sNewSettingFile -Value Task_Queue
                if($Task_Queue -notmatch "ClientPrepRegistration")
                {
                    $Task_Queue="ClientPrepRegistration;"+$Task_Queue
                    $Task_Queue.Replace(";;",";").Replace(";;",";")
                    Write-ValueToSetting -Path $sNewSettingFile -Key Task_Queue -Value $Task_Queue
                }
                
                #Invoke new clientprep.ps1
                $sNewClientPrep=Join-Path -Path $sNewFrameworkFolder -ChildPath "clientprep.ps1"
                Invoke-Expression -Command $sNewClientPrep



            }
        }

    }

}
function Test-RemoteCurrentLocalTimeRelationship([string]$sRemoteSetting,[string]$sCurrentSetting,[int]$iSecondCriteria=3*60*60)
{
    #Detect Settting.ini which is newer than current file and posted within last 3 hours
    #[int]$iSecondCriteria=


    $objRemoteSetting=Get-Item -Path $sRemoteSetting
    $objCurrentSetting=Get-Item -Path $sCurrentSetting
    $objNow=Get-Date
    $objCurrentModified=$objCurrentSetting.LastWriteTime
    $objRemoteModified=$objRemoteSetting.LastWriteTime
    $iTimeFromCurrent=($objNow-$objRemoteModified).TotalSeconds
    $iDiffBetweenCurrentAndRemote=($objRemoteModified-$objCurrentModified).TotalSeconds
    #Fullfill criteira 
    if($iDiffBetweenCurrentAndRemote -gt 0 -and $iTimeFromCurrent -lt $iSecondCriteria)
    {
        return $true
    }
    else{return $false}


}

function Publish-MachineQueue([string[]]$lsClient,[string]$ART_Server,[string]$SettingFile)
{
    [string]$sMachineFolder=Join-Path -Path $ART_Server -ChildPath MachineManagement
    #Create a Machine management folder if we cannot find any
    if((Test-Path -Path $sMachineFolder) -eq $false)
    {
        New-Item -Path $sMachineFolder -ItemType Directory
    }

    #Create Folder for each client and copy setting.ini to that location
    foreach($item in $lsClient)
    {
        #Eliminate all .dev.aspentech.com or .corp.aspentech.com
        $itemString=$item.tolower().replace(".dev.aspentech.com","").replace(".corp.aspentech.com","")
        [string]$sClientFolder=Join-Path -Path $sMachineFolder -ChildPath $itemString
        #create folder
        if((Test-Path -Path $sClientFolder) -eq $false)
        {
            New-Item -Path $sClientFolder -ItemType Directory
        }
        #copy setting.ini
        Copy-Item -Path $SettingFile -Destination $sClientFolder -Force

    }

}


Function Analyze-BuildResult([array]$lsBuildInfo)
{
    $iError=0
    $iWarning=0
    foreach($sLine in $lsBuildInfo)
    {
        if($sLine -like "*Solution file error MSB*")
        {
            $iError=9999
        }
        elseif($sLine -like "* Warning(s)")
        {
            $iWarning=[int]($sLine.replace(" ","").replace("Warning(s)",""))
        }
        elseif ($sLine -like "* Error(s)")
        {
            $iError=[int]($sLine.replace(" ","").replace("Error(s)",""))
        }

    }
    if($iError -ne 0)
    {
        return $null
    }
    else
    {
        return $iWarning
    }
}

Function Get-LocalTime($UTCTime)
{
$strCurrentTimeZone = (Get-WmiObject win32_timezone).Caption
$r = get-childitem -path “HKLM:\Software\Microsoft\Windows NT\CurrentVersion\Time Zones”
foreach ($i in $r) { if ($i.GetValue(“Display”) -eq $strCurrentTimeZone) { $p = $i.PSChildName; break}}
$tz = [TimeZoneInfo]::FindSystemTimeZoneById(($p -split “\\”)[-1])
return [TimeZoneInfo]::ConvertTimeFromUtc($UTCTime, $tz).ToUniversalTime()

}
Function Get-MsBuildPath() 
{
    $lsPotentialBuilders=[array]((Get-ChildItem -Path "HKLM:\SOFTWARE\Microsoft\MSBuild\ToolsVersions\").PSPath)
    
    $msBuildRegPath = "HKLM:\SOFTWARE\Microsoft\MSBuild\ToolsVersions\$VSVersion"
    $lsBuilderPath=@()
    foreach($path in $lsPotentialBuilders)    
    {
        #$msBuildRegPath=$path.replace("HKEY_LOCAL_MACHINE","HKLM:")
        $msBuildPathRegItem = Get-ItemProperty $path -Name "MSBuildToolsPath"
        
        $msBuildPath =Join-Path -Path $msBuildPathRegItem.MsBuildToolsPath -ChildPath "msbuild.exe"            
        $lsBuilderPath+=@($msBuildPath)
    }
    return $lsBuilderPath|Select-Object -un
}
Function Get-SlnVersion($solutionPath)
{
    $lsContent=[array](Get-Content -Path $solutionPath)
    $vsIdentifier="Microsoft Visual Studio Solution File, Format Version "
    foreach($sLine in $lsContent)
    {
        if($sLine -match $vsIdentifier)
        {
            $version=$sLine.Replace("$vsIdentifier","").Replace("00","0")
            break
        }

    }

    return $version
}

Function Get-MSTestPath()
{
    $MsTest_Path=LoadValueFromSetting -Path $sClientSettingINI -sValue "MsTest_Path" -DefaultValue "" -Express
    if($MsTest_Path -eq "")
    {
        $lsMSTEST=[array](Get-ChildItem -Path ${env:ProgramFiles(x86)} -Recurse|where{$_.Name -eq "vstest.console.exe"}|Sort-Object LastWriteTime -Descending)
        $MSTest=$lsMSTEST[0]
        $MsTest_Path=$MSTest.fullname
        Write-ValueToSetting -Path $sClientSettingINI -Key "MsTest_Path" -Value $MsTest_Path
    }
    return $MsTest_Path
}
function Get-BuildPathFromSln($slnPath="C:\p4\qe\dev\AUTOMATION\Aspen Plus\MyLibraryV9.0\Silk4Net\Source\AspenTech.SilkTest.AspenPlus.sln")
{
    #Construct 

    $localBuildPath=Split-Path -Path $slnPath -Parent
    $localBuildPath=Join-Path -Path $localBuildPath -ChildPath "ARTbuild"
    #Create Path if it is not exist
    if(!(Test-Path -Path $localBuildPath))
    {
        New-Item -Path $localBuildPath -ItemType Directory
    }

    

    return $localBuildPath
}
#C:\Windows\Microsoft.NET\Framework64\v4.0.30319\
#C:\Program Files (x86)\MSBuild\12.0\bin\amd64\msbuild.exe
#C:\Windows\Microsoft.NET\Framework64\v2.0.50727\

function newProjObj($slnPath)
{
    $obj=New-Object PSObject
    $Obj|Add-Member -MemberType NoteProperty -Name "Name" -Value $sCompilerPath
    $Obj|Add-Member -MemberType NoteProperty -Name "Path" -Value $Warning
    $obj|Add-Member -MemberType Property -Name ProjectList -Value $ProjectList
    return $Obj
}
function newClientTaskObject($Job,$DateTime,$Client)
{
    $obj=New-Object PSObject
    $Obj|Add-Member -MemberType NoteProperty -Name "Job" -Value $Job
    $Obj|Add-Member -MemberType NoteProperty -Name "DateTime" -Value $DateTime
    $obj|Add-Member -MemberType NoteProperty -Name "Client" -Value $Client
    return $Obj
}

Function Get-MstestCQMapFromCSFile($dllName="test.dll",$slnPath="C:\p4\qe\dev\AUTOMATION\Aspen Plus\MyLibraryV9.0\Silk4Net\Source\AspenTech.SilkTest.AspenPlus.sln",$sFilePath="C:\p4\qe\dev\AUTOMATION\Aspen Plus\MyLibraryV9.0\Silk4Net\Source\TestCases\Solids\CQ00466551_01.cs",$sCsprojPath="C:\p4\qe\dev\AUTOMATION\Aspen Plus\MyLibraryV9.0\Silk4Net\Source\TestCases\AspenTech.SilkTest.AspenPlus.TestCases.csproj")
{
    function newMsTestCQObj($Find_In_Script,$Find_In_CsProj,$Sub_TestCase,$Find_In_Dll,$Find_In_Sln)
    {
    $obj=New-Object PSObject
    $Obj|Add-Member -MemberType NoteProperty -Name "Sub_TestCase" -Value $Sub_TestCase
    $Obj|Add-Member -MemberType NoteProperty -Name "Find_In_CsProj" -Value $Find_In_CsProj
    $Obj|Add-Member -MemberType NoteProperty -Name "Find_In_Script" -Value $Find_In_Script
    
    $Obj|Add-Member -MemberType NoteProperty -Name "Find_In_Dll" -Value $Find_In_Dll
    $Obj|Add-Member -MemberType NoteProperty -Name "Find_In_Sln" -Value $Find_In_Sln
    return $obj
    }
    $dllFolder=Get-BuildPathFromSln -slnPath $slnPath
    $dllPath=Join-Path -Path $dllFolder -ChildPath $dllName
    $objFilePath=Get-Item -Path $sFilePath


    $lsCQList=Get-CQList -lsProjectScript @($objFilePath)
    $lsCQRecord=@()
    foreach($item in $lsCQList)
    {
        $objMsTestCQ=newMsTestCQObj -Find_In_Script $sFilePath -Sub_TestCase $item -Find_In_Dll $dllPath -Find_In_Sln $slnPath -Find_In_CsProj $sCsprojPath
        $lsCQRecord+=@($objMsTestCQ)
    }
    return $lsCQRecord
    
}
Function Get-MStestCQMapFromSlnList($lsSlnPath=@("C:\p4\qe\dev\AUTOMATION\Aspen Plus\MyLibraryV9.0\Silk4Net\Source\AspenTech.SilkTest.AspenPlus.sln","C:\p4\qe\dev\AUTOMATION\Aspen Plus\MyLibraryV9.0\Silk4Net\Source\AspenTech.SilkTest.AspenPlus.sln"))
{
    $lsMstestCQMap=@()
    foreach($slnPath in $lsSlnPath)
    {
        $lsMstestCQMap+=@(Get-MstestCQMapFromFromSln -slnPath $slnPath)
    }
    $UniqueList=@()
    foreach($item in $lsMstestCQMap)
    {
        try
        {
            if($UniqueList.Count -eq 0 -or ([array]($UniqueList.Sub_TestCase)).Contains($item.Sub_TestCase) -eq $false)
            {
                $UniqueList+=@($item)
            }

        }
        catch{}
        
    }

    return $UniqueList
}
Function Get-MstestCQMapFromFromSln($slnPath="C:\p4\qe\dev\AUTOMATION\Aspen Plus\MyLibraryV9.0\Silk4Net\Source\AspenTech.SilkTest.AspenPlus.sln")
{
    $lsContent=[array](Get-Content -Path $slnPath)
    $lsMstestCQMap=@()
    foreach($item in $lsContent)
    {
        #check if this is a project line
        if($item -like "Project(`"{*")
        {
            $lsProjInfo=[array]($item.split(","))
            #1st part contain info for dll name while 2nd part contain info for the csproj location
            $dllPart=$lsProjInfo[0]
            $csprojPath=$lsProjInfo[1].replace("`"","")
            #process 1st part. split it by half based on = and get rid of " sign
            #$dllName=([array]($dllPart.split("=")))[1].replace("`"","").replace(" ","")+".dll"
            #process 2nd part. Construct path based on current slnPathLocation
            $slnFolder=Split-Path -Path $slnPath -Parent
            $csprojPath=Join-Path -Path $slnFolder -ChildPath $csprojPath.substring(1)
            if((Test-Path $csprojPath) -eq $false)
            {
                continue
            }
            $csprojPath=(Get-Item -Path $csprojPath).fullname
            $xmlCsprojContent=[xml](Get-Content -Path $csprojPath)
            $dllName=$xmlCsprojContent.Project.PropertyGroup[0].AssemblyName+".dll"
            $MstestCQMap+=@(Get-MstestCQMapFromCsProj -slnPath $slnPath -csprojPath $csprojPath -dllName $dllName)
        }
    }
    return $MstestCQMap
}

Function Get-MstestCQMapFromCsProj($dllName="testName.dll",$slnPath="C:\p4\qe\dev\AUTOMATION\Aspen Plus\MyLibraryV9.0\Silk4Net\Source\AspenTech.SilkTest.AspenPlus.sln",$csprojPath="C:\p4\qe\dev\AUTOMATION\Aspen Plus\MyLibraryV9.0\Silk4Net\Source\TestCases\AspenTech.SilkTest.AspenPlus.TestCases.csproj")
{
    $xmlContent=[xml](Get-Content -Path $csprojPath)
    foreach($reference in $xmlContent.Project.ItemGroup)
    {
        $lsRelativeFilePath+=[array]($reference.Compile)    
    }
    
    $sCsprojFolder=Split-Path -Path $csprojPath -Parent
    $lsMstestCQMap=@()
    foreach($sRelativePath in $lsRelativeFilePath)
    {
        $filePath=Join-Path -Path $sCsprojFolder -ChildPath $sRelativePath.include
        $fileObj=(Get-Item -Path $filePath)
        $filePath=$fileObj.fullname
        if($fileObj.PSIsContainer -eq $true)
        {
            continue
        }
        $lsMstestCQMap+=@(Get-MstestCQMapFromCSFile -slnPath $slnPath -sCsprojPath $csprojPath -sFilePath $filePath -dllName $dllName)

    }
    return $lsMstestCQMap
}

Function Get-RightCompiler($slnPath="C:\p4\qe\dev\AUTOMATION\Aspen Plus\MyLibraryV9.0\Silk4Net\Source\AspenTech.SilkTest.AspenPlus.sln")
{
    function newResultObj($sCompilerPath,$Warning)
    {
        $obj=New-Object PSObject
        $Obj|Add-Member -MemberType NoteProperty -Name "sCompilerPath" -Value $sCompilerPath
        $Obj|Add-Member -MemberType NoteProperty -Name "Warning" -Value $Warning
        return $Obj
    }
    $lsResult=@()
    $lsCompilerPaths=Get-MsBuildPath
    foreach($sCompilerPath in $lsCompilerPaths)
    {
        $result=Build-Project -msBuild $sCompilerPath -slnPath $slnPath -rebuild
        $iWarning=Analyze-BuildResult -lsBuildInfo $result
        
        if($iWarning -eq $null)
        {
            continue
        }
        Write-Host -Object "Compiler $sCompilerPath Build Successfully and give $iWarning Warning "
        #Find best match for the compiler
        if($iWarning -eq 0)
        {
            return $sCompilerPath
        }
        $lsResult+=(newResultObj -sCompilerPath $sCompilerPath -Warning $iWarning)        
    }


    #if no 0 warning item in the list, then sort it and get the least-warned compiler
    $sBestCompilerPath=[array]($lsResult|Sort-Object warning)[0].sCompilerPath
    return $sBestCompilerPath

}

Function Build-Project($msBuild="C:\Windows\Microsoft.NET\Framework64\v4.0.30319\msbuild.exe",$slnPath="C:\p4\qe\dev\AUTOMATION\Aspen Plus\MyLibraryV9.0\Silk4Net\Source\AspenTech.SilkTest.AspenPlus.sln",[switch]$rebuild,[switch]$CompressOutput)
{
    #update nuget
    $sNugetPath=Split-Path -Path $sParentFolder -Parent
    $sNugetPath=Split-Path -Path $sNugetPath -Parent
    $sNugetPath=Split-Path -Path $sNugetPath -Parent
    $sNugetPath=Join-Path -Path $sNugetPath -ChildPath "\Shared Features\Utility\nuget.exe"
    Unblock-File -Path $sNugetPath
    Start-Process -Wait -FilePath $sNugetPath -ArgumentList "restore `"$slnPath`""
    

    #find right build for current project
    if($msBuild -eq $null -or $msBuild -eq "" -or !(Test-Path -Path $msBuild))
    {
        $msBuild=Load-ValueFromSetting -SettingPath $sClientSettingINI -Value ($slnPath+"_Compiler_Path") -DefaultValue ""
        if($msBuild -eq "" -or !(Test-Path -Path $msBuild))
        {
            $msBuild=Get-RightCompiler -slnPath $slnPath
            #after find right compiler, put it down
            Write-ValueToSetting -Path $sClientSettingINI -Key ($slnPath+"_Compiler_Path") -Value $msBuild
        }

    }    
    Write-Host -Object "$msBuild is used to build this project" -ForegroundColor Yellow
    $buildPath=Get-BuildPathFromSln -slnPath $slnPath
    Write-Host -Object "$buildPath is used to store result dll" -ForegroundColor Yellow
    Write-Host -Object "Start Building Process" -ForegroundColor Yellow
    if($rebuild.IsPresent)
    {
        $result=[array](&$msBuild $slnPath "/p:OutputPath=$buildPath" "/t:rebuild")
    }
    else
    {
        $result=[array](&$msBuild $slnPath "/p:OutputPath=$buildPath")
    }
    Write-Host -Object "Done with building" -ForegroundColor Yellow
    if($CompressOutput.IsPresent)
    {return}
    else
    {return $result}
    
}
function Get-dllWorkingDirectory($lsFolders,$dllName)
{
    $parent=""
    $csprojName=$dllName.replace("dll","csproj")
    foreach($folder in $lsFolders)
    {
        $lsResults=[array](Get-ChildItem -Path $folder -Recurse|where{$_.Name.ToLower() -eq $csprojName.ToLower()}|Sort-Object LastWriteTime -Descending)
        if($lsResults.Count -gt 0)
        {
            $parent=($lsResults[0]).DirectoryName
            break
        }

    }
    return $parent
    
}

Function Run-MSTest($Find_In_CsProj="C:\p4\qe\dev\AUTOMATION\Aspen Plus\MyLibraryV9.0\Silk4Net\Source\TestCases\AspenTech.SilkTest.AspenPlus.TestCases.csproj",$dll="C:\p4\qe\dev\AUTOMATION\Aspen Plus\MyLibraryV9.0\Silk4Net\Source\ARTbuild\AspenTech.SilkTest.AspenPlus.TestCases.dll",$testCase="CQ00237725_CASE")
{
        $dllPath=Split-Path -Path $Find_In_CsProj -Parent
        $MSTest=Get-MSTestPath
        Set-Location -Path $dllPath
        Write-Host "Try to find $testCase in $dll"
        $output=[array](&$MSTest "$dll" "/Tests:$testCase" "/Logger:trx")
        Set-Location -Path $sParentFolder
        #result analysis
        $outputString=[string]($output)
        foreach($sLine in $output)
        {
            
            if($sLine -match "Results File:")
            {
                $sResultPath=$sLine.Replace("Results File: ","")
                $sResultName=Split-Path -Path $sResultPath -Leaf
                
                Copy-Item -Path $sResultPath -Destination $sParentFolder

                Rename-Item -Path (Join-Path -Path $sParentFolder -ChildPath $sResultName) -NewName ($testCase+"_"+$sResultName)

                $newResultName=($testCase+"_"+$sResultName)
                break
            }
        }
       

    return $newResultName


}    
Function Run-MSTestResultAnalysis($sResultPath)
{
    function newResultObj($Result,$Comment,$Duration)
    {
        $obj=New-Object PSObject
        $Obj|Add-Member -MemberType NoteProperty -Name "Result" -Value $Result
        $Obj|Add-Member -MemberType NoteProperty -Name "Comment" -Value $Comment
        $Obj|Add-Member -MemberType NoteProperty -Name "Duration" -Value $Duration

        return $Obj
    }


    $xmlResult=[xml](Get-Content -Path $sResultPath)
    $result=$xmlResult.TestRun.Results.UnitTestResult.outcome
    try{
        $Comment=$xmlResult.TestRun.Results.UnitTestResult.Output.ErrorInfo.Message.tostring()+$xmlResult.TestRun.Results.UnitTestResult.Output.ErrorInfo.StackTrace.tostring()
    }
    catch{
    $Comment=""
    $Error.Clear()}
    
    $Duration=$xmlResult.TestRun.Results.UnitTestResult.duration
    $obj=newResultObj -Result $result -Comment $Comment -Duration $Duration

    return $obj


}


Function RebuildPorject($solutionPath)
{
    $msbuildpath = Get-MsBuildPath
    $p = gl
    $Currentpath = $p.Path
    $slns = gci|Where-Object {$_.Name -match "/*.sln"}    
    $slns | %{
        &$msbuildpath $Currentpath\$_ /t:ReBuild /v:m ;
    }
}

Function TestDll(){
    if(test-path $projectpath\TestReport\$resultfilename){
        del $projectpath\TestReport\$resultfilename
    }
    if($categoryname -eq ""){
        &'C:\Program Files (x86)\Microsoft Visual Studio 12.0\Common7\IDE\mstest.exe' /resultsfile:$projectpath\TestReport\$resultfilename /testcontainer:$testdllpath
    }
    else{
        &'C:\Program Files (x86)\Microsoft Visual Studio 12.0\Common7\IDE\mstest.exe' /resultsfile:$projectpath\TestReport\$resultfilename /testcontainer:$testdllpath /category:$categoryname  

    }
}


function MVTDashBoardData($TaskName,$Result,$TimeSpan,$Comment)
{
        $obj=New-Object PSObject
        $Obj|Add-Member -MemberType NoteProperty -Name "TaskName" -Value $TaskName
        $Obj|Add-Member -MemberType NoteProperty -Name "Result" -Value $Result
        $Obj|Add-Member -MemberType NoteProperty -Name "Time Span" -Value $TimeSpan
        $Obj|Add-Member -MemberType NoteProperty -Name "Comment" -Value $Comment
        return $Obj
}

function Query-PushInfoInLastNDays($days,$cut)
{
    $cutTime=[datetime]::Parse($cut)
    $lsResult=@()
    for($i=0;$i -le $days;$i++)
    {
        $currentTime=$cutTime.AddDays(-1*$i)
        $day=$currentTime.Day
        $Month=$currentTime.Month
        $Year=$currentTime.Year
        $Query="select * from pushinfo_ini where pushinfo_ini.lastModified like '%$Month/$day/$Year%';"
        $result=[array](Query-Database -Query $Query -MySQLAdminUserName $MySQLAdminUserName -MySQLDatabase $MySQLDatabase -MySQLAdminPassword $MySQLAdminPassword -MySQLHost $MySQLHost)
        Write-SqlMsg -sqlResult $result -err "Query-PushInfoInLastNDays -days $days -cut $cut "
        foreach($item in $result)
        {
            $resultTime=[datetime]::Parse($item.lastModified)
            if(($cutTime-$resultTime).TotalDays -lt $days)
            {
                $lsResult+=@($item)    
            } 
        }
        

        
    }


    return $lsResult
}
function ConstructDashboard($days,$cut)
{
    $lsResult=Query-PushInfoInLastNDays -days $days -cut $cut
    $dashBoard=@()
    foreach($result in $lsResult)
    {
        $taskName=$result.Product
        $comment=$result.Comment
        $Data=MVTDashBoardData -TaskName $taskName -Result $result.Pass_Rate -TimeSpan $result.Time_Span -Comment $comment
        $dashBoard+=@($data)
    }
    $now=([datetime]::Parse($cut)).ToString()
    $past=$now.AddDays(-1*$days).tostring()
    $htmlCode=$dashBoard|ConvertTo-Html -PreContent "Automation Validation Dash Board $past - $now" -As Table    
    return $htmlCode
}

function Check-DashBoardEmail($cut)
{
    $Day=(Get-Date -Format yyyy_MM_dd).ToString()
    Load-ValueFromSql -tableName $dailyDashBoardControlSQLTableName -key "Email_Status" -project $Day
    Write-ValueToSql -tableName $dailyDashBoardControlSQLTableName -project $Day -key Is_Email_Sent -value $false

}


function Test-TableExistsInSql($tableName)
{
    $bResult=$false
    $lsTableName=[array](Query-Database -Query "SHOW TABLES" -MySQLAdminUserName $MySQLAdminUserName -MySQLDatabase $MySQLDatabase -MySQLAdminPassword $MySQLAdminPassword -MySQLHost $MySQLHost)
    foreach($table in $lsTableName)
    {
        if($table.Tables_in_mydb -eq $tableName)
        {
            $bResult=$true
            break
        }

    }
    return $bResult
}
function New-SQLTable($tableName)
{
    
    
    if((Test-TableExistsInSql -tableName $tableName) -eq $false)
    {
        $Query="CREATE TABLE $tableName (project VARCHAR(100) NOT NULL,
        lastModified TEXT NOT NULL,
        PRIMARY KEY (project)

        );"
        #Please make sure that you have admin right to write to databasenew-
        $result=[array](Query-Database -Query $Query)
        if(($result|where{$_ -match "ERROR"}).Count -gt 0)
        {
            
            Write-Host -Object "Error detected in New-SQLTable for -table $tableName" -ForegroundColor Yellow
        }
        else
        {
            Write-Host -Object "$tableName created successfully"
        }
        
        
    }
    
}
function Add-SQLColumn($tableName,$key)
{

    
    $result=$true
    try
    {
        $query="describe $tableName"
        $lsResult=([array](Query-Database -Query $query -MySQLAdminUserName $MySQLAdminUserName -MySQLDatabase $MySQLDatabase -MySQLAdminPassword $MySQLAdminPassword -MySQLHost $MySQLHost))
        $result= $lsResult.Field.Contains($key)
        if(!$result)
        {
            $query="ALTER TABLE $tableName ADD $key TEXT"
            $lsResult=([array](Query-Database -Query $query))
            Write-Host ("$key is created in $tableName successfully")
            $result=$true
        }

    }
    catch
    {
        
        $result=$false
        Write-Host -Object "Error detected in Add-SQLColumn for table $tableName key $key" -ForegroundColor Yellow
    }
    


    
    return $result
}

function Test-SQLProject($tableName,$project)
{
    $result=$true
    $query="select * from $tableName where project='$project'"
    $lsResult=([array](Query-Database -Query $query -MySQLAdminUserName $MySQLAdminUserName -MySQLDatabase $MySQLDatabase -MySQLAdminPassword $MySQLAdminPassword -MySQLHost $MySQLHost))    
    Write-SqlMsg -sqlResult $lsResult -err "Error detected in Test-SQLProject for table $tableName project $project" -ForegroundColor Yellow

    if($lsResult.Count -eq 0)
    {
        $result=$false
    }
    return $result
}
function Change-SQLValue($tableName,$project,$key,$value,$NolastModified)
{
    $result=$true
    if(Test-SQLProject -tableName $tableName -project $project)
    {
        if($NolastModified)
        {
            $query="UPDATE $tableName
            SET $key='$value'
            WHERE project='$project'
            "           
        }
        else
        {
            $query="UPDATE $tableName
            SET $key='$value',lastModified='$((Get-Date).ToString())'
            WHERE project='$project'
            "           

        }
        

    }
    else
    {
        $query="INSERT INTO $tableName 
        (project,$key,lastModified) 
        VALUES ('$project','$value','$((Get-Date).ToString())')"     

    }
    

    $lsResult=([array](Query-Database -Query $query -MySQLAdminUserName $MySQLAdminUserName -MySQLDatabase $MySQLDatabase -MySQLAdminPassword $MySQLAdminPassword -MySQLHost $MySQLHost))    
    Write-SqlMsg -sqlResult $lsResult -err "Error detected in Change-SQLValue for table $tableName project $project key $key value $value"
    return $result
}
function Write-SqlMsg($sqlResult,$err,$msg="")
{
    $lsResult=([array]($sqlResult))
    if(($lsResult|where{$_ -match "ERROR"}).Count -gt 0)
    {
        $result=$false;
        Write-Host -Object $err -ForegroundColor Yellow
    }

    if($msg -ne $null -and $msg -ne "")
    {
        Write-Host -Object $msg -ForegroundColor Green

    }
        

}
function Get-KeysFromSetting($fileLocation)
{
    $lsKeys=@()
    if(Test-Path -Path $fileLocation)
    {
        $lsContent=[array](get-content -Path $fileLocation)
        
        foreach($line in $lsContent)
        {
            $lsKeys+=@($line.Split("=")[0])
        }

    }

    
    return $lsKeys
}
function Convert-SettingIntoSql($projectKey,$fileLocation,$tableName="")
{
    if($tableName -eq "")
    {
        $tableName=Split-Path -Path $fileLocation -Leaf
    }
    $project=""
    $lsKeys=[array]($projectKey.split(","))
    $lsKeys|foreach{$project+=(Load-ValueFromSetting -SettingPath $fileLocation -Value $_)+"~"}
    
    $lsKeys=Get-KeysFromSetting -fileLocation $fileLocation
    foreach($key in $lsKeys)
    {
        try
        {
            $value=Load-ValueFromSetting -SettingPath $fileLocation -Value $key
            Write-ValueToSql -tableName $tableName -key $key -value $value -project $project
        }
        catch
        {
            $Error.Clear()
        }
        
        
    }
    
    
}

function Load-PushInfoToSql($PushInfo_Location)
{
    
}

function Write-ValueToSql($tableName,$key,$value,$project=$Global:Project,[switch]$NoLastModified)
{
    
 
    $bResult=$true
    $tableName=$tableName.replace(".","_")
    #Make \ sql friendly
    $value=$value.replace("\","\\")
    if($Global:Project -eq $null -or $Global:Project -eq "")
    {
        $Global:Project="GLOBAL"
        $project=$Global:Project
    }

    $key=$key.replace(($project.tostring()+"_"),"")


    $project=$project.ToUpper()
    try
    {
        $sqlTest=New-Object MySql.Data.MySqlClient.MySqlConnection
        $sqlTest.Close()
        #create new table if needed
        New-SQLTable $tableName
        $result1=Add-SQLColumn -tableName $tableName -key $key

        $result2=Change-SQLValue -tableName $tableName -project $project -key $key -value $value -NolastModified $NoLastModified.IsPresent
        $result=$result1 -and $result2
        Write-SqlMsg -msg "Write $project 's $key into $tableName successfully"

    }
    catch
    {
        Write-Host -Object "Error detected in Write-ValueToSql for table $tableName key $key value $value" -ForegroundColor Yellow
        $result=$false;
    }
    return $result

}
function Load-ValueFromSql($tableName,$key,$project=$Global:Project)
{
    $bResult=$true

    $tableName=$tableName.replace(".","_")
    
    if($Global:Project -eq $null -or $Global:Project -eq "")
    {
        $Global:Project="GLOBAL"
        $project=$Global:Project
    }
    $project=$project.ToUpper()
    try
    {
        $sqlTest=New-Object MySql.Data.MySqlClient.MySqlConnection
        $sqlTest.Close()
        #create new table if needed
        $query="select * from $tableName where project='$project'"
        $lsResult=([array](Query-Database -Query $query -MySQLAdminUserName $MySQLAdminUserName -MySQLDatabase $MySQLDatabase -MySQLAdminPassword $MySQLAdminPassword -MySQLHost $MySQLHost))    
        Write-sqlMsg -sqlResult $lsResult -err "Error in Load-ValueFromSql -tableName $tableName,key $key,value $value,project $project | $lsResult"
        $result=$lsResult[0].Item($key)
        

    }
    catch
    {
        Write-Host -Object "Error detected in Load-ValueFromSql for table $tableName key $key project $project" -ForegroundColor Yellow
        $result=$null;
    }
    return $result
}
function Invoke-AdsDiff($standAlonePath,$inputPath,$basePath,$sRulePath,$criteria)
{
    #Test if there is there is ADSDiffToolRelease release folder in the same directory as clientprep.ps1. If so, it means that we are doing stand-alone package            
    if(Test-Path $standAlonePath)
    {
        $local_Ads_Diff_Folder=$standAlonePath
    }
    else
    {
        #Sync ADSDiff Tool from P4
        $P4_ADSDiff_Location=Load-ValueFromSetting -SettingPath $sParentFolder -Value P4_ADSDiff_Location -DefaultValue "//depot/qe/dev/AUTOMATION/ADSDiffTool/ADSDiffToolRelease/"
        $P4_Locations=[array]($P4_ADSDiff_Location)
        Sync-FromP4 -P4_Location_List $P4_Locations -P4_User $P4_User -P4_Server $P4_Server -P4_PASSWORD $P4_PASSWORD -P4_Work_Space_Folder $P4_Work_Space_Folder -P4_Work_Space_Name $P4_Work_Space_Name            
        $local_Ads_Diff_Folder=Convert-P4LocationToWinLocation -P4Location $P4_ADSDiff_Location -P4_Work_Space_Folder $P4_Work_Space_Folder                

        #delete everything under base folder and copy baseline ??
    }

    #copy .txtRecord from c:\testfiles to adsDiffTool folder
    $local_Ads_Input_Folder=Join-Path $local_Ads_Diff_Folder -ChildPath input
    $local_Ads_Base_Folder=Join-Path $local_Ads_Diff_Folder -ChildPath base
    Get-ChildItem -Path $inputPath -Recurse|where{$_.FullName.ToLower() -like $criteria}|Copy-Item -Destination $local_Ads_Input_Folder -Verbose -Force
    

    #Apply rule file
    if(Test-Path -Path $sRulePath)
    {
        Copy-Item -Path $sRulePath -Destination -Destination $local_Ads_Base_Folder -Verbose -Force
    }
    

    #Run ADSDiff Tool and generate result
    $ads_Diff_Exe=Join-Path -Path $local_Ads_Diff_Folder -ChildPath "AdsAccessorTest.exe"
    Start-Process -FilePath $ads_Diff_Exe -Wait

    #Invoke result.html
    Start-Process -FilePath (Join-Path -Path $local_Ads_Diff_Folder -ChildPath result.html)            
    
}

function Run-RestAPISmoke()
{
    $sPatternParent=Join-Path -Path $sParentFolder -ChildPath Project
    $sPatternParent=Join-Path -Path $sPatternParent -ChildPath PaterrnSearch
    $sOutput=Join-Path -Path $sPatternParent -ChildPath output
    if((Test-Path -Path $sOutput) -eq $false)
    {
        New-Item -Path $sOutput -ItemType Directory
    }
    $lsRecord=[array](Import-Csv -Path (Join-Path -Path $sPatternParent -ChildPath RestAPISmoke.csv))
    foreach($sRecord in $lsRecord)
    {
        if($sRecord.Argument -ne $null -and $sRecord.Argument -ne "")
        {
            $queryString=""
            if($sRecord.Argument.IndexOf("?") -eq -1)
            {
                $sRecord.Argument+="?"
            }
            $queryString=$sRecord.Argument+$sRecord.Input
            try
            {
                $result=Send-RESTAPIRequest -queryString $queryString   
                Write-Host $result        
                $sRecord.Output=$result.Content
                try
                {
                    $sTemp=ConvertFrom-Json -InputObject $result.content
                    $Extension="jquery"
                }
                catch
                {
                    $Extension="txt"
                }
                
                $result.content|Out-File -FilePath (Join-Path -Path $sOutput -ChildPath (($sRecord.Description+"_"+$sRecord.Argument).replace("?","").replace("/","")+".$Extension")) -Force
            }
            catch
            {
                $sRecord.Output="Error"
            }
        }
    
    }
    return $lsRecord
}

function Test-RestAPI($user="corp\wuwei",$pass="Changethis11",$servername="b110-2012r2-7.dev.aspentech.com",$iWaitTimeBetweenCases=1000)
{
    #aa-a1pedaily
    #Preliminary setup
    <#
    $user="corp\wuwei"
    $pass="Changethis11"
    $servername="aa-a1pedaily"
    $iWaitTimeBetweenCases=1000 #ms
    #>

    #Header Configuration
    $pair="${user}:${pass}"
    $bytes = [System.Text.Encoding]::ASCII.GetBytes($pair)
    $base64 = [System.Convert]::ToBase64String($bytes)
    $basicAuthValue = "Basic $base64"
    $headers = @{ Authorization = $basicAuthValue }
    
    $requestServer="http://$servername//Web21/ProcessData/AtProcessDataREST.dll/PatternSearch?"
    
    
    #Load all available input
    
    $inputFolder=Join-Path -Path $sParentFolder -ChildPath "Project\PaterrnSearch\input"
    $outFolder=Join-Path -Path $sParentFolder -ChildPath "Project\PaterrnSearch\output"
    $lsInput=[array](Get-ChildItem -Path $inputFolder|where{$_.Name -match ".in"})
    #loop through all files 
    foreach($input in $lsInput)
    {
        Write-Progress -Activity "REST API Testing" -Status ("Running "+$input.Name) -PercentComplete (($lsInput.IndexOf($input)/$lsInput.Count)*100)
        $queryString=[string](Get-Content -Path $input.FullName)
        $queryResult=Invoke-WebRequest -Uri ($requestServer+$queryString) -Headers $headers
        $outFileName=(Join-Path -Path $outFolder -ChildPath $input.Name.Replace(".in",".jquery"))
        $queryResult.Content|Out-File -FilePath $outFileName -Force
        Start-Sleep -Milliseconds $iWaitTimeBetweenCases


    }
    Write-Progress -Activity "REST API Testing" -Completed
}

function Send-RESTAPIRequest($user="corp\wuwei",$pass="Changethis11",$servername="b110-2012r2-7.dev.aspentech.com",$queryString)
{
    $pair="${user}:${pass}"
    $bytes = [System.Text.Encoding]::ASCII.GetBytes($pair)
    $base64 = [System.Convert]::ToBase64String($bytes)
    $basicAuthValue = "Basic $base64"
    $headers = @{ Authorization = $basicAuthValue }
    
    $passWord=ConvertTo-SecureString -String $pass -AsPlainText -Force
    $Cred=New-Object -TypeName System.Management.Automation.PSCredential -ArgumentList $user,$passWord


    $requestServer="http://$servername/ProcessData/AtProcessDataRest.dll/"
    #$requestServer="http://$servername//Web21/ProcessData/AtProcessDataREST.dll/"

    $queryResult=Invoke-WebRequest -Uri ($requestServer+$queryString) -Headers $headers -Credential $Cred

    return $queryResult


}
function Check-ServerPushReceiver($sClientDirectory="\\nhqa-w81-q10\V6\Project\Email_Tunnel\Test_Tunnel",$SMTP_Server="atmr01.aspentech.com",$sPublishServer="\\nhqa-w81-q10\V6\Project\Email_Tunnel\Test_Tunnel\UploadFolderTest",$FileWatcherName="Email_Test",$SCVMM_Username="corp\wuwei",$SCVMM_Password="Changethis10",$SCVMM_Server="scvmm2012hq",$SCVMM_Port="8100",$NumberARTCheckPointRemain="3",$VERSION="8.8",$MEDIA="999",$Client_Email_List,$MySQLAdminUserName="admin",$MySQLAdminPassword="Aspen100",$MySQLDatabase="mydb",$MySQLHost="nhqa-w81-q10")
{
    
    try
    {
        $pushInfoList=[array](Get-ChildItem -Path $sClientDirectory|where{$_.Name -match "PushInfo" -and $_.Name -match ".ini"})
        #$Push_Info_Location=Join-Path -Path $sClientDirectory -ChildPath "PushInfo.ini"
        $Push_Info_Location=$pushInfoList[0].FullName
        #Convert-SettingIntoSql -projectKey Execution_Batch,ClientStatus -fileLocation $Push_Info_Location -tableName PushInfo.ini
        
    }
    catch
    {
        #assign some impossible location
        $Push_Info_Location="zzwxy:\"
    }




    $sProjectDirectory=Split-Path -Path $sClientDirectory -Parent
    $sProjectControl=Join-Path -Path $sProjectDirectory -ChildPath "ProjectControl.ini"
    
    if((Test-Path -Path $Push_Info_Location))
    {
        #Push Email Send Mode
        $Send_Email_Switch=Load-ValueFromSetting -SettingPath $Push_Info_Location -Value "Send_Email_Switch" -DefaultValue "OFF"
        $VM_CheckPoint_Switch=Load-ValueFromSetting -SettingPath $Push_Info_Location -Value "VM_CheckPoint_Switch" -DefaultValue "OFF"                    
        $IIS_Server_Switch=Load-ValueFromSetting -SettingPath $Push_Info_Location -Value "IIS_Server_Switch" -DefaultValue "OFF"
        $Execution_Batch_Deuque=Load-ValueFromSetting -SettingPath $Push_Info_Location -Value "Execution_Batch_Deuque" -DefaultValue "VOIDExecutionBatch"
        $Email_Tunnel_Server=Load-ValueFromSetting -SettingPath (Join-Path -Path $sParentFolder -ChildPath CenterControl.ini) -Value Redirect_Email_Tunnel -DefaultValue "" -Seperator "&"
        if($Send_Email_Switch -match "ON")
        {
                            
                $Email_Subject=Load-ValueFromSetting -SettingPath $Push_Info_Location -Value Email_Subject
                $Email_Content_File=Load-ValueFromSetting -SettingPath $Push_Info_Location -Value Email_Content_File
                $ClientStatus=Load-ValueFromSetting -SettingPath $Push_Info_Location -Value ClientStatus
                            
                #Analyze whether we have email setting in ProjectControl.ini, if so, then we are going to use settings from there othwerwise use the push setting.
                $ProjectStepEmail=[array](Load-ValueFromSetting -SettingPath $sProjectControl -Value ($ClientStatus+"_Email_List") -Seperator "," -DefaultValue "")
                if($ProjectStepEmail -ne $null -and $ProjectStepEmail -ne "")
                {
                    $Email_To=$ProjectStepEmail
                    Write-ValueToSetting -Path $Push_Info_Location -Key Email_To -Value $Email_To
                }
                else
                {
                    $Email_To=[array](Load-ValueFromSetting -SettingPath $Push_Info_Location -Value Email_To -Seperator "," -DefaultValue "")

                    if($Email_To -eq $null -or $Email_To -eq "")
                    {
                        $Email_To=[array]($Client_Email_List)
                    }

                }
                            
                            
                
                $Email_From=Load-ValueFromSetting -SettingPath $Push_Info_Location -Value Email_From -DefaultValue "weiwei.wu@aspentech.com"
                            
                $Email_Attachements=$null
                $Email_Attachements=[array](Load-ValueFromSetting -SettingPath $Push_Info_Location -Value Email_Attachements -Seperator ","  -DefaultValue "")
                $Email_Attachements=$Email_Attachements|where{$_ -ne "" -and $_ -ne $null}
                $Email_Body_HTML_Switch=Load-ValueFromSetting -SettingPath $Push_Info_Location -Value Email_Body_HTML_Switch -DefaultValue "OFF"

                $Email_Attachment_Paths=@()                            
                            
                foreach($Attachment in $Email_Attachements)
                {
                    $Email_Attachment_Paths+=@(Join-Path -Path $sClientDirectory -ChildPath $Attachment)
                }

                $sContent=[string](Get-Content -Path (Join-Path -Path $sClientDirectory -ChildPath $Email_Content_File))
                $Execution_Batch=Load-ValueFromSetting -SettingPath $Push_Info_Location -Value Execution_Batch -DefaultValue "OFF"
                Write-ValueToSql -tableName PushInfo.ini -key Email_Content -value $sContent -project ($Execution_Batch+"~"+$ClientStatus+"~")
                
                $iCurrentErrorNumber=$Error.Count
                if($Email_Body_HTML_Switch -match "OFF" -and ($Email_Attachements -eq $null -or $Email_Attachements -match "no" -or $Email_Attachements -match "off" -or $Email_Attachements -eq ""))
                {
                    Send-MailMessage -From $Email_From -To $Email_To -Body $sContent -SmtpServer $SMTP_Server -Subject $Email_Subject
                                                                    
                }
                elseif($Email_Body_HTML_Switch -match "OFF" -and $Email_Attachements -ne $null)
                {
                    Send-MailMessage -From $Email_From -To $Email_To -Body $sContent -SmtpServer $SMTP_Server -Subject $Email_Subject -Attachments $Email_Attachment_Paths
                }



                if($Email_Body_HTML_Switch -match "ON" -and ($Email_Attachements -eq $null -or $Email_Attachements -match "no" -or $Email_Attachements -match "off" -or $Email_Attachements -eq ""))
                {
                    Send-MailMessage  -Subject $Email_Subject -From $Email_From -To $Email_To -BodyAsHtml $sContent -SmtpServer $SMTP_Server
                }
                elseif($Email_Body_HTML_Switch -match "ON" -and $Email_Attachements -ne $null)
                {
                    Send-MailMessage  -Subject $Email_Subject -From $Email_From -To $Email_To -BodyAsHtml $sContent -SmtpServer $SMTP_Server -Attachments $Email_Attachment_Paths
                }                
                if($Email_Tunnel_Server -ne "" -and (Test-Path -Path $Email_Tunnel_Server))                
                {
                    #Send-OutlookEmail -From $Email_From -To (Load-ValueFromSetting -SettingPath $Push_Info_Location -Value $Email_To -Seperator "!" -DefaultValue "") -Attach $Email_Attachment_Paths[0] -Body $sContent -Subject $Email_Subject -BodyAsHtml
                    
                    #$Email_Tunnel_Server=LoadValueFromSetting -Path $sCenterControlINI -sValue Redirect_Email_Tunnel -Express
                    Write-Host -Object "Send SMTP email message failed. Use Email tunnel isntead"
                    
                    Write-ValueToSetting -Path $Push_Info_Location -Key "IIS_Server_Switch" -Value "OFF"
                    Write-ValueToSetting -Path $Push_Info_Location -Key "Execution_Batch_Deuque" -Value "VOIDExecutionBatch"
                    $VM_CheckPoint_Switch=Load-ValueFromSetting -SettingPath $Push_Info_Location -Value "VM_CheckPoint_Switch" -DefaultValue "OFF"                    
                    Write-ValueToSetting -Path $Push_Info_Location -Key "VM_CheckPoint_Switch" -Value "OFF"
                    $IIS_Server_Switch=Load-ValueFromSetting -SettingPath $Push_Info_Location -Value "IIS_Server_Switch" -DefaultValue "OFF"
                    $Execution_Batch_Deuque=Load-ValueFromSetting -SettingPath $Push_Info_Location -Value "Execution_Batch_Deuque" -DefaultValue "VOIDExecutionBatch"

                    Copy-Item -Path $Push_Info_Location -Destination $Email_Tunnel_Server -Force -Verbose
                    Copy-Item -Path (Join-Path -Path $sClientDirectory -ChildPath $Email_Content_File) -Destination $Email_Tunnel_Server -Force -Verbose
                    Write-ValueToSetting -Path $Push_Info_Location -Key "VM_CheckPoint_Switch" -Value $VM_CheckPoint_Switch
                    Write-ValueToSetting -Path $Push_Info_Location -Key "IIS_Server_Switch" -Value $IIS_Server_Switch
                    Write-ValueToSetting -Path $Push_Info_Location -Key "Execution_Batch_Deuque" -Value $Execution_Batch_Deuque

                }
                #>

                Write-ValueToSetting -Path $Push_Info_Location -Key "Send_Email_Switch" -Value "OFF"
            }
        
        if($IIS_Server_Switch -match "ON")
        {
            $IIS_Attachements=[array](Load-ValueFromSetting -SettingPath $Push_Info_Location -Value IIS_Attachements -Seperator ","  -DefaultValue "")
            $sPublishFolder=Join-Path -Path $sPublishServer -ChildPath $FileWatcherName
            foreach($attachment in $IIS_Attachements)
            {
                $attachment=(Join-Path -Path $sClientDirectory -ChildPath $attachment)
                            
                Copy-Item -Path $attachment -Destination $sPublishFolder -Force
            }
            Write-ValueToSetting -Path $Push_Info_Location -Key "IIS_Server_Switch" -Value "OFF"                        
        }

        #VM Checkpoint
        
        if($VM_CheckPoint_Switch.ToLower() -eq "on")
        {
                        
            $VM_Name=Load-ValueFromSetting -SettingPath $Push_Info_Location -Value "VM_Name"                        
            Log-Server -sServerLog "Creating VM checkpoint"
            Create-SnapshotwithNLatest -Username $SCVMM_Username -Password $SCVMM_Password -Server $SCVMM_Server -PORT $SCVMM_Port -VMName $VM_Name -NumberCheckpointRemain $NumberARTCheckPointRemain -CheckpointName ("Version="+$VERSION+"Media="+$MEDIA)
            Write-ValueToSetting -Path $Push_Info_Location -Key "VM_CheckPoint_Switch" -Value "OFF"
                   
        }

        #mySQL Dequeue
        
        if($Execution_Batch_Deuque -ne "VOIDExecutionBatch")
        {

            $currentScheduledRun=Query-Database -Query "select * from execution_batch where name=`"$Execution_Batch_Deuque`"" -MySQLAdminUserName $MySQLAdminUserName -MySQLAdminPassword $MySQLAdminPassword -MySQLDatabase $MySQLDatabase -MySQLHost $MySQLHost
            $currentScheduledRun=Query-Database -Query "select * from execution_batch where name=`"$($currentScheduledRun.Base_Batch)`"" -MySQLAdminUserName $MySQLAdminUserName -MySQLAdminPassword $MySQLAdminPassword -MySQLDatabase $MySQLDatabase -MySQLHost $MySQLHost
            if(([array]$currentScheduledRun).Count -eq 1)
            {
                #perform dequeue only if there is run in the queue
                if($currentScheduledRun.Scheduled_Run.Contains("Run"))
                {
                    $queue=[array]($currentScheduledRun.Scheduled_Run.Split(",")|where{$_ -ne "" -and $_ -ne $null})
                    #If number of items in the queue is 2 Run,xxxx=>run|xxx, then erase everything in there
                    if($queue.Count -le 2)
                    {
                        $newQueue=","
                    }
                    else
                    {
                        $newQueue=$currentScheduledRun.Scheduled_Run.Substring($currentScheduledRun.Scheduled_Run.IndexOf(",")+1)
                        $newQueue=$newQueue.Substring($newQueue.IndexOf(","))
                    }     
                    $Query="
                        UPDATE execution_batch SET Scheduled_Run=`"$newQueue`" where Name=`"$($currentScheduledRun.Name)`"
                    ".Replace("\","\\")
                    
                    Query-Database -Query $Query -MySQLAdminUserName $MySQLAdminUserName -MySQLAdminPassword $MySQLAdminPassword -MySQLDatabase $MySQLDatabase -MySQLHost $MySQLHost       

                }
                Write-ValueToSetting -Path $Push_Info_Location -Key "Execution_Batch_Deuque" -Value VOIDExecutionBatch

            }
        
        }        
        #delete duplicate history file before we rename current one
        $sHistoryFile=$Push_Info_Location.Replace("PushInfo","History")        
        if(Test-Path -Path $sHistoryFile)
        {
            Remove-Item -Path $sHistoryFile -Force
        }
        Rename-Item -Path $Push_Info_Location -NewName $sHistoryFile
        
        

    }
                    
    $iCurrentErrorNumber=$Error.Count

    
    
    
    if($iCurrentErrorNumber -lt $Error.Count)
    {
        Write-Host -Object "Wrong Error Count"
        Remove-Item -Path $Push_Info_Location -Force
    }
    
}

function Create-ZipFiles( $zipfilename, $sourcedir )
{
   if(Test-Path -Path $zipfilename)
   {
        Remove-Item -Path $zipfilename
   }
   Add-Type -Assembly System.IO.Compression.FileSystem
   $compressionLevel = [System.IO.Compression.CompressionLevel]::Optimal
   [System.IO.Compression.ZipFile]::CreateFromDirectory($sourcedir,
    $zipfilename, $compressionLevel, $false)
}
Function configure-Fortran($fortanLicenseFolder="C:\Program Files (x86)\Common Files\Intel\Licenses\",$licenseServer="hqfortran01")
{
    #Configure  USE_SERVER.lic
    
    $fortanLicenseLocation=Join-Path -Path $fortanLicenseFolder -ChildPath USE_SERVER.lic
    $lsContent=[string](Get-Content -Path $fortanLicenseLocation)
    $elements=$lsContent.Split(" ")
    $elements[1]=$licenseServer
    $output=""
    $elements|foreach{$output+=($_+" ")}
    $output=($output+"end").Replace(" end","")
    $output|Out-File -FilePath $fortanLicenseLocation -Force -Encoding ascii -Verbose

    #Configure verndorKey.lic
    $vendorKey=Join-Path -Path $fortanLicenseFolder -ChildPath vendorkey.lic
    $lsContent=[array](Get-Content -Path $vendorKey)
    $previousIP=$lsContent[0].Split(" ")[1]
    $currentIP=Get-IPAddress -MachineName $licenseServer
    $lsContent[0]=$lsContent[0].Replace($previousIP,$currentIP)
    $lsContent|Out-File -FilePath $vendorKey -Force -Encoding ascii -Verbose
    

    
}

Function Run-QCTest($QCProjectFolder,$sServerDirectory,$ClientStatus,[switch]$output,[switch]$outeo,[switch]$aprop,[switch]$testsuite)
{
        #Launch APlusOutput Test
        
        $Result_Upload_Folder=Load-ValueFromSetting -SettingPath $sParentFolder -Value Result_Upload_Folder
            
        $Installation_File=Load-ValueFromSetting -SettingPath $sParentFolder -Value Installation_File
        $startTime=Get-Date
        
        
        if($output.IsPresent)
        {
            $Qc_Execution_Location="C:\p4\qctest\qctest\testsuite\Output"
            $APlusOutputBatch=Join-Path -Path $QCProjectFolder -ChildPath aplusoutput.bat
            
            $resultName="output.zip"
            

        }
        elseif($outeo.IsPresent)
        {
            $Qc_Execution_Location="C:\p4\qctest\qctest\testsuite\outeo"
            $APlusOutputBatch=Join-Path -Path $QCProjectFolder -ChildPath aplusouteo.bat            
            $resultName="outeo.zip"
            
        }
        elseif($aprop.IsPresent)
        {
            $Qc_Execution_Location="C:\p4\qctest\qctest\testsuite\Aprop"
            $APlusOutputBatch=Join-Path -Path $QCProjectFolder -ChildPath aplusouteo.bat            
            $resultName="outeo.zip"
        }
        
        Start-Process -FilePath $APlusOutputBatch
        
        $iQCTimer=0
        Start-Sleep -Seconds 120
        while(([array](Get-Process|where{$_.MainWindowTitle -match "Customize Aspen"})).Count -gt 0)
        {
            Write-Progress -Status "QC Test has been running for $iQCTimer s" -Activity "QC Test"
            Start-Sleep -Seconds 5
            $iQCTimer+=5
                
        }
                    
        Set-Location -Path $Qc_Execution_Location

        #Launch rgrssn to generate report
        &(Get-ChildItem -Path $Qc_Execution_Location|where{$_.FullName.ToLower() -like "*rgrssn*.bat"}).FullName
        


        $reportLocation=Join-Path -Path $Qc_Execution_Location -ChildPath dir.rep
        $emailContent=analyze-qctestreport -repLocation $reportLocation -media $Installation_File -startTime $startTime
        $timeSpan=((Get-Date)-$startTime).TotalHours
        $passRate=analyze-qctestreport -repLocation $reportLocation -media $Installation_File -startTime $startTime -returnPassRate
        New-PushInfo -sServerDirectory $sServerDirectory -uploadNow -lsContent $emailContent -Email_Subject "[$ClientStatus] Test Suite Execution Result" -ClientStatus ($sProject+"_"+$ClientStatus) -Email_Body_HTML_Switch -Email_To "weiwei.wu@aspentech.com" -sPassRate "Pass Rate: $passRate %" -sTimeSpan $timeSpan
            
        $qc_zip_file=(Join-Path -Path $QCProjectFolder -ChildPath ($Installation_File+"_"+$resultName))
        Create-ZipFiles -zipfilename $qc_zip_file  -sourcedir $Qc_Execution_Location
        #copy result to hqfiler
        Copy-Item -Path $qc_zip_file -Destination $Result_Upload_Folder -Verbose
        #Timeout wait 2 min to let email send out
        Start-Sleep -Seconds 120
}


function analyze-qctestreport([string]$repLocation,$media,[datetime]$startTime,[switch]$returnPassRate)
{
    $lsRep=[array](Get-Content -Path $repLocation)
    $startIndicator="---------------------------------------------------------------------"
    $endIndicator=""

    $iPass=0
    $iDiff=0
    $bStart=$false
    
    foreach($sLine in $lsRep)
    {
        if($sLine -eq $startIndicator)
        {
            $bStart=$true
            continue
        }
        if($sLine -eq $endIndicator)
        {
            $bStart=$false
            continue
        }
        if($bStart -eq $false)
        {
            continue
        }
        
        $lineItems=[array]($sLine.split(" "))|where{$_ -ne ""}
        try
        {
            $iPass=[int]::Parse($lineItems[1])
            $iDiff=[int]::Parse($lineItems[2])
        }
        catch
        {
            Write-Host
        }
        
        
    }
    if($returnPassRate.IsPresent)
    {
        $passRate=$iPass/($iPass+$iDiff)*100   
        return $passRate
    }
    $Report=generateHTMLfromCSV -media $media -clientConfig "Windows 10" -endTime (Get-Date) -clientName $env:COMPUTERNAME -passed $iPass -failed $iDiff -startTime $startTime
    
    return $Report


}
function restore-AESDB()
{
    $dbRestoreList=Get-ChildItem -Path "C:\ProgramData\AspenTech" -Recurse|where{$_.FullName -match "dbRestore.bat"}
    foreach($dbRestore in $dbRestoreList)
    {
        &$dbRestore.FullName
    }
}
function Set-APlusCompiler($sApsetCompLocation="")
{
    #Configurate Aspen Plus Compiler
    if($sApsetCompLocation -eq "")
    {
        $fulllist=(Get-ChildItem -Path 'C:\Program Files (x86)\AspenTech' -Recurse).FullName
    }
    $sTarget=($fulllist|where{$_.ToLower() -like "*apsetcomp.exe"})
    if($sTarget.count -gt 0)
    {
        foreach($_ in $sTarget)
        {
            $List=&$_ -list
            foreach($Entry in $List)
            {
                if($Entry -match "OK")
                {
                    break
                }
            }
            #Get the index of the entry
            if($Entry[0] -eq " ")
            {
                $Index=$Entry[2]
            }
            else
            {
                $Index=$Entry.ToString().Split(" ")[1]
            }

            Start-Process -FilePath $_ -ArgumentList "-setuser -sect=$Index"
            Start-Process -FilePath $_ -ArgumentList "-setmachine -sect=$Index"

        }
    
}
}
function New-PushInfo([string]$sServerDirectory,[switch]$uploadNow,[string]$lsContent,[string]$Email_Subject,$ClientStatus,$Email_From="weiwei.wu@aspentech.com",$Email_Attachments="no",[switch]$Email_Body_HTML_Switch,$IIS_Attachements="OFF",$Email_To="",[switch]$Take_Checkpoint,[switch]$mySqlDequeue,$sPassRate,$sTimeSpan,$settingLocation)
{
        #Push email content to the server 
        $index=Get-Date -Format "yyMMdd_hhmm"
        $Email_Content_Local=(Join-Path -Path $sParentFolder -ChildPath ("EmailContent"+$index+".txt"))

        $lsContent|Out-File -FilePath $Email_Content_Local -Force
        $settingContent=""
        if($settingLocation -ne $null -and (Test-Path -Path $settingLocation))        
        {
            $settingContent=Get-Content -Path $settingLocation
        }

        $PushInfo_Location=Join-Path -Path $sParentFolder -ChildPath ("PushInfo"+$index+".ini") 
        $settingContent|Out-File -FilePath $PushInfo_Location -Force
        if($IIS_Attachements -eq "OFF")
        {
            Write-ValueToSetting -Path $PushInfo_Location -Key IIS_Server_Switch -Value "OFF"
        }
        else
        {
            Write-ValueToSetting -Path $PushInfo_Location -Key IIS_Server_Switch -Value "ON"
            Write-ValueToSetting -Path $PushInfo_Location -Key IIS_Attachements -Value $IIS_Attachment
        }
        
        $Email_Content_Name=Split-Path -Path $Email_Content_Local -Leaf
        Write-ValueToSetting -Path $PushInfo_Location -Key Email_Content_File_Name -Value $Email_Content_Local
        Write-ValueToSetting -Path $PushInfo_Location -Key Pass_Rate -Value $sPassRate
        Write-ValueToSetting -Path $PushInfo_Location -Key Time_Span -Value $sTimeSpan        
        Write-ValueToSetting -Path $PushInfo_Location -Key Comment -Value ""

        Write-ValueToSetting -Path $PushInfo_Location -Key Send_Email_Switch -Value "ON"
        Write-ValueToSetting -Path $PushInfo_Location -Key Email_Subject -Value $Email_Subject
        Write-ValueToSetting -Path $PushInfo_Location -Key Email_Content_File -Value $Email_Content_Name
        Write-ValueToSetting -Path $PushInfo_Location -Key ClientStatus -Value $ClientStatus
        if($Email_List -match "list")
        {
            $Email_List=Load-ValueFromSetting -SettingPath $sParentFolder -Value Email_List -Seperator "!"
        }
        elseif($Email_To -ne $null -and $Email_List -ne "")
        {
            $Email_List=$Email_To
        }
        

        


        Write-ValueToSetting -Path $PushInfo_Location -Key Email_To -Value $Email_List
        Write-ValueToSetting -Path $PushInfo_Location -Key Email_From -Value $Email_From
        
        
        



        if($Email_Body_HTML_Switch.IsPresent)
        {
            Write-ValueToSetting -Path $PushInfo_Location -Key Email_Body_HTML_Switch -Value "ON"
        }
        else
        {
            Write-ValueToSetting -Path $PushInfo_Location -Key Email_Body_HTML_Switch -Value "OFF"
        }
        if($Take_Checkpoint.IsPresent)
        {
            Write-ValueToSetting -Path $PushInfo_Location -Key VM_CheckPoint_Switch -Value "ON"
            $hostName=[System.Net.Dns]::GetHostName()
            Write-ValueToSetting -Path $PushInfo_Location -Key VM_Name -Value $hostName
            
        }

        $Execution_Batch=Load-ValueFromSetting -SettingPath (Join-Path -Path $sParentFolder -ChildPath setting.ini) -Value Execution_Batch
        if($mySqlDequeue.IsPresent)
        {            
            Write-ValueToSetting -Path $PushInfo_Location -Key Execution_Batch_Deuque -Value $Execution_Batch
        }
        Write-ValueToSetting -Path $PushInfo_Location -Key Execution_Batch -Value $Execution_Batch
        

        $newIIsAttachments=""
        $newEmailAttachments=""
        if($uploadNow.IsPresent)
        {
            if($Email_Attachments -ne "no")
            {
                $lsAttachment=$Email_Attachments.Split(",")
                foreach($attachment in $lsAttachment)
                {
                    if(Test-Path($attachment))
                    {
                        $attachmentLocation=$attachment
                        $newEmailAttachments+=","+(Split-Path $attachment -Leaf)
                    }
                    else
                    {
                        $attachmentLocation=(Join-Path -Path $sParentFolder -ChildPath $attachment)
                        $newEmailAttachments+=","+$attachment
                    }
                    
                    Copy-Item -Path $attachmentLocation -Destination $sServerDirectory -Force -Verbose
                }
                Write-ValueToSetting -Path $PushInfo_Location -Key Email_Attachements -Value $newEmailAttachments
            }


            if($IIS_Attachements -ne "OFF")
            {
                $lsAttachment=$IIS_Attachements.Split(",")
                foreach($attachment in $lsAttachment)
                {
                    if(Test-Path($attachment))
                    {
                        $attachmentLocation=$attachment
                        $newIIsAttachments+=","+(Split-Path $attachment -Leaf)
                    }
                    else
                    {
                        $attachmentLocation=(Join-Path -Path $sParentFolder -ChildPath $attachment)
                        $newIIsAttachments+=","+$attachment
                    }
                    Copy-Item -Path $attachmentLocation -Destination $sServerDirectory -Force -Verbose
                    
                }
                Write-ValueToSetting -Path $PushInfo_Location -Key IIS_Attachements -Value $newIIsAttachments
            }
            Copy-Item -Path $Email_Content_Local -Destination $sServerDirectory -Force -Verbose
            Copy-Item -Path $PushInfo_Location -Destination $sServerDirectory -Force -Verbose
            Start-Sleep -Seconds 20
        }
        


        
}
function remove-emptyfolder($sFolder="",[switch]$Check)
{
    if(Test-Path -Path $sFolder)
    {
        if($Check.IsPresent)
        {
            $folderList=@($sFolder)
        }
        else
        {
            $folderList=([array](Get-ChildItem -Path $sFolder|where{$_.PsIsContainer -eq $true})).FullName    
        }
        

        
        foreach($folder in $folderList)
        {
            $subChildren=[array](Get-ChildItem -Path $folder)
            $containers=([array]($subChildren|where{$_.PSIsContainer}))
            $files=([array]($subChildren|where{$_.PSIsContainer -eq $false}))
            $bFileClear=$false
            $bContainerClear=$false
            if($files.Count -eq 0)
            {
                $bFileClear=$true
            }

            if($containers.Count -eq 0)
            {
                $bContainerClear=$true
            }

            if($bContainerClear -and $bFileClear)
            {
                Get-Item $folder|Remove-Item -Force -Verbose
            }
            else
            {
                if($Check.IsPresent)
                {return}
                else
                {
                    remove-emptyfolder -sFolder $folder
                    remove-emptyfolder -sFolder $folder -Check
                }
            }

            

        }

    }
    else
    {
        Write-Host "Please enter a valid folder name"
    }
}
function Skip-APEDLicense()
{
    if($wshell.AppActivate('Database Manager'))
    {
        Start-Sleep -Seconds 1
        $wshell.SendKeys("{ENTER}")
        Start-Sleep -Seconds 1
    }
}
function Get-MiniMVTList($Directory="C:\ProgramData\Microsoft\Windows\Start Menu\Programs")
{

    $linkFiles=Get-ChildItem -Path $Directory -Recurse|where{$_.FullName -match "Aspen" -and $_.FullName -match ".lnk"}
    $csv=@()
    foreach($file in $linkFiles)
    {
        
        $content=Get-Content -Path $file.FullName
        #$content=$content.replace(" ","")
        $exeLocation=$content.Substring($content.IndexOf("C:\Program Files (x86)"),$content.IndexOf(".exe")-$content.IndexOf("C:\ProgramFiles(x86)"))
        $exeLocationList=[array]($exeLocation.Replace(".exe","!").Split("!"))
        $exeLocation=$exeLocationList[0]+".exe"
        $exeObj=Get-Item -Path $exeLocation
        
        $id=$exeObj.name
        $Description=$id
        $software=$name
        $dir=$exeObj.Directory.FullName
        $exe=$exeObj.Name
        $process=$exe.Replace(".exe","")
        Start-Process $exeObj.FullName
        Start-Sleep -Seconds 30
        $RealCaption=(Get-Process -Name $process).MainWindowTitle        
        Get-Process -Name $process|Stop-Process -Force

        $obj=New-Object PSObject
        $Obj|Add-Member -MemberType NoteProperty -Name "id" -Value $id
        $Obj|Add-Member -MemberType NoteProperty -Name "Description" -Value $Description
        $Obj|Add-Member -MemberType NoteProperty -Name "software" -Value $software
        $Obj|Add-Member -MemberType NoteProperty -Name "dir" -Value $dir
        $Obj|Add-Member -MemberType NoteProperty -Name "exe" -Value $exe
        $Obj|Add-Member -MemberType NoteProperty -Name "process" -Value $process
        $Obj|Add-Member -MemberType NoteProperty -Name "RealCaption" -Value $RealCaption
        $obj   
        $csv+=$obj
        
    }
    $csv|Export-Csv -Path .\MiniMVT.csv
    
   
}

Function Send-OutlookEmail($Attach,$Body,$cc,[switch]$BodyAsHtml,$From,$To,$Subject,$smtpServer = "outlook.corp.aspentech.com")
{
    #mail server configuration
    
    $smtpUser = "hello"
    $smtpPassword = "####"
    #create the mail message
    $mail = New-Object System.Net.Mail.MailMessage
    #set the addresses
    $MailAddress=$From
    $MailtoAddress=$To
    $MailccAddress=""
    $mail.From = New-Object System.Net.Mail.MailAddress($MailAddress)
    $mail.To.Add($MailtoAddress)
    $mail.cc.Add($cc)
    #set the content
    $mail.Subject = $Subject;
    #$mail.Priority  = "High"
    $mail.Body = $Body
    $mail.IsBodyHtml=$BodyAsHtml.IsPresent
    #$filename = "\\yaod\ShareCode\$htmlfilename"
    $filename = "$projectpath\TestReport\$htmlfilename"
    $attachment = new-Object System.Net.Mail.Attachment($Attach)
    $mail.Attachments.Add($attachment)
    #send the message
    $smtp = New-Object System.Net.Mail.SmtpClient -argumentList $smtpServer
    $smtp.Credentials = New-Object System.Net.NetworkCredential -argumentList $smtpUser,$smtpPassword
    $smtp.Send($mail)  
}


Function Test-SettingItemComplete($sSettingTemplateLocation,$settingFileLocation)
{
    $testResult=$true
    $lsTemplate=[array](Get-Content -Path $sSettingTemplateLocation)
    $settingTemplate=@()
    foreach($item in $lsTemplate)
    {
        if($item -ne "")
        {
            $settingTemplate+=([array]($item.split("=")))[0]
        }
        
    }
    $lsCurrent=[array](Get-Content -Path $settingFileLocation)
    foreach($template in $settingTemplate)
    {
        if($template -eq "")
        {
            continue
        }
        $bRecordMissing=$true
        foreach($Current in $lsCurrent)
        {
            if($Current -like ($template+"*"))
            {
                $bRecordMissing=$false
                break
            }
        }
        if($bRecordMissing)
        {
            $testResult=$false
            break
        }
    }
    return $testResult
    
}


Function SettingClass($FileName,$Key,$Value)
{

    $obj = New-Object PSObject
    $obj | Add-Member -MemberType NoteProperty -Name "FileName" -Value $Name
    $obj | Add-Member -MemberType NoteProperty -Name "Key" -Value $Status
    $obj | Add-Member -MemberType NoteProperty -Name "Value" -Value $Testcase
    $obj | Add-Member -MemberType NoteProperty -Name "TimeStamp" -Value (Get-Date).ToString()
    return $obj
}
Function Sync-FromP4([array]$P4_Location_List,$P4_User,$P4_Server,$P4_PASSWORD,$P4_Work_Space_Folder,$P4_Work_Space_Name)
{
            $P4_Project_Support=$P4_Location_List|where{$_ -ne ""}
            #If there is a supporting file download required
            if($P4_Project_Support -ne $null)
            {
                #Log in to p4
                &p4 -u $P4_User -p $P4_Server logout
                $P4_PASSWORD|&p4 -d $P4_Work_Space_Folder -p $P4_Server -u $P4_User login
                foreach($SupportFolder in $P4_Project_Support)
                {

                    &p4 -d "$P4_Work_Space_Folder" -p "$P4_Server" -u "$P4_User" -c "$P4_Work_Space_Name" sync -f "$SupportFolder...#head"|Out-Host
                    Get-ChildItem -Recurse -Path (Convert-P4LocationToWinLocation -P4Location $SupportFolder -P4_Work_Space_Folder $P4_Work_Space_Folder)|where{$_.PsIsContainer -eq $false}|foreach{Set-ItemProperty -Path $_.FullName -Name IsReadOnly -Value $false}
                }
            }
}
Function Take-ScreenShot { 
    <#   
.SYNOPSIS   
    Used to take a screenshot of the desktop or the active window.  
.DESCRIPTION   
    Used to take a screenshot of the desktop or the active window and save to an image file if needed. 
.PARAMETER screen 
    Screenshot of the entire screen 
.PARAMETER activewindow 
    Screenshot of the active window 
.PARAMETER file 
    Name of the file to save as. Default is image.bmp 
.PARAMETER imagetype 
    Type of image being saved. Can use JPEG,BMP,PNG. Default is bitmap(bmp)   
.PARAMETER print 
    Sends the screenshot directly to your default printer       
.INPUTS 
.OUTPUTS     
.NOTES   
    Name: Take-ScreenShot 
    Author: Boe Prox 
    DateCreated: 07/25/2010      
.EXAMPLE   
    Take-ScreenShot -activewindow 
    Takes a screen shot of the active window         
.EXAMPLE   
    Take-ScreenShot -Screen 
    Takes a screenshot of the entire desktop 
.EXAMPLE   
    Take-ScreenShot -activewindow -file "C:\image.bmp" -imagetype bmp 
    Takes a screenshot of the active window and saves the file named image.bmp with the image being bitmap 
.EXAMPLE   
    Take-ScreenShot -screen -file "C:\image.png" -imagetype png     
    Takes a screenshot of the entire desktop and saves the file named image.png with the image being png 
.EXAMPLE   
    Take-ScreenShot -Screen -print 
    Takes a screenshot of the entire desktop and sends to a printer 
.EXAMPLE   
    Take-ScreenShot -ActiveWindow -print 
    Takes a screenshot of the active window and sends to a printer     
#>   
#Requires -Version 2 
        [cmdletbinding( 
                SupportsShouldProcess = $True, 
                DefaultParameterSetName = "screen", 
                ConfirmImpact = "low" 
        )] 
Param ( 
       [Parameter( 
            Mandatory = $False, 
            ParameterSetName = "screen", 
            ValueFromPipeline = $True)] 
            [switch]$screen, 
       [Parameter( 
            Mandatory = $False, 
            ParameterSetName = "window", 
            ValueFromPipeline = $False)] 
            [switch]$activewindow, 
       [Parameter( 
            Mandatory = $False, 
            ParameterSetName = "", 
            ValueFromPipeline = $False)] 
            [string]$file,  
       [Parameter( 
            Mandatory = $False, 
            ParameterSetName = "", 
            ValueFromPipeline = $False)] 
            [string] 
            [ValidateSet("bmp","jpeg","png")] 
            $imagetype = "bmp", 
       [Parameter( 
            Mandatory = $False, 
            ParameterSetName = "", 
            ValueFromPipeline = $False)] 
            [switch]$print                        
        
) 
# C# code 
$code = @' 
using System; 
using System.Runtime.InteropServices; 
using System.Drawing; 
using System.Drawing.Imaging; 
namespace ScreenShotDemo 
{ 
  /// <summary> 
  /// Provides functions to capture the entire screen, or a particular window, and save it to a file. 
  /// </summary> 
  public class ScreenCapture 
  { 
    /// <summary> 
    /// Creates an Image object containing a screen shot the active window 
    /// </summary> 
    /// <returns></returns> 
    public Image CaptureActiveWindow() 
    { 
      return CaptureWindow( User32.GetForegroundWindow() ); 
    } 
    /// <summary> 
    /// Creates an Image object containing a screen shot of the entire desktop 
    /// </summary> 
    /// <returns></returns> 
    public Image CaptureScreen() 
    { 
      return CaptureWindow( User32.GetDesktopWindow() ); 
    }     
    /// <summary> 
    /// Creates an Image object containing a screen shot of a specific window 
    /// </summary> 
    /// <param name="handle">The handle to the window. (In windows forms, this is obtained by the Handle property)</param> 
    /// <returns></returns> 
    private Image CaptureWindow(IntPtr handle) 
    { 
      // get te hDC of the target window 
      IntPtr hdcSrc = User32.GetWindowDC(handle); 
      // get the size 
      User32.RECT windowRect = new User32.RECT(); 
      User32.GetWindowRect(handle,ref windowRect); 
      int width = windowRect.right - windowRect.left; 
      int height = windowRect.bottom - windowRect.top; 
      // create a device context we can copy to 
      IntPtr hdcDest = GDI32.CreateCompatibleDC(hdcSrc); 
      // create a bitmap we can copy it to, 
      // using GetDeviceCaps to get the width/height 
      IntPtr hBitmap = GDI32.CreateCompatibleBitmap(hdcSrc,width,height); 
      // select the bitmap object 
      IntPtr hOld = GDI32.SelectObject(hdcDest,hBitmap); 
      // bitblt over 
      GDI32.BitBlt(hdcDest,0,0,width,height,hdcSrc,0,0,GDI32.SRCCOPY); 
      // restore selection 
      GDI32.SelectObject(hdcDest,hOld); 
      // clean up 
      GDI32.DeleteDC(hdcDest); 
      User32.ReleaseDC(handle,hdcSrc); 
      // get a .NET image object for it 
      Image img = Image.FromHbitmap(hBitmap); 
      // free up the Bitmap object 
      GDI32.DeleteObject(hBitmap); 
      return img; 
    } 
    /// <summary> 
    /// Captures a screen shot of the active window, and saves it to a file 
    /// </summary> 
    /// <param name="filename"></param> 
    /// <param name="format"></param> 
    public void CaptureActiveWindowToFile(string filename, ImageFormat format) 
    { 
      Image img = CaptureActiveWindow(); 
      img.Save(filename,format); 
    } 
    /// <summary> 
    /// Captures a screen shot of the entire desktop, and saves it to a file 
    /// </summary> 
    /// <param name="filename"></param> 
    /// <param name="format"></param> 
    public void CaptureScreenToFile(string filename, ImageFormat format) 
    { 
      Image img = CaptureScreen(); 
      img.Save(filename,format); 
    }     
    
    /// <summary> 
    /// Helper class containing Gdi32 API functions 
    /// </summary> 
    private class GDI32 
    { 
       
      public const int SRCCOPY = 0x00CC0020; // BitBlt dwRop parameter 
      [DllImport("gdi32.dll")] 
      public static extern bool BitBlt(IntPtr hObject,int nXDest,int nYDest, 
        int nWidth,int nHeight,IntPtr hObjectSource, 
        int nXSrc,int nYSrc,int dwRop); 
      [DllImport("gdi32.dll")] 
      public static extern IntPtr CreateCompatibleBitmap(IntPtr hDC,int nWidth, 
        int nHeight); 
      [DllImport("gdi32.dll")] 
      public static extern IntPtr CreateCompatibleDC(IntPtr hDC); 
      [DllImport("gdi32.dll")] 
      public static extern bool DeleteDC(IntPtr hDC); 
      [DllImport("gdi32.dll")] 
      public static extern bool DeleteObject(IntPtr hObject); 
      [DllImport("gdi32.dll")] 
      public static extern IntPtr SelectObject(IntPtr hDC,IntPtr hObject); 
    } 
 
    /// <summary> 
    /// Helper class containing User32 API functions 
    /// </summary> 
    private class User32 
    { 
      [StructLayout(LayoutKind.Sequential)] 
      public struct RECT 
      { 
        public int left; 
        public int top; 
        public int right; 
        public int bottom; 
      } 
      [DllImport("user32.dll")] 
      public static extern IntPtr GetDesktopWindow(); 
      [DllImport("user32.dll")] 
      public static extern IntPtr GetWindowDC(IntPtr hWnd); 
      [DllImport("user32.dll")] 
      public static extern IntPtr ReleaseDC(IntPtr hWnd,IntPtr hDC); 
      [DllImport("user32.dll")] 
      public static extern IntPtr GetWindowRect(IntPtr hWnd,ref RECT rect); 
      [DllImport("user32.dll")] 
      public static extern IntPtr GetForegroundWindow();       
    } 
  } 
} 
'@ 
#User Add-Type to import the code 
add-type $code -ReferencedAssemblies 'System.Windows.Forms','System.Drawing' 
#Create the object for the Function 
$capture = New-Object ScreenShotDemo.ScreenCapture 
 
#Take screenshot of the entire screen 
If ($Screen) { 
    Write-Verbose "Taking screenshot of entire desktop" 
    #Save to a file 
    If ($file) { 
        If ($file -eq "") { 
            $file = "$pwd\image.bmp" 
            } 
        Write-Verbose "Creating screen file: $file with imagetype of $imagetype" 
        $capture.CaptureScreenToFile($file,$imagetype) 
        } 
    ElseIf ($print) { 
        $img = $Capture.CaptureScreen() 
        $pd = New-Object System.Drawing.Printing.PrintDocument 
        $pd.Add_PrintPage({$_.Graphics.DrawImage(([System.Drawing.Image]$img), 0, 0)}) 
        $pd.Print() 
        }         
    Else { 
        $capture.CaptureScreen() 
        } 
    } 
#Take screenshot of the active window     
If ($ActiveWindow) { 
    Write-Verbose "Taking screenshot of the active window" 
    #Save to a file 
    If ($file) { 
        If ($file -eq "") { 
            $file = "$pwd\image.bmp" 
            } 
        Write-Verbose "Creating activewindow file: $file with imagetype of $imagetype" 
        $capture.CaptureActiveWindowToFile($file,$imagetype) 
        } 
    ElseIf ($print) { 
        $img = $Capture.CaptureActiveWindow() 
        $pd = New-Object System.Drawing.Printing.PrintDocument 
        $pd.Add_PrintPage({$_.Graphics.DrawImage(([System.Drawing.Image]$img), 0, 0)}) 
        $pd.Print() 
        }         
    Else { 
        $capture.CaptureActiveWindow() 
        }     
    }      
}    

function Make-ExecutionResultMonitor($sServerDirectory,$sParentFolder)
{
    #Upload the result into the server on the run
    $job1=Start-Job -Name SyncProgressWithServer -ArgumentList $sServerDirectory,$sParentFolder -ScriptBlock{
        param(
        [string]$sServerDirectory="",
        [string]$sParentFolder
        )
        $lsReport=@()
        $lsReport+=Join-Path -Path $sParentFolder -ChildPath progress.csv                                       
        $lsReport+=Join-Path -Path $sParentFolder -ChildPath ExecutionResult.csv
        $lsBefore=@()
        $i=0
        foreach($Report in $lsReport)
        {
                        
            $lsBefore+=Get-Date
                        
        }
                    
        $before=Get-Date
        while($true)
        {
                        
            Start-Sleep -Seconds 1

            for($i=0;$i -lt $lsReport.Length;$i++)
            {
                $progress=$lsReport[$i]
                $before=$lsBefore[$i]
                if(Test-Path -Path $progress)
                {
                    $obj=Get-ChildItem -Path $progress
                    $now=$obj.LastWriteTime
                    if($now -ne $before)
                    {
                        Write-Host "Uploading Result"
                        Copy-Item -Path $progress -Destination $sServerDirectory -Force
                        $before=$now
                    }
                }

                $lsBefore[$i]=$before

            }
                            
                            
                        
        }


    }
    return $job1
}
function Specify-WorkingFolder()
{
    if($wshell.AppActivate('Specify Working Folder'))
    {
        Start-Sleep -Seconds 1
        $wshell.SendKeys("c:\p4{ENTER}")
        Start-Sleep -Seconds 1
    }
    

}
function Skip-Warning
{
    if($wshell.AppActivate('Warning'))
    {
        Start-Sleep -Seconds 1
        $wshell.SendKeys("{ENTER}")
        Start-Sleep -Seconds 1
    }
}


function Run-MiniMVT($lsRecord,[switch]$New,[switch]$Validate)
{
    if($New.IsPresent -eq $false -and $Validate.IsPresent -eq $false)
    {
        $sRecordLocation=Join-Path -Path ".\" -ChildPath query.csv
        $sProgress=Join-Path -Path ".\" -ChildPath progress.csv
        $ExecutionResult=Join-Path -Path ".\" -ChildPath ExecutionResult.csv
        if(Test-Path -Path $sProgress)
        {
            $lsRecord=Import-Csv -Path $sProgress|where{$_.Exe -ne ""}
        }
        elseif(test-path -Path $sRecordLocation)
        {
            $lsRecord=Import-Csv -Path $sRecordLocation|where{$_.Exe -ne ""}
        }
    }

    $iTimeOut=120

    #Get a list of folder that we need to go through
    $lsProgramFolder=[array]($lsRecord.Dir|select -Unique)
    $lsProgramList=@()

    #Construct a list of program we have under the program folder
    foreach($folder in $lsProgramFolder)
    {
        $lsProgramList+=Get-ChildItem -Path $folder.ToString() -Recurse
    }
    Write-Host
    #Get the location of the executable file that we are going to test
    foreach($sRecord in $lsRecord)
    {
        
        #Clean up existing Aspen Software/IE/Excel
        Get-Process|where{$_.Name -match "mmc" -or $_.Description -match "Aspen" -or $_.Name -match "iexplore" -or $_.Name -match "EXCEL" -or $_.Description -match "afw"}|Stop-Process -Force


        Write-Host -Object ("Verifying "+$sRecord.Software)
        if($sRecord.Result -ne "")
        {

            Write-Host -Object ($sRecord.Software+" have been verify to be "+$sRecord.Result)    
            if($Validate.IsPresent -and $sRecord.Result -ne "PASS")
            {
                Write-Host -Object "Validation Mode, validate $($sRecord.Software) again "
                $sRecord.Result=""
            }
            else
            {
                continue
            }
            
        }
        #split .exe and arguments
        
        $exePattern=".exe"
        $ExeLocation=[array]($lsProgramList|where{$_.Name -like $sRecord.Exe -and $_.FullName.Contains(($sRecord.Dir))})
        if($ExeLocation.Count -eq 0)
        {
            $Exe=$sRecord.Exe.tolower().Substring(0,$exePattern.Length+$sRecord.Exe.IndexOf($exePattern))
            $sArg=$sRecord.Exe.tolower().Replace($Exe,"")
            $ExeLocation=[array]($lsProgramList|where{$_.Name -like $Exe -and $_.FullName.Contains(($sRecord.Dir))})
        }

        

        
        if($ExeLocation.Count -eq 0)
        {
            $sRecord.Result="FAIL. Cannot Find Exe"
        }
        else
        {
            $ExeLocation=$ExeLocation[0]
            Write-Host("Executing $($ExeLocation.FullName)$sArg")
            if($sArg -eq "" -or $sArg -eq $null)
            {
                #We make an exception for olefin as it will crash if we ask it to return a .net object
                if($ExeLocation.FullName -match "AspenOlefinsScheduler.exe" -or $ExeLocation.FullName -match "PIMSWIN.exe" -or $ExeLocation.FullName -match "exe")
                {
                    Invoke-WmiMethod -Class Win32_Process -ArgumentList $ExeLocation.FullName -Name Create|Out-Null
                }
                else
                {
                    &("$($ExeLocation.FullName)")
                }
                
            }
            else
            {
                Start-Process -FilePath $ExeLocation.FullName -ArgumentList $sArg
            }
                
            #remove arg after execution in case of error
            $sArg=$null
        
            $iTime=0

            #Analyze whether the process is blank or not. If it is blank, then we are going to use app name as process name
            $ProcessName=$sRecord.Process -Replace(".exe$","")
            if($ProcessName -eq "")
            {
                $ProcessName=$sRecord.Exe -Replace(".exe$","")
            }

            while($iTime -lt $iTimeOut)
            {
                $RealCaption=$sRecord.RealCaption.Replace("[","").Replace("]","")
                $Process=Get-Process -Name $ProcessName
                $RealTitle=$Process.MainWindowTitle.Replace("[","").Replace("]","")
                Specify-WorkingFolder
                Skip-APEDLicense
                Skip-Warning
                try
                {            
                    $sRecord.Caption=$RealTitle
                    Write-Host -Object "Expected Name is $RealCaption, Real Name is $RealTitle, Two titles similarity test is $($RealTitle -like $RealCaption), Process Responding is $($Process.Responding)"
                }
                catch
                {
                    Write-Host
                }
                #Check if the process is launched successfully or not
                if($RealTitle -like $RealCaption -and $Process.Responding)
                {
            
                    Write-Host "Verified"    
            
                    #Record the performance counter and upload our current execution progress
                    Send-PerformanceCommand -command Memory -target $ProcessName -Testcase $($sRecord.Software) -Step "Record the Memory Usage of $($sRecord.Software)"
                    Send-PerformanceCommand -command CPU -target $ProcessName -Testcase $($sRecord.Software) -Step "Record the CPU Usage of $($sRecord.Software)"
                
                    
                    Start-Sleep -Seconds 20

                    #This is just an effort to wait until the main window show up. 
                    #The problem is that AspenSplash might stuck forever....might not be a good indicator
                    while(([array](Get-Process -Name AspenSplash)).Count -gt 0)
                    {
                        $iTime++
                        if($iTime -gt $iTimeOut)
                        {
                            break
                        }

                    }
                    $iTime=0

                    Write-Host "Take Screenshot"
                    if(Test-Path $sParentFolder)
                    {
                        Take-ScreenShot -screen -imagetype jpeg -file ((Join-Path -Path $sParentFolder -ChildPath $sRecord.Software)+".jpeg")
                        Write-Host -Object ((Join-Path -Path $sParentFolder -ChildPath $sRecord.Software)+".jpeg")
                    }
                    else
                    {
                        Take-ScreenShot -screen -imagetype jpeg -file ".\$($sRecord.Software).jpeg"
                    }

                

                    #clean up
                    while($true)
                    {
                        $lsKillList=@()
                
                        Start-Sleep -Seconds 1
                        Write-Host "Kill the process"
                        $Process=Get-Process -Name $ProcessName
                        if($Process -eq $null)
                        {
                            break
                        }
                        else
                        {
                            $Process|Stop-Process -Force
                   

                        }
                    }
                    Start-Sleep -Seconds 15
                    break
            
                }
                Start-Sleep -Seconds 1
                $iTime++
            }



            if($iTime -ge $iTimeOut)
            {
                $sRecord.Result="FAIL. Application Launch after timeout of $iTimeOut s"
                Write-Host "Take Screenshot"
                if(Test-Path $sParentFolder)
                {
                    Take-ScreenShot -screen -imagetype jpeg -file ((Join-Path -Path $sParentFolder -ChildPath $sRecord.Software)+".jpeg")
                    Write-Host -Object ((Join-Path -Path $sParentFolder -ChildPath $sRecord.Software)+".jpeg")
                }
                else
                {
                    Take-ScreenShot -screen -imagetype jpeg -file ".\$($sRecord.Software).jpeg"
                }
            }
            else
            {
                $sRecord.Result="PASS"
                $sRecord.RealCaption=$RealTitle
            }
        }
        $lsRecord|Sort-Object -Property Result -Descending|Export-Csv -Path $sProgress -Force
        Start-Sleep -Milliseconds 500
    
    }

    $lsRecord|Export-Csv -Path $ExecutionResult
    return $lsRecord
}



Function Get-ComputerNameFromPath([string]$Path)
{
    $Path=$Path.Replace("\\","\")
    $Previous=$Path
    $i=0
    while($i -lt 255)
    {
        $Path=Split-Path -Path $Path -Parent
        if((Split-Path -Path $Path -Parent) -ne "")
        {
            $Previous=$Path
        }
        else
        {
            break
        }
        $i++
    }
    return $Previous.Replace("\","")


}

Function MachineClass($Name,$Status,$Testcase="",$TestcaseStartTime=(Get-Date).ToString(),$Execution_Batch,$Execution_Queue)
{

    
    
   
    $obj = New-Object PSObject
    $obj | Add-Member -MemberType NoteProperty -Name "Name" -Value $Name
    $obj | Add-Member -MemberType NoteProperty -Name "Status" -Value $Status
    $obj | Add-Member -MemberType NoteProperty -Name "Testcase" -Value $Testcase
    $obj | Add-Member -MemberType NoteProperty -Name "TestcaseStartTime" -Value $TestcaseStartTime

    return $obj
 

}

Function Get-MD5($FilePath)
{
    
    $md5 = New-Object -TypeName System.Security.Cryptography.MD5CryptoServiceProvider
    $fStream=[System.IO.File]::Open($FilePath,[System.IO.Filemode]::Open, [System.IO.FileAccess]::Read)
    $hash = [System.BitConverter]::ToString($md5.ComputeHash($fStream))
    $fStream.Dispose()
    return $hash
}
Function Get-SilktestCQFromExecutionCommand($Command)
{
    $sTemp=$Command
    #Get the plan file location
    $word=" -r "
    $iTestcaseLocation=$sTemp.IndexOf($word)+$word.Length
    $sTestcaseLocation=$sTemp.Substring($iTestcaseLocation).Replace("`"","")
    
    #Get the plan file content
    $sPlan=[string](Get-Content -Path $sTestcaseLocation)
    #Get the CQ number based on the plan file content
    $word="[ ] testcase: "
    $itestcaesIndex=$sPlan.IndexOf($word)
    $sTestcase=$sPlan.Substring($itestcaesIndex+$word.Length)
    return $sTestcase

    
}


Function Send-PerformanceCommand($command,$target,$optional,$Testcase="test",$Step="",$Tag="",$Result="",$Server="")
{
    #You can choose to give a batch command in following format 
    #command - The action you want to performed. Following is a list of command we currently support
        #Memory - Get current memory usage
        #CPU - Get curent CPU usage
        #Timer Start - start the timer
        #Timer Stop - Stop the timer. Please note that, this command will only stop the timer that has the same target, testcase, optioanal and step information
        #Debug - output result based on the information in the result tag
    #Testcase - Name of the testcase
    #Step - Name of the step
    #Result - This is parameter should be used with debug. It will output the information you specify in the result tag.
    #Server - Enter the remote location where the wwwPerfMonBase is running. It will collect the information in the remote machine

    #$command`t$target`t$optional`t$Testcase`t$Step`t+$Tag`t+$Result`n$command`t$target`t$optional`t$Testcase`t$Step`t+$Tag`t+$Result
    
    $Monitor=[array](Get-Process|where{$_.MainWindowTitle -match "ACTS Performance Monitor"})          
    if($Monitor.Count -ge 1)
    {
        [int] $Port = 8849 
        if($Server -eq "")
        {
            $IP = "127.0.0.1" 
        }
        else
        {
            $IP=Get-IPAddress $Server
            if($IP -match "Fail")
            {
                Write-Host "Fail to find machine $Server. Please make sure you key in the right server"
            }
        }
        
        
        $Address = [system.net.IPAddress]::Parse($IP) 
 
        # Create IP Endpoint 
        $End = New-Object System.Net.IPEndPoint $address, $port 
 
        # Create Socket 
        $Saddrf   = [System.Net.Sockets.AddressFamily]::InterNetwork 
        $Stype    = [System.Net.Sockets.SocketType]::Dgram 
        $Ptype    = [System.Net.Sockets.ProtocolType]::UDP 
        $Sock     = New-Object System.Net.Sockets.Socket $saddrf, $stype, $ptype 
        $Sock.TTL = 26 
 
        # Connect to socket 
        $sock.Connect($end)
 
        # Create encoded buffer 
        $Enc     = [System.Text.Encoding]::ASCII
        if($command -match "`n")
        {
            $Message=$command
        }
        else
        {
            $Message= $command+"`t"+$target+"`t"+$optional+"`t"+$Testcase+"`t"+$Step+"`t"+$Tag+"`t"+$Result
        }
        $Buffer  = $Enc.GetBytes($Message)
        $Sock.Send($Buffer)|Out-Null
        
        
    }
    else
    {
        Write-Warning -Message "Please launch ACTS Performance Monitor before using this command"
    }
}





Function Get-SettingValueHash([string]$FileName)
{
    #This function is to convert the setting file into a hash table
    #The default folder of the setting files are under .\ARTSetting
    $SettingValueHash=@{}
    if($FileName -notlike "*:\*")
    {
        $sSettingFolder=Join-Path -Path $sParentFolder -ChildPath ARTSetting    
        $SettingValueLocation=(Join-Path -Path $sSettingFolder -ChildPath $FileName)
    }
    else
    {
        $SettingValueLocation=$FileName
    }
    
    
    $txt=Get-Content -Path $SettingValueLocation
    foreach($sLine in $txt)
    {
        if($sLine -match "#")
        {
            continue
        }
        $Setting=$sLine.Split("=")[0]
        $Value=Load-ValueFromSetting -SettingPath $SettingValueLocation -Value $Setting
        $SettingValueHash.Add($Setting,$Value)
    }
    return $SettingValueHash


}
Function Get-ProductBuildHash($ProductAppHash,$AppInstallationFolder)
{
    $ApplicationDirectoryList=(Get-ChildItem -Path $AppInstallationFolder -Recurse -Include *.dll,*.exe).FullName.ToLower()
    $ProductBuildHash=@{}
    foreach($Key in $ProductAppHash.Keys)
    {
        $CurrentFullName=(($ApplicationDirectoryList|Select-String $ProductAppHash[$Key].ToLower())[0]).ToString()
        $ProductVersion=(Get-ItemProperty -Path $CurrentFullName).VersionInfo.FileVersion
        if($ProductVersion.ToLower() -match "build")
        {
            $lsTemp=$ProductVersion.Split(" ")
            $Last=$lsTemp.Count-1
            $BuildNumber=$lsTemp[$Last]
        }
        else
        {
            $lsTemp=$ProductVersion.Split(".")
            $Last=$lsTemp.Count-1
            $BuildNumber=$lsTemp[$Last]

        }
        

        $ProductBuildHash.Add($Key,$BuildNumber)
    }
    return $ProductBuildHash
}
Function Fix-TrustRelationship($ND_Cred)
{
    #This script is designed to fix trust relationsihp issue. It will detect whether a machine is in the domain or not. If not, it will fix the trust relationship and restart the machine.
    #It required a corp account to add the machine back to domain
    #The input is a credential variable. Make sure you do it right.
    #Author Weiwei Wu
    $Trusted=(Test-ComputerSecureChannel)
    if($Trusted -ne $true)
    {            
        Write-Host -Object "Trust Relationship Issue is detected. We are going to fix it right now." -ForegroundColor Red
        Remove-Computer -UnjoinDomainCredential $ND_Cred -Force
        Start-Sleep -Seconds 2
        Add-Computer -DomainName "dev.aspentech.com" -Credential $ND_Cred -Force
        Start-Sleep -Seconds 2
        Restart-Computer -Force
        Start-Sleep -Seconds 3600
    }
    return !$Trusted
}
function GetPassRateBasedOnCSV($resultsFile)
{
    $rate="NA"    
    if($resultsFile -ne "" -and $resultsFile -ne $null)
    {
        $lsRecord = Import-Csv -Path $resultsFile
        $passed=([array]($lsRecord|where{$_.result -eq "PASS"})).length
        $failed=([array]($lsRecord|where{$_.result -ne "PASS" -and $_.result -ne "FAIL. Cannot Find Exe"})).length
        $passRate=$passed/($passed+$failed)*100
        $rate=$passRate.ToString()+"%"

    }
    return $rate
}
Function generateHTMLfromCSV{
    Param(
      [string]$media = "Unspecified",
      [string]$clientConfig = "Unspecified",
      [DateTime]$startTime = [DateTime]"1/1/0001",
      [DateTime]$endTime = [DateTime]"1/1/0001",
        [Parameter(Mandatory=$false)][string]$resultsFile,
        [string]$clientName = "N/A",
        [int]$passed,
        [int]$failed
    )
 
    #read the .csv file
    if($resultsFile -ne "" -and $resultsFile -ne $null)
    {
        $lsRecord = Import-Csv -Path $resultsFile
        $passed=([array]($lsRecord|where{$_.result -eq "PASS"})).length
        $failed=([array]($lsRecord|where{$_.result -ne "PASS" -and $_.result -ne "FAIL. Cannot Find Exe"})).length
        $lsRecord|select id,headline,result |ConvertTo-Html -Fragment -As Table|Out-String|Out-File .\test.html

    }
    
    # ===---===---===---===--- ||||||||||||||||| ===---===---===---===---===

    $sTimeZone = [System.TimeZone]::CurrentTimeZone.DaylightName



    $tableColor1 = "#CCFFCC";
    $tableColor2 = "#CCFFCC";

    if($failed -gt 0){$errorColor = "#ff5959"; $headerColor = $errorColor; $sumColor = "rgb(217,217,217)"} else {$errorCOlor = "#CCFFCC"; $headerColor = "#e0fc85"; $sumColor = "rgb(0,0,0)"} 

    Write-host "$($startTime.ToString())"
    write-host "$($endTime.ToString())"

    $strStart = "$($startTime.ToString())"
    $strEnd = "$($endTime.ToString())"

    $htmlText ="    <!DOCTYPE html>
    <html>
    <head>
    <style>
 
    #resultsTable
    {
    font-family:`"Arial`";
    
    border-collapse:collapse;
 
    }
    #resultsTable td, #resultsTable th 
    {
    font-size:1em;
    border:1px solid #ffffff;
    background-color: $tableColor1;
    padding:3px 7px 2px 7px;
    }
    #resultsTable th 
    {
    font-size:1.5em;
    font-family:`"Arial`";
    text-align:center;
    padding-top:5px;
    padding-bottom:4px;
    background-color: $headerColor;
    color:$sumColor;
    }
    #resultsTable tr.alt td 
    {
    color: #000000;
    background-color: $tableColor2;
    }
    #resultsTable tr.error td 
    {
    background-color: $errorColor;
    color:$sumColor;
    font-weight:bold
    }
    </style>
    </head>
 
    <body>

 
    <table id=`"resultsTable`">
    <!--Specify Width of first column-->
    <col width=`"200`";>
 
    <tr>
      <th colspan=`"2`">SUMMARY</th>
    </tr>
    <tr>
    <td ><b>Media Number #</b></td>
    <td>$media</td>
 
    </tr>
    <tr class=`"alt`">
    <td><b>Client Configuration</b></td>
    <td>$clientConfig</td>
 
    </tr>
    <tr>
    <td><b>Test Date</b></td>
    <td>$($startTime.ToLongDateString())</td>
 
    </tr>
    <tr class=`"alt`">
    <td><b>Test Start Time</b></td>
    <td>$strStart ($sTimeZone)</td>
 
    </tr>
    <tr>
    <td><b>Test End Time</b></td>
    <td>$strEnd ($sTimeZone)</td>
 
    </tr>
    <tr class=`"alt`">
    <td><b>Test Duration</b></td>
    <td>$(($endTime - $startTime).ToString().SubString(0,8))</td>
 
    </tr>
    <tr>
    <td><b>Test Cases Passed</b></td>
    <td>$passed      ---   Percentage:&#160 $([math]::round((($passed * 1.0)/($passed + $failed) * 100.0), 1)) %</td>
 
    </tr>
    <tr class=`"error`">
    <td><b>Test Cases Failed</b></td>
    <td>$failed      ---   Percentage:&#160 $([math]::round((($failed * 1.0)/($passed + $failed) * 100.0), 1)) %</td>
 
    </tr>
    <tr>
    <td><b>Total Test Cases</b></td>
    <td>$($passed + $failed)</td>
 
    </tr>
	

 
    </table>

    <h1 style=`"font-family:verdana;font-size:16px;`">Operations Performed:</h1>
    <p>1. Installed the latest Media on clean state.<br>
       2. Executed Launch Test.<br>
       3. The details of the test and results are attached.<br>
    </p>
    <p> <br>
        
    </p>
    <p> Test machine name: $clientName<br>
    <p> Test machine User Account: $clientName\Admin or $clientName\Administrator<br>
    
        
    </p>
    <br>
    <p>Thank You for your Support,<br>
    <b>Smoke Test Automation Team<br></b>
    =====================================================================================================
    
    </p>
 
    
    </p>
	
	
	
	<style>
 
    #detailedSummaryTableDiv
    {
        width:1200px;
    }

    #detailedSummary
    {
    font-family:`"Arial`";
    border-collapse:collapse;
    width:100%;
    }
    #detailedSummary td, #detailedSummary th 
    {
    
    font-size:1em;
    border:1px solid #ffffff;
    background-color: #CCFFFF;
    padding:3px 7px 2px 7px;
    }
    #detailedSummary th 
    {
    font-size:1.5em;
    font-family:`"Arial`";
    text-align:center;
    padding-top:5px;
    padding-bottom:4px;
    background-color: #FFFFCC;
    color:#000000;
    }
    #detailedSummary tr.header td 
    {
    border:1px solid #000000;
    }
    #detailedSummary td 
    {
    border:1px solid #123455;
    
    }

    #detailedSummary td.left 
    {
    width:15%;
    word-wrap:break-word;
    
    }

    #detailedSummary td.right 
    {
    width:80%;
    }

    #detailedSummary td.pass 
    {
    width:5%;
    text-align: center
    }

    #detailedSummary td.NA
    {
    width:5%;
    text-align: center;
    background-color: Gray;
    color: #FFFFFF;
    }

    #detailedSummary td.fail 
    {
    width:5%;
    text-align: center;
    background-color: #FF5050;
    color: #FFFFFF;
    }

    }
    </style>

	<div id=`"detailedSummaryTableDiv`">
	<table id=`"detailedSummary`">
    <!--Specify Width of first column-->





 
    <tr>
      <th colspan=`"3`">Test Case Description</th>
    </tr>
    <tr class=`"header`">
    <td ><b>Test Case ID</b></td>
    <td><b>Case description</b></td>
    <td ><b>Pass/Fail</b></td>
    </tr>

    <!--marker.table_begin-->



    <!--marker.table_end-->
 
    </table>

    </div>
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
 
 
    </body>
    </html>"


    

    [string]$testCaseDesc="<colgroup><col/><col/><col/></colgroup>"

    #$lsRecord
    if($lsRecord.Count -ne 0)
    {
        foreach ($rowEntry in $lsRecord){
            write-host $rowEntry.id
            if($rowEntry.result -eq "PASS"){
                $testCaseDesc = $testCaseDesc + "<tr><td class=`"left`">"+$rowEntry.id+"</td><td>"+$rowEntry.description+"</td><td class=`"pass`">"+$rowEntry.result+"</td></tr>"
            } 
            elseif($rowEntry.result -eq "FAIL. Cannot Find Exe")
            {
                $testCaseDesc = $testCaseDesc + "<tr><td class=`"left`" style=`"background-color: Gray; color: #FFFFFF`">"+$rowEntry.id+"</td><td style=`"background-color: Gray`; color: #FFFFFF`">"+$rowEntry.description+"</td><td class=`"NA`">"+"Not in Media Kit"+"</td></tr>"
            }
            else {
                $testCaseDesc = $testCaseDesc + "<tr><td class=`"left`" style=`"background-color: #FF5050; color: #FFFFFF`">"+$rowEntry.id+"</td><td style=`"background-color: #FF5050`; color: #FFFFFF`">"+$rowEntry.description+"</td><td class=`"fail`">"+"Analysis required"+"</td></tr>"
            }
        

        }
        $htmlText = $htmlText.Insert($htmlText.IndexOf("<!--marker.table_end-->"),$testCaseDesc)
    }

    $htmlText
    [double]$passRate = $([math]::round((($passed * 1.0)/($passed + $failed) * 100.0), 1))
    $passRate
    return;
 
}

Function FindSolution([string]$sCurrentFolder="C:\p4\qe\dev\AUTOMATION\BAF\AutomaticRegressionFramework\extend")
{
    
    

    $List=[array](Get-ChildItem -Path $sCurrentFolder|where{$_.Name -match ".vtp*" -or $_.Name -match ".sln"})
    if($List.Count -lt 1)
    {
        $List=[array](Get-ChildItem -Path $sCurrentFolder -Recurse|where{$_.Name -match ".vtp*" -or $_.Name -match ".sln"})
    }


    if($List.Count -ge 1)
    {
        $result=$List[0].fullname
    }
    else
    {
        $ParentPath=Split-Path -Path $sCurrentFolder -Parent
        $result=FindSolution -sCurrentFolder $ParentPath
    }
    return $result

}
Function FetchControlInfo([string]$Execution_Batch,[string]$sSetting)
{
    $sRootFolder=$sParentFolder
    $sSetting=$sCenterControlINI    
    #Including    
    $MySQLAdminUserName=Load-ValueFromSetting -SettingPath $sSetting -Value "MySQLAdminUserName"
    $MySQLAdminPassword=Load-ValueFromSetting -SettingPath $sSetting -Value "MySQLAdminPassword"
    $MySQLDatabase=Load-ValueFromSetting -SettingPath $sSetting -Value "MySQLDatabase"
    $MySQLHost=Load-ValueFromSetting -SettingPath $sSetting -Value "MySQLHost"


    $Query="describe execution_batch;"

    $Info=Query-Database -Query $Query -MySQLAdminUserName $MySQLAdminUserName -MySQLAdminPassword $MySQLAdminPassword -MySQLDatabase $MySQLDatabase -MySQLHost $MySQLHost

    

    
    $Fields=$Info.Field
    $Query="select * from execution_batch where Name=`"$Execution_Batch`";"
    $Info=Query-Database -Query $Query -MySQLAdminUserName $MySQLAdminUserName -MySQLAdminPassword $MySQLAdminPassword -MySQLDatabase $MySQLDatabase -MySQLHost $MySQLHost
    
    $Global:Project=$Info.Product
    
    Write-ValueToSetting -Path $sSetting -Key "Project" -Value $Info.Product

    $Product=$Info.Product+"_"
    foreach($Field in $Fields)
    {
        if($Field -eq "Index" -or $Field -eq "Duration" -or $Field -eq "Product")
        {
            continue
        }
        elseif($Field -eq "Name")
        {
            $Item="Execution_Batch"
        }
        elseif($Field -eq "Date")
        {
            $Item ="Execution_Start_Time"
        }
        elseif($Field -eq "Scheduled")
        {
            $Item="Scheduled_Time"
        }
        else
        {
            $Item=$Field
        }
        #Write-Host -Object ($Product+$Item) -ForegroundColor Cyan
        #Write-Host -Object $Info.$Field -ForegroundColor Red
        Write-ValueToSetting -Path $sSetting -Key ($Product+$Item) -Value ($Info.$Field)
    }

    return $Info



}



Function connectRDP{
    Param(
        [String]$Computer,
        [String]$User,
        [String]$Password   
    )
        
    $ProcessInfo = New-Object System.Diagnostics.ProcessStartInfo
    $Process = New-Object System.Diagnostics.Process

    $ProcessInfo.FileName = "$($env:SystemRoot)\system32\cmdkey.exe"
    $ProcessInfo.Arguments = "/generic:TERMSRV/$Computer /user:$User /pass:$Password"
    $Process.StartInfo = $ProcessInfo
    $a = $Process.Start() # this is to suppress this call returning TRUE/FALSE from this function

    $ProcessInfo.FileName = "$($env:SystemRoot)\system32\mstsc.exe"
    $ProcessInfo.Arguments = "/v $Computer"
    $Process.StartInfo = $ProcessInfo
    $b = $Process.Start() # this is to suppress this call returning TRUE/FALSE from this function

    $id = $Process.Id
    return $id
}

Function Operate-ClientTaskQueue([SWITCH]$Dequeue,[SWITCH]$ChangeStatus,[string]$TaskAdded="")
{
    [string]$Queue=Load-ValueFromSetting -SettingPath $sParentFolder -Value "Task_Queue"
    $sCurrentStatus=Load-ValueFromSetting -SettingPath $sParentFolder -Value "Status"
    if($TaskAdded -ne "")
    {
        $Queue=($TaskAdded+";"+$Queue).Replace(";;;",";").Replace(";;",";")
        Write-ValueToSetting -Path $sParentFolder -Key Task_Queue -Value $Queue
    }
    else
    {
        $Task1=([array]($Queue.Split(";")))[0]
        if($Task1 -eq "" -or $Task1 -eq $null)
        {
            $Task1=([array]($Queue.Split(";")))[1]
        }    
        Write-Host -Object "Current Task is $Task1" -ForegroundColor DarkGreen
    
        #Determine whether we change the status or not
        if($ChangeStatus.IsPresent)
        {
            
            if($sCurrentStatus -eq $Task1)
            {
                HeartBeatUpdate -Status $Task1 -NoLocalStatusUpdate    
            }
            else
            {
                HeartBeatUpdate -Status $Task1
            }
            #Write-ValueToSetting -Path $sParentFolder -Key Status -Value $Task1
        }
    
        #Determine whether we will actual change the vlaue within the queue or not
        if($Dequeue.IsPresent)
        {
            $Queue=$Queue.Replace(";;","")
            $lsTask=[array]($Queue.Split(";"))
            $lsTask[0]=""
            $Queue=""
            foreach($_ in $lsTask)
            {
            
                if($_ -ne "")
                {
                    $Queue+=$_+";"
                }
            }
            
            Write-ValueToSetting -Path $sParentFolder -Key Task_Queue -Value $Queue
        }
    }

    Start-Job -ArgumentList $sParentFolder,$sServerDirectory,$Task1 -ScriptBlock {
        param($sParentFolder,$sServerDirectory,$Task1)
        .(Join-Path -Path $sParentFolder -ChildPath wwwErrorAnalysis.ps1)
        log -ServerLocation $sServerDirectory -Err ("Finish "+$Task1)

    }
    return $Task1
    

}



Function Convertto-ProgressBar([HashTable]$MachineStatusList,$Progress=0.001,[HashTable]$ClientExecutionHashTable)
{
    Function CreateCanvas([array]$MachineList)
    {
        [string]$ScriptBlock="<p>"
        foreach($Machine in $MachineList)
        {
            $ScriptBlock+="$Machine  <canvas id='$Machine' width=200 height=20 style='border:1px solid #d3d3d3;'>Your browswer doesn't support canvas.</canvas></br>"
        }
        $ScriptBlock+="</p>"
        return $ScriptBlock
    }
    $MachineList=[array]($MachineStatusList.Keys)
    $CanvasConstructor=CreateCanvas -MachineList $MachineList
    $MainFunction="
    $CanvasConstructor
    <script>

        function ProgressBar(canavasid,Status,TimeValue,CurrentExecution){
	var c = document.getElementById(canavasid);
	var ctx = c.getContext('2d');
	var iProgress=100;
    var StatusShow='';
	if(CurrentExecution==null)
	{
		CurrentExecution='';
	}
	else
	{
		CurrentExecution=':'+CurrentExecution;
	}
	if(Status=='InstallWithSync' || Status=='InstallOnly' ){
		iProgress=5;
        StatusShow='Media Detect';
	}
	else if(Status=='InstallWithSync_0'||Status=='InstallOnly_0')
	{
		iProgress=10;
        StatusShow='Uninstall Preparation';
	}
	else if(Status=='Uninstall_P4Sync_0'||Status=='Uninstall_0' )
	{
		iProgress=15;
        StatusShow='Uninstallation';
	}
	else if(Status=='InstallMedia_P4Sync_1'||Status=='InstallOnly_1' )
	{
		iProgress=20;
        StatusShow='Installation';
	}
	else if(Status=='Product_Preparation')
	{
		iProgress=45;
        StatusShow='Execution Preparation';
	}
	else if(Status=='Prepared_Run')
	{
		iProgress=50;
        StatusShow='Execution Preparation';
	}		
	else if(Status=='Resume')
	{
		iProgress=50+$($Progress)*50;
        StatusShow='Executing'+CurrentExecution;
	}
	else if(Status=='Idle')
	{
		iProgress=100;
        StatusShow='Idle';
	}	
	else if(Status=='Stuck')
	{
		iProgress=110;
        StatusShow='ERROR'+CurrentExecution;
	}
    ctx.clearRect(0,0,200,30);
	ctx.globalAlpha=1;
	ctx.font = '17px Arial';
	ctx.fillStyle= 'black';
    ctx.fillText(StatusShow,iProgress*0.07,16);
	ctx.globalAlpha=0.5;
	
	AnimationScale=(TimeValue%100)/100*iProgress/100;
	
	if(iProgress<=100)
	{
		// Create gradient
		var grd = ctx.createLinearGradient(0,0,200,0);
		grd.addColorStop(0,'blue');
		grd.addColorStop(AnimationScale,'white');
		grd.addColorStop(1,'blue');
                
	}
	else
	{
		var grd = ctx.createLinearGradient(0,0,200,0);
		grd.addColorStop(0,'red');		
		grd.addColorStop(1,'red');
	}
		// Fill with gradient
		ctx.fillStyle = grd;
		ctx.fillRect(0,0,iProgress/100*200,100);


	
}

var TimeValue=0;
    "
    foreach($Machine in $MachineList)
    {
        $MainFunction+="setInterval(function(){TimeValue=TimeValue+0.08;ProgressBar('$Machine','$($MachineStatusList[$Machine])',TimeValue,'$($ClientExecutionHashTable[$Machine])');},5);"
    }
    $MainFunction+="</script>"
    return $MainFunction
}

Function Output-Result($lsRecord,$sResultFolder,$sServerDirectory)
{
    $lsRecord|Export-Csv -Path (Join-Path -Path $sResultFolder -ChildPath "Progress.csv")
    if(Test-Path -Path (Join-Path -Path $sServerDirectory -ChildPath "Progress.csv"))
    {        
        do
        {
            Remove-Item -Path (Join-Path -Path $sServerDirectory -ChildPath "Progress.csv") -Force    
            Start-Sleep -Seconds 5
        }
        while ((Test-Path -Path (Join-Path -Path $sServerDirectory -ChildPath "Progress.csv")) -eq $true)
    }
    
    $lsRecord|Export-Csv -Path (Join-Path -Path $sServerDirectory -ChildPath "Progress.csv")
}



Function GetVariable([string]$Variable)
{
    [string]$V=""
    [array]$list=@(@())
    
    for($i=$Variable.IndexOf("$");$i -lt $Variable.Length;$i++)
    {
        #debug purpose only
        if($list.Length -eq 2)
        {
            Write-Host
        }
        
        
        $Char=$Variable[$i]
        $ascii=[int][char]$Char
        if($Char -eq "$")
        {
            $bIsVariable=$true
            continue
        }
        if($bIsVariable)
        {
            if($ascii -ge 97 -and $ascii -le 122)
            {
                $V+=$Char
            }
            elseif($ascii -ge 65 -and $ascii -le 90)
            {
                $V+=$Char
            }
            elseif($ascii -ge 48 -and $ascii -le 57)
            {
                $V+=$Char
            }
            elseif($Char -eq "_")
            {
                $V+=$Char
            }
            else
            {
                $list+=,@("$"+$V)
                $V=""
                $bIsVariable=$false
            }
            
        }

    }
    $list+=,@("$"+$V)
    return $list
}

Function VariableListForScriptBlock($ScriptFolder="C:\temp\datain.txt")
{
    $lsResult
    $Block=Get-Content -Path $ScriptFolder
    foreach($line in $Block)
    {
        if($line -match "$")
        {
            $VariablesList=$line.Split(" ")
            foreach($Variable in $VariablesList)
            {
                if($Variable.IndexOf("$") -ne -1)
                {
                    $Entry=$Variable.Substring($Variable.IndexOf("$"))
                    $lsResult+=GetVariable -Variable $Entry
                }
            }
        }
    }
    return ($lsResult|Sort-Object -Unique)
}

Function Wait-TCPConnection([int]$Port=8848)
{
    [gc]::Collect()
    Write-Host -Object "$((Get-Date).ToString()) Open port $Port and wait for remote connection . Please Wait...." -ForegroundColor Yellow
    if($listener -ne $null)
    {
        $listener.Stop()
    }
    
    $endpoint=New-Object System.Net.IPEndPoint ([System.Net.IPAddress]::Any,$port)
    $listener=New-Object System.Net.Sockets.TcpListener $endpoint
    $listener.Start()
    return $listener.AcceptTcpClientAsync()
    
}
Function Log-Server([string] $sServerLog,[ConsoleColor] $Color=[ConsoleColor]::White)
{
    $sServerLogPath=Join-Path -Path $sParentFolder -ChildPath ServerLog.csv
    if((Test-Path $sServerLogPath) -eq $false)
    {
        "Time	Execution Batch	Info"|Out-File -FilePath $sServerLogPath
    }

    Write-Host -Object $sServerLog -ForegroundColor ($Color)
    "$((Get-Date).ToString())	$($Execution_Batch)	$($sServerLog)"|Out-File -FilePath $sServerLogPath -Append

}
Function Wait-VMBacktoLife([string]$VMName,[int]$TimeOut=600,[int]$port=8848)
{
    #Wait until the VM back to life
    
    $iTime=0
    #Use-Ping Method
    
    Log-Server -sServerLog "Ping Check Start"
    
    while($iTime -lt $TimeOut)
    {
        $ping=[string](Get-IPAddress -MachineName $VMName -VerifyReachable)
        if($ping -match "Fail to Find IP Address")
        {
            Start-Sleep -Seconds 1
            $iTime++
        }
        else
        {
            break
        }

    }
    Log-Server -sServerLog "Ping Check Finish and start TCP proxy check"
    #Look for explorer.exe
    if($iTime -gt $TimeOut)
    {
        Log-Server -sServerLog "[Error]VM fail to start within $TimeOut s"
        return $false
    }
    while($iTime -lt $TimeOut)
    {
        try
        {
            $Client=New-object System.Net.Sockets.TcpClient $VMName,$port
            Log-Server -sServerLog "TCP Check finish and remote machine boot up successfully"
            break

        }
        catch
        {
            Start-Sleep -Seconds 5
            $Error.Clear()
        }

        
        $iTime=$iTime+5
    }

    return $true
}

Function New-VMObj($ServerDomain,$VMName,$VMObj)
{
    $obj=New-Object PSObject
    $Obj|Add-Member -MemberType NoteProperty -Name "ServerDomain" -Value $ServerDomain
    $obj|Add-Member -MemberType NoteProperty -Name "VMName" -Value $VMName
    
    $obj|Add-Member -MemberType NoteProperty -Name "VMObj" -Value $VMObj
    return $obj
}
Function New-VMServerObj($ServerName,$ServerIP=$null,$ServerObj)
{
    $obj=New-Object PSObject
    $obj|Add-Member -MemberType NoteProperty -Name "ServerName" -Value $ServerName
    if($ServerIP -eq $null)
    {
        $ServerIP=(Get-IPAddress -MachineName $ServerName)
    }
    $obj|Add-Member -MemberType NoteProperty -Name "ServerIP" -Value $ServerIP
    $obj|Add-Member -MemberType NoteProperty -Name "ServerObj" -Value $ServerObj
    return $obj
}


Function Get-VMClientInfo([string]$Username="corp\wuwei",[string]$Password="Changethis7",[string]$Server="scvmm2012hq",$PORT="8100",[string]$UserRoleName="Administrator",[string]$VMName="",[switch]$bRetry)
{
    $VMServer=$Server
    $VMClientList=Get-VMServerInfo -Username $Username -Password $Password -Server $Server -PORT $PORT -UserRoleName $UserRoleName -VMServer $VMServer
    

    if($VMName -eq "")
    {
        Write-Error -Message "Please enter VM name info before go forward"
        return
    }

    if($VMServer -ne "")
    {
        $iServerIPAddress=Get-IPAddress -MachineName $VMServer
    }
    else
    {
        $iServerIPAddress=""
    }

    #do search based on vm name alone
    $lsTargetRough=[array]($Global:VMClientList|where{$_.VMName -match $VMName})
    if($lsTargetRough.Count -eq 0)
    {
        #try to remove .dev.aspentech.com or .corp.aspentech.com
        $lsTargetRough=[array]($Global:VMClientList|where{$_.VMName -match $VMName.replace(".dev.aspentech.com","").replace(".corp.aspentech.com","")})
    }
    $target=$lsTargetRough[0]

    #add one more criteria, which is server info.
    $lsTargetDetail=[array]($lsTargetRough|where{$_.ServerDomain.ServerIP -match $iServerIPAddress})
    
    #If rough search came back with 0, then it is error return
    if($lsTargetRough.Count -eq 0)
    {
        Write-Host -Object "No Value is found"
        return
    }
    
    if($lsTargetDetail.Count -ne 0)
    {
        #if detailed search came back with result, then change target info
        $target=$lsTargetDetail[0]
    }
    
    return $target
    

}

Function Get-VMServerInfo([string]$Username="corp\wuwei",[string]$Password="Changethis7",[string]$Server="scvmm2012hq",$PORT="8100",[string]$UserRoleName="Administrator",[string]$VMServer=$null)
{
    $PASS =ConvertTo-SecureString $Password -AsPlainText -Force
    $Cred = new-object -typename System.Management.Automation.PSCredential -argumentlist $Username,$PASS
    
    $CurrentVMLibrary=@("scvmm2012hq","scvmm2012r2hq")
    $UserRoleNameLibrary=@("Administrator","HQ_Dev_Users","Quality_Generic","HOU_Dev_Users","SH_Dev_Users")
    if($UserRoleNameLibrary)
    {
        if($UserRoleName -ne "" -and $UserRoleName -ne "" -and !$UserRoleNameLibrary.Contains($UserRoleName))
        {
            $UserRoleNameLibrary+=$UserRoleName
        }
    }
    
    if($VMServer -ne "" -and $VMServer -ne $null -and !$CurrentVMLibrary.Contains($VMServer))
    {
        $CurrentVMLibrary+=@($VMServer)
    }
    $VMServerObjList=@()
    foreach($item in $CurrentVMLibrary)
    {
        $VMServerObj=New-VMServerObj -ServerName $item
        #add new server obj in only if we cannot find ip address in the existing list
        if($VMServerObjList.Count -eq 0 -or !([array]$VMServerObjList.ServerIP).Contains($VMServerObj.ServerIP))
        {
            foreach($role in $UserRoleNameLibrary)
            {
                try
                {
                    $ServerItem=Get-SCVMMServer -ComputerName $VMServerObj.ServerIP -TCPPort $PORT -Credential $Cred -UserRoleName $role
                    $VMServerObj.ServerObj=$ServerItem
                    break
                }
                catch
                {
                    $Error.Clear()
                }
                
            }
            
            $VMServerObjList+=@($VMServerObj)
        }
        
        
    }
    $Global:VMClientList=@()
    foreach($item in $VMServerObjList)
    {
        $VMList=[array](Get-SCVirtualMachine -VMMServer $item.ServerObj)
        foreach($vm in $VMList)
        {
            $VMObj=New-VMObj -ServerDomain $item -VMName $vm.Name -VMObj $vm
            $Global:VMClientList+=@($VMObj)
        }
    }
    
    return $VMServerObjList
}
Function Revert-Checkpoint([string]$Username="corp\wuwei",[string]$Password="Changethis7",[string]$Server="scvmm2012hq",$PORT="8100",$VMName="NHQA-W81-Q34",[string]$Checkpoint="ART_BASE",[string]$MemorySize="4096",[string]$ClientUserName,[string]$ClientPassword,[string]$UserRoleName="Administrator")
{
    $PASS =ConvertTo-SecureString $Password -AsPlainText -Force
    $Cred = new-object -typename System.Management.Automation.PSCredential -argumentlist $Username,$PASS
    $bHyperV=$false
    $VMServer=$null
    $VM=$null
    $VM=(Hyper-V\Get-VM -Name $VMName)
    if($VM -ne $null)
    {
        Write-Host -Object "HyperV Access is detected"
        $bHyperV=$true
    }
    else
    {
        $VMServer=Get-SCVMMServer -ComputerName $Server -TCPPort $PORT -Credential $Cred -UserRoleName $UserRoleName
    }
    
    if($VMServer -eq $null -and $bHyperV -eq $false)
    {
        while($true)
        {

            
            cls
            Write-Error -Message "Fail to connect to VM Server $Server at Port $PORT with UserRoleName $UserRoleName check your credential/Server/Port!"
            Start-Sleep -Seconds 60
        }
    }
    if($bHyperV)
    {
        $ARTCheckPoint=[array](Hyper-V\Get-VMSnapshot -VMName $VMName|where{$_.Name -eq $Checkpoint})
    }
    else
    {
        $VMStatus="HostNotResponding"
        while($VMStatus -eq "HostNotResponding")
        {

            $VM=$null
            try
            {
                $VM=Get-VM -VMMServer $VMServer -Name $VMName
            }
            catch
            {
                $Error.Clear()
            }
            if($VM -eq $null)
            {
                $VMObj=Get-VMClientInfo -Username $Username -Password $Password -Server $Server -PORT $PORT -UserRoleName $UserRoleName -VMName $VMName 
                $VM=$VMObj.VMObj
                $VMServer=$VMObj.ServerDomain.ServerObj
            }
            Read-SCVirtualMachine -VM $VM
            $VMStatus=$VM.Status
            Start-Sleep -Seconds 1
                       
            Write-Host -Object "VM host is not reponsding...wait until its status change"
        }
        $ARTCheckPoint=$null
        $ARTCheckPoint=[array](Get-VMCheckpoint -VM $VM|where{$_.Name -eq $Checkpoint})

        if($ARTCheckPoint -eq $null)
        {
            $Error.Clear()
            $ARTCheckPoint=[array](Get-VMCheckpoint -VM $VM -VMMServer $VMServer|where{$_.Name -match $Checkpoint})
        }
        
    }
    
    if($ARTCheckPoint.Length -eq 0)
    {
        Log-Server -sServerLog "Cannot find the desired check point"
        while($true)
        {
            cls
            Write-Error -Message "Fail to Find Checkpoint $ARTCheckPoint in Server $Server at Port $PORT with UserRoleName $UserRoleName check your checkpoint name!"
            Start-Sleep -Seconds 60
        }
    }
    else
    {
        if($bHyperV)
        {
            $restoreJob=Hyper-V\Restore-VMSnapshot -VMName $VMName -Name $Checkpoint -AsJob
            while($restoreJob.State -ne "Completed")
            {
                Start-Sleep -Seconds 1
            }
            
            Hyper-V\Stop-VM -Force -Name $VMName
            Hyper-V\Set-VM -Name $VMName -StaticMemory -MemoryStartupBytes ([int]($MemorySize)*1024*1024).ToString()
        }
        else
        {
            
            Stop-VM -VM $VM        
            Read-SCVirtualMachine -VM $VM
            Restore-VMCheckpoint -VMCheckpoint $ARTCheckPoint[0]
            #If VM fail to revert, then repiar it
            if($VM.Status.ToString() -match "CheckpointFailed")
            {
                Read-SCVirtualMachine -VM $VM
                Repair-SCVirtualMachine -VM $VM -Dismiss -Force
                Restore-VMCheckpoint -VMCheckpoint $ARTCheckPoint[0]
            }
            Stop-VM -VM $VM
            Set-VM -VM $VM -MemoryMB $MemorySize -DynamicMemoryEnabled $false
        }
        
        

    }
    if($vm.Status -ne "Running")
    {
        if($bHyperV)
        {
            Hyper-V\Start-VM -Name $VMName
        }
        else
        {
            Start-VM -VM $VM
        }
        
    }
    Wait-VMBacktoLife -VMName $VMName -TimeOut 300
   
   #give vm enough time to fix the trust relationship
    if((Wait-VMBacktoLife -VMName $VMName -TimeOut 360) -eq $false)
    {
        Stop-VM -VM $VM
        Start-VM -VM $VM
    }
}

Function Create-SnapshotwithNLatest([string]$Username="corp\wuwei",[string]$Password="Changethis7",[string]$Server="scvmm2012hq",$PORT="8100",$VMName="NHQA-W81-Q33",$NumberCheckpointRemain=3,[string]$CheckpointName,[string]$MinMemorySize,[string]$MemoryType="dynamic",[string]$ClientUserName,[string]$ClientPASS)
{
    $PASS =ConvertTo-SecureString $Password -AsPlainText -Force
    $Cred = new-object -typename System.Management.Automation.PSCredential -argumentlist $Username,$PASS
    
    $VMObj=Get-VMClientInfo -Username $Username -Password $Password -Server $Server -PORT $PORT -UserRoleName $UserRoleName -VMName $VMName 
    #$VM=$VMObj.VMObj
    #$VMServer=$VMObj.ServerDomain.ServerObj
        
    #$VMServer=Get-SCVMMServer -ComputerName $Server -TCPPort $PORT -Credential $Cred -UserRoleName Administrator

    #$VM=Get-VM -VMMServer $VMServer -Name $VMName
    if($VMObj.VMObj.UserRole.Name -match "Delegated" -or $VMObj.VMObj.UserRole.UserRolePath -match "Admin")
    {
        $sUserRole="Administrator"
    }
    else
    {
        $sUserRole=$VMObj.VMObj.UserRole.Name
    }
    $VMServer=Get-SCVMMServer -ComputerName $VMObj.ServerDomain.ServerIP -TCPPort $PORT -Credential $Cred -UserRoleName $sUserRole
    $VM=Get-VM -VMMServer $VMServer -Name $VMName

    Stop-VM -VM $VM
    Start-Sleep -Seconds 5
    New-VMCheckpoint -Name ("ART_"+$CheckpointName) -VM $VM
    $ARTCheckPoint=[array](Get-VMCheckpoint -VM $VM|where{$_.Name -match "ART" -and $_.Name -ne "ART_BASE"}|Sort-Object -Property AddedTime -Descending)
    
    while($ARTCheckPoint.Length -gt $NumberCheckpointRemain)    
    {
        #Remove the check point until the checkpoint number is less than number checkpoint we want to remain
        $ARTCheckPoint=[array](Get-VMCheckpoint -VM $VM|where{$_.Name -match "ART" -and $_.Name -ne "ART_BASE"}|Sort-Object -Property AddedTime -Descending)
        try
        {Remove-VMCheckpoint -VMCheckpoint $ARTCheckPoint[$NumberCheckpointRemain]}
        catch
        {}
        
    }
    if($MemoryType.ToLower() -eq "dynamic")
    {
        Set-VM -VM $VM -DynamicMemoryEnabled $true -DynamicMemoryMinimumMB $MinMemorySize
    }
    elseif($MemoryType.ToLower() -eq "static")
    {
        Set-VM -VM $VM -DynamicMemoryEnabled $false -MemoryMB $MinMemorySize
    }    
    Start-VM -VM $VM   
    
    Wait-VMBacktoLife -VMName $VMName -TimeOut 360 -ClientUserName $ClientUserName -ClientPass $ClientPASS

}


Function Get-IPAddress([string]$MachineName,[switch]$Verifiy,[switch]$VerifyReachable)
{
    $IP=""
    $lsRecord=Invoke-Expression -Command "ping $MachineName -4 -n 1"
    #try default machine name
    foreach($sRecord in $lsRecord)
    {
        if ($sRecord -match "Reply from ")
        {
            if($VerifyReachable.IsPresent)
            {
                if($sRecord -match "Destination host unreachable")
                {
                    continue
                }                
            }
            $IP=$sRecord.Split(":")[0].Replace("Reply from ","")



            break
        }
    }

    #if default machine name didn't work, then add the dev domain
    if($Verifiy.IsPresent -eq $false -and $IP -ne "")
    {
        $Verify=Get-IPAddress -MachineName $IP -Verifiy
        if($Verify -ne $IP)
        {
            $IP="Fail to Find IP Address"            
        }
    }

    if($IP -match "Fail to Find IP Address" -or $IP -eq "" -and $Verifiy.IsPresent -eq $false)
    {
        if($MachineName -notmatch ".dev.aspentech.com" -and $Verifiy.IsPresent -eq $false)
        {
            $IP=Get-IPAddress -MachineName ($MachineName+".dev.aspentech.com")
        }
        else
        {
            Write-Error -Message "Fail to Find IP Address for $MachineName"
            $IP="Fail to Find IP Address"            
        }
    }
    


    return $IP




}

Function Make-RemotePSSession([string]$RemoteServerName,[string]$Username,[string]$Password)
{
    $ND_Pass=$Password
    $ND_User=$Username
    
    $ART_Server=$RemoteServerName
    #Enable Server Connection
    Set-Item WSMan:\localhost\Client\TrustedHosts $ART_Server -Force
    #Get Ps-session from the server, if there is not or it is not available, then close the ps-session
    $ClientPass =ConvertTo-SecureString $ND_Pass -AsPlainText -Force
    $ClientCred = new-object -typename System.Management.Automation.PSCredential -argumentlist $ND_User,$ClientPass
    $PS=Get-PSSession -ComputerName $ART_Server -Credential $ClientCred -Authentication Negotiate|where{$_.Name -eq $env:COMPUTERNAME}
    if($PS -eq $null)
    {
       $PS=New-PSSession -ComputerName $ART_Server -Credential $ClientCred -Authentication Negotiate -Name $env:COMPUTERNAME
    }
    elseif($PS.Availability -ne "Available")
    {
    
        $PS|Remove-PSSession
        Start-Sleep -Seconds 10
        $PS=New-PSSession -ComputerName $ART_Server -Credential $ClientCred -Authentication Negotiate -Name $env:COMPUTERNAME
    
    }

    return $PS
}



Function Get-DOSFriendlySpaceCommand([string]$sScriptFolder)
{
    if($sScriptFolder -match " ")
    {
        $List=$sScriptFolder.Split("`\")
    }
    $sScriptFolder=""
    foreach($Part in $List)
    {
        if($Part -notmatch ":")
        {
            $sScriptFolder+="'"+$Part+"'\"
        }
        else
        {
            $sScriptFolder+=$Part+"\"
        }
    }

    return $sScriptFolder
}

Function Get-ScriptFolder([string]$sProjectFolder)
{
    $sScriptFolder=Join-Path -Path $sProjectFolder -ChildPath "script"
    #$sScriptObject=Get-ChildItem -Path $sProjectFolder -Recurse|Where-Object {$_ -like "*.t" -or $_ -like "*.cs"}


    
    return $sScriptFolder
}

Function Get-ScriptFileList([array]$sProjectFolders)
{
    $lsProjectScript=@();
    foreach($Support in $sProjectFolders)
    {
        if($Support -eq $null)
        {
            continue
        }
        else
        {
            $lsProjectScript+=Get-ChildItem -Path $Support -Recurse        
        }
        
    }
    #$lsProjectScript=$lsProjectScript|Where{$_.fullname -like "*.t" -or $_.fullname -like "*.cs"}
    $lsProjectScript=$lsProjectScript|Where{$_.fullname -like "*.t"}

    return $lsProjectScript
}

Function Get-CQList([array]$lsProjectScript)
{
    #Generate a list of CQ we have in each script
    
    $lsScriptCQ=@(@())
    $iProjectScriptIndex=-1
    
    #$sScriptFolder=Get-ScriptFolder -sProjectFolder $sProjectFolder
        
    #[array]$lsProjectScript=Get-ScriptFileList -sProjectFolders $sProjectFolders

    foreach($sProjectScriptObject in $lsProjectScript)
    {
        $sProjectScript=$sProjectScriptObject.Name
        $iProjectScriptIndex++
        $lsScriptCQ+=,@()



        $lsTemp=Get-Content -Path ($sProjectScriptObject.FullName)


        #Do a search if it is in .t format
        if($sProjectScriptObject.FullName -like "*.t")
        {
            $iRecordIndex=-1
            foreach($sTemp in $lsTemp)
            {
                if($sTemp.Contains("// testcase"))
                {
                    continue
                }
                else
                {
                    if ($sTemp.Contains("appstate") -and $sTemp.Contains("testcase") -and $sTemp.Contains("()"))
                    {
                        $iRecordIndex++
                        $lsScriptCQ[$iProjectScriptIndex]+=,@()
                        try
                        {
                            $lsScriptCQ[$iProjectScriptIndex][$iRecordIndex]=$sTemp.Substring($sTemp.IndexOf("testcase")+9,$sTemp.IndexOf(" appstate")-$sTemp.IndexOf("testcase")-11)                    
                        }
                        catch
                        {
                            $lsScriptCQ[$iProjectScriptIndex][$iRecordIndex]=$sTemp.Substring($sTemp.IndexOf("testcase")+9,$sTemp.IndexOf("appstate")-$sTemp.IndexOf("testcase")-11)                    
                        }

                    
                    }
                }
            }
        }
        elseif($sProjectScriptObject.FullName -like "*.cs")
        {
            $bTestMethod=$false
            $iRecordIndex=-1
            foreach($sTemp in $lsTemp)
            {
                #TestMethod is a signal of testcase start
                if($sTemp.Contains("[") -and $sTemp.Contains("TestMethod") -and $sTemp.Contains("]"))
                {
                    $bTestMethod=$true
                }

                #If we have TestMethod, then start to look for public void *()
                if($bTestMethod)
                {
                    if ($sTemp -like "*public void *()*")
                    {
                        $iRecordIndex++
                        $lsScriptCQ[$iProjectScriptIndex]+=,@()
                        $lsScriptCQ[$iProjectScriptIndex][$iRecordIndex]=$sTemp.Substring($sTemp.IndexOf("public void ")+12,$sTemp.IndexOf("()")-$sTemp.IndexOf("public void ")-12)
                        if($lsScriptCQ -eq "ModelLibrary")
                        {
                            Write-Host;
                        }
                        $bTestMethod=$false
                    }
                }
            }
        }
        
    }    
    
    
    return $lsScriptCQ
}

Function Get-CQFromScript([string]$sProjectFolder,[string]$ExpectedScript="",[string]$sCQ,[array]$lsProjectScript=$null,[array]$lsScriptCQ=$null)
{
    #Validate whether the Script field from Query existed or not. If not, it will try to find out where is the testcases
        
        $bCQScriptFind=$false
        $bAllScriptFind=$false
        
        $Find_In_Script=""
        $Sub_TestCase=""
        
        
        
        if($lsProjectScript.Count -eq 0)
        {
            $lsProjectScript=[array](Get-ScriptFileList -sProjectFolders @($sProjectFolder))
        }
        
        if($lsScriptCQ.Count -eq 0)
        {
            $lsScriptCQ=[array](Get-CQList -lsProjectScript $lsProjectScript)
        }
        
        
        #Try to find it in the specified file. Note!!! No matter what kind of change here, you need to change in the rest of files part
        for($iProjectScript=0;$iProjectScript -lt $lsProjectScript.Length;$iProjectScript++)
        {
            if ($lsProjectScript[$iProjectScript] -eq $ExpectedScript)
            {
                foreach ($sScriptCQ in $lsScriptCQ[$iProjectScript])
                {
               
                    if ($sScriptCQ.ToUpper().replace(" ","") -eq $sCQ.ToUpper())
                    {
                        if($sScriptCQ.Contains("("))
                        {
                            continue
                        }

                        $Find_In_Script=$lsProjectScript[$iProjectScript]                        
                        $Sub_TestCase+=","+$sScriptCQ
                        $bCQScriptFind=$true
                    }
                }
                if($bCQScriptFind -eq $false)
                {
                    foreach ($sScriptCQ in $lsScriptCQ[$iProjectScript])
                    {
                                            
                        if ($sScriptCQ.replace(" ","").ToUpper() -match ($sCQ.ToUpper().Replace("CQ","") -as [int]).ToString())
                        {
                            if($sScriptCQ.Contains("("))
                            {
                                continue
                            }
                        $Find_In_Script=$lsProjectScript[$iProjectScript]                        
                        $Sub_TestCase+=","+$sScriptCQ
                        $bCQScriptFind=$true                   
                        }
                    }
                }
                break
            }         
        }
        
        #Find it in the rest of the filesNote!!! No matter what kind of change here, you need to change in the specified files part
        if($bCQScriptFind -eq $false)
        {       
            for($iProjectScript=0;$iProjectScript -lt $lsProjectScript.Length;$iProjectScript++)
            {
                if ($lsProjectScript[$iProjectScript] -ne $ExpectedScript)
                {

                    foreach ($sScriptCQ in $lsScriptCQ[$iProjectScript])
                    {
                        #Write-Output($sScriptCQ,$lsRecord[$iRecordIndex].id)
                        if ($sScriptCQ.replace(" ","").ToUpper() -eq $sCQ.ToUpper())
                        {
                            if($sScriptCQ.Contains("("))
                            {
                                continue
                            }
                            $Find_In_Script=$lsProjectScript[$iProjectScript]                        
                            $Sub_TestCase+=","+$sScriptCQ
                            $bAllScriptFind=$true
                            
                        }

                    }
                    if($bAllScriptFind -eq $false)
                    {
                        foreach ($sScriptCQ in $lsScriptCQ[$iProjectScript])
                        {
                            #Write-Output($sScriptCQ,$lsRecord[$iRecordIndex].id)
                            if ($sScriptCQ.ToUpper() -match ($sCQ.ToUpper().Replace("CQ","") -as [int]).ToString())
                            {
                                if($sScriptCQ.Contains("("))
                                {
                                    continue
                                }
                                $Find_In_Script=$lsProjectScript[$iProjectScript]                        
                                $Sub_TestCase+=","+$sScriptCQ
                                $bAllScriptFind=$true
                            
                            }

                        }
                    }
                }
                if ($bAllScriptFind -eq $true){break}                      
            }
            ($bAllScriptFind -or $bCQScriptFind)
            $Find_In_Script.fullname
            $Sub_TestCase
        }
        else
        {
            $true
            $Find_In_Script.fullname
            $Sub_TestCase
        }
        
    
}


Function Query-Database
{
    Param(
    [Parameter(
    Mandatory = $true,
    ParameterSetName = '',
    ValueFromPipeline = $true)]
    [string]$Query,
    [string]$MySQLAdminUserName = 'root',
    [string]$MySQLAdminPassword = '19901113',
    [string]$MySQLDatabase = 'mydb',
    [string]$MySQLHost = '127.0.0.1'
    )


    $ConnectionString = "server=" + $MySQLHost + ";port=3306;uid=" + $MySQLAdminUserName + ";pwd=" + $MySQLAdminPassword + ";database="+$MySQLDatabase
    $Error.Clear()
    Try {
      [void][System.Reflection.Assembly]::LoadWithPartialName("MySql.Data")
      $Connection = New-Object MySql.Data.MySqlClient.MySqlConnection
      $Connection.ConnectionString = $ConnectionString
      $Connection.Open()

      $Command = New-Object MySql.Data.MySqlClient.MySqlCommand($Query, $Connection)
      $DataAdapter = New-Object MySql.Data.MySqlClient.MySqlDataAdapter($Command)
      $DataSet = New-Object System.Data.DataSet
      $RecordCount = $dataAdapter.Fill($dataSet, "data")
      $DataSet.Tables[0]
      }

    Catch {
      "ERROR : Unable to run query : $query `n$($Error[0].ToString())"
     }

    Finally {
      $Connection.Close()
      }
}

Function Split-NetPath([string]$NetPath,[string]$Type="root")
{
    $NetPath=$NetPath.Replace("`\`\","c:\")
    $iMaxTrial=20
    $iRetry=0
    $Current=$NetPath
    if($Type.ToLower() -eq "root")
    {        
        while($Current -ne "c:\" -and $iRetry -lt $iMaxTrial)
        {
            $iRetry++
            $Previous=$Current
            try
            {
                $Current=Split-Path -Path $Current -Parent
            }
            catch
            {
                $Current=$null
                break
            }
            
        
        }

    }
    elseif($Type.ToLower() -eq "leaf")
    {  
        $Previous=$Current
        $Current=Split-Path -Path $Current -Parent
    }
    $NetPath=$Previous.Replace("c:\","`\`\")
    return $NetPath

}

Function Map-NetDrive([string]$LocalDriver,[string]$RemoteDirectory,[string]$Username="corp\qapart",[string]$Password="QQQaaa000")
{
    
    $LocalDriver=$LocalDriver.Replace(":","")
    $sServerDirectory=$RemoteDirectory
    $ND_User=$Username
    $ND_Pass=$Password|ConvertTo-SecureString -AsPlainText -Force
    $myCred=New-Object -TypeName System.Management.Automation.PSCredential -argument $Username,$ND_Pass
    
    $Error.Clear()
    for($i=0;$i -lt 10;$i++)
    {
        
        if(Test-Path -Path ($LocalDriver+":"))
        {
            Remove-PSDrive -Name $LocalDriver
        }
        
        (&net use * /delete /yes)|Out-Host                            
        
        New-PSDrive -Name $LocalDriver -PSProvider FileSystem -Root $RemoteDirectory -Credential $myCred
        if(Test-Path -Path ($LocalDriver+":"))
        {   
            return
        }


    }
}


Function AutoUpdate([string]$sProduct,[switch]$CQUpdate,[string]$ResultInput="",[string]$Execution_Batch="")
{
    
    #This funciton is used to update the execution result based on specific execution batch
    #some times, we might do same batch with 2 different media. This method is capable of doing so
    $sSetting=Join-Path -Path $sParentFolder -ChildPath "CenterControl.ini"
    $CQ_Update_Server=Load-ValueFromSetting -SettingPath $sSetting -Value "CQ_Update_Server"
    $Version=Load-ValueFromSetting -SettingPath $sSetting -Value ($sProduct+"_Version")
    if($Version -notmatch "V")
    {
        $Version="V"+$Version

    }
    if($Version -eq "V9")
    {
        $Version="V9.0"
    }
    $Media=Load-ValueFromSetting -SettingPath $sSetting -Value ($sProduct+"_Media")
    if($Execution_Batch -eq "")
    {
        $Execution_Batch=Load-ValueFromSetting -SettingPath $sSetting -Value ($sProduct+"_Execution_Batch")
    }
    
    if($ResultInput -eq "")
    {
        $ResultInput=Load-ValueFromSetting -SettingPath $sSetting -Value ($sProduct+"_Server_Directory")
        $ResultInput=Join-Path -Path $ResultInput -ChildPath "MasterExecutionResult.csv"
    }
    
    
    $ResultFolder=Split-Path -Path $ResultInput -Parent
    $lsRecord=Import-Csv -Path $ResultInput|where{$_.Execution_Batch -eq $Execution_Batch}
    $lsFailure=$lsRecord|Where-Object{$_.Result -ne "PASS"}
    $lsPass=$lsRecord|where{$_.Result -eq "PASS"}

    $lsBuild=[array]($lsRecord.Media|select -Unique)
    $BuildPasshash=@{}
    
    $iTotalPassCount=0
    foreach($sBuild in $lsBuild)
    {
        $lsPassed=($lsRecord|Where-Object{$_.Media -eq $sBuild}).id|select -Unique
        $lsTruePassed=@()
        foreach($sPassed in $lsPassed)
        {
            $bAllPass=$true

            $lsRecord|where{$_.id -eq $sPassed}|foreach{if($_.Result -ne "PASS"){$bAllPass=$false;}}


            if($bAllPass)
            {
                $lsTruePassed+=@($sPassed)
                $iTotalPassCount+=[int](($lsRecord|where{$_.id -eq $sPassed})[0].SubTest_Count_bak)
            }
        }
        
        $BuildPasshash.Add($sBuild,[array]($lsTruePassed))
    }
    
    Remove-Item -Path (Join-Path -Path $ResultFolder -ChildPath ARTExecutionOutput*.txt) -Force
    Remove-Item -Path (Join-Path -Path $ResultFolder -ChildPath ARTExecutionOutput*.loginfo) -Force
    
    $iPass=0
    foreach($Key in $BuildPasshash.Keys)
    {
        $iPass+=$BuildPasshash[$Key].Count
        $lsPassed=$BuildPasshash[$Key]
        $lsOutput=@()
        foreach($sPassed in $lsPassed)
        {
            $lsOutput+=@("Testcase $sPassed()")
            $lsOutput+=@("Machine: (local)")
            $lsOutput+=@("Started: 04:28:24PM on 15-Mar-2014")
            $lsOutput+=@("Elapsed: 0:04:39")
            $lsOutput+=@("Totals:  0 errors, 0 warnings")
            $lsOutput+=@("Out Folder: C:\p4_hqperforce21666_W8X64-BLANK\qe\dev\AUTOMATION\HYSYS\V8.6\AspenHysys\data\dataout\CQ00220113 ")
            $lsOutput+=@("")
        }
        $lsOutput|Out-File -FilePath (Join-Path -Path $ResultFolder -ChildPath "ARTExecutionOutput$Key.txt")
        
        $lsOutput1=@("Submitter_Email: weiwei.wu@aspentech.com")
        $lsOutput1+=@("Version: $Version")
        $lsOutput1+=@("Build: $Key")
        $lsOutput1+=@("Server_OS: Windows 10 - 64bit")
        $lsOutput1+=@("Server_Config: Hyper-V Server")
        $lsOutput1+=@("Client_OS: Windows 10 - 64bit")
        $lsOutput1+=@("Client_Config: Virtual Machine")
        $lsOutput1+=@("Virtual_Environment: Hyper-V")
        $lsOutput1+=@("Tester: WeiWei_Wu")
        $lsOutput1|Out-File -FilePath (Join-Path -Path $ResultFolder -ChildPath "ARTExecutionOutput$Key.loginfo")
    }

    Write-Host -Object ("Total Passed Case #= $iPass count=$($iTotalPassCount)") -ForegroundColor Green
    if($CQUpdate.IsPresent)
    {
        Write-Host -Object "Start to update the reslut to CQ Server $CQ_Update_Server"
        foreach($Key in $BuildPasshash.Keys)
        {
            Copy-Item -Path (Join-Path -Path $ResultFolder -ChildPath "ARTExecutionOutput$Key.*") -Destination $CQ_Update_Server -Force -Verbose
        }
    }
}

Function unzip(){
    param (
        [string]$file = 'C:\BAF\s123.zip', # Path to file to unzip
        [string]$outputDir = 'C:\BAF\', # Path to Destination for unzipped file
        [switch]$windowsUnzipOnly
    )
    
    try
    {
        <#
            (4)
            Do not display a progress dialog box.
            (8)
            Give the file being operated on a new name in a move, copy, or rename operation if a file with the target name already exists.
            (16)
            Respond with "Yes to All" for any dialog box that is displayed.
            (64)
            Preserve undo information, if possible.
            (128)
            Perform the operation on files only if a wildcard file name (*.*) is specified.
            (256)
            Display a progress dialog box but do not show the file names.
            (512)
            Do not confirm the creation of a new directory if the operation requires one to be created.
        #>

        $jobList=@()
        $shell=New-Object -com shell.application
        $zip = $shell.NameSpace($file)

        $lsFileInZip=[array]($zip.items())
        if($lsFileInZip.Count -eq $null -or $lsFileInZip.Count -le 0 -or ($lsFileInZip.Count -eq 1 -and $lsFileInZip[0].Count -eq 0))
        {
            Write-Host -Object "$file is not a valid zip file"
            return $false
        }
        
        #Create new folder if outputDir does not exist
        if((Test-Path -Path $outputDir) -eq $false)
        {
            New-Item -Path $outputDir -ItemType Directory
        }


        foreach($item in $lsFileInZip)
        {
            $shell.Namespace($outputDir).copyhere($item,16)                
        }

        
        

    }
    catch
    {
        #If we only want to use windows in-built file explorer to unzip the file, then we can call it a failure
        if($windowsUnzipOnly.IsPresent)
        {
            Write-Host -Object "$file is not a valid zip file"
            return $false
        }
        if (-not (Test-Path $file)) {
            $file = Resolve-Path $file
        }
    
        if ($outputDir -eq '') {
            $outputDir = [System.IO.Path]::GetFileNameWithoutExtension($file)
        }
        if(Test-Path -Path "C:\Program Files\7-Zip\7z.exe")
        {
            Set-Alias zip "C:\Program Files\7-Zip\7z.exe"
        }
        elseif(Test-Path -Path "C:\Program Files (x86)\7-Zip\7z.exe")
        {
            Set-Alias zip "C:\Program Files (x86)\7-Zip\7z.exe"
        }
    
        zip x "-o$outputDir" $file -y # Unzip File
    }

    
    Write-Host "The file $name was unzipped successfully at $timeStamp !"
    return $true
    
}

Function HeartBeatUpdate([string]$Status,[switch]$NoLocalStatusUpdate)
{
    $sServerDirectory=LoadValueFromSetting $sParentFolder "sServerDirectory"
    $Error.Clear()
    if($NoLocalStatusUpdate.IsPresent -eq $false)
    {
        Write-ValueToSetting -Path $sParentFolder -Key Status -Value $Status
    }
    


    while($Error.Count -lt 3)
    {
        try
        {
            $Status|Out-File -FilePath (Join-Path -Path $sServerDirectory -ChildPath HeartBeat.ini)
            Start-Sleep -Seconds 1
            break
        }
        catch
        {
            Start-Sleep -Seconds 20           
        
        }
    }
}


Function Update-ClientInfo([string]$ProjectRoot=$sParentFolder,[string]$ClientStatus="Idle")
{
    $sParentFolder=$ProjectRoot
    #Find the Idle HeartBeatList Criteria 1. name is heartbeat.ini 2. It is recently written 3. The Status should be idle
    if($ClientStatus -eq "Idle")
    {
        $HeartBeatList=[array](Get-ChildItem -Recurse -Path $sParentFolder|Where-Object{$_.Name -eq "heartbeat.ini" -and ((Get-Date)-$_.LastWriteTime[$_.LastWriteTime.Length-1]).totalseconds -lt 90 -and ((Get-Content -Path $_.FullName) -match "Idle")})
    }
    elseif($ClientStatus.ToLower() -eq "execution_stop")
    {
        $HeartBeatList=[array](Get-ChildItem -Recurse -Path $sParentFolder|Where-Object{$_.Name -eq "progress.csv"})
        $HeartBeatList=$HeartBeatList|where{(Test-Path -Path $_.FullName.tolower().replace("progress.csv","heartbeat.ini")) -eq $true}|where{(Get-Content -Path $_.FullName.tolower().replace("progress.csv","heartbeat.ini").tolower()) -eq "resume"}
    }
    else
    {
        $HeartBeatList=[array](Get-ChildItem -Recurse -Path $sParentFolder|Where-Object{$_.Name -eq "heartbeat.ini" -and ((Get-Date)-$_.LastWriteTime[$_.LastWriteTime.Length-1]).totalseconds -lt 1800 -and ((Get-Content -Path $_.FullName) -match $ClientStatus)})
    }
        
    [array]$ClientList=@()
    foreach($HeartBeat in $HeartBeatList)
    {

        $Set=Join-Path -Path $HeartBeat.DirectoryName -ChildPath setting.ini
        $Status=[string](Get-Content -Path (Join-Path -Path $HeartBeat.DirectoryName -ChildPath heartbeat.ini))
        
        $Computer_Name=Split-Path -Path $HeartBeat.DirectoryName -Leaf
        $clearClientList=@()

        if ($ClientStatus -eq "Idle")
        {
            $Computer_IP=Load-ValueFromSetting -SettingPath $Set -Value "Computer_IP"
            
            $ClientList+=$Computer_Name
            $Key=($Computer_Name+"_IP")
            Write-ValueToSetting -Path (Join-Path -Path $sParentFolder -ChildPath "CenterControl.ini") -Key $Key -Value $Computer_IP

        }
        elseif($ClientStatus.ToLower() -eq "execution_stop")
        {
           #make sure the progress file comes from project folder, not from some random weired place
           $Client=(split-path -path $HeartBeat.FullName -Parent)
           $Client=(split-path -path $Client -Parent)
           $Client=(split-path -path $Client -Parent)
           if($Client -like "*\Project") 
           {
                $ClearList=[array]($HeartBeatList|Where-Object{((Get-Date)-$_.LastWriteTime[$_.LastWriteTime.Length-1]).totalseconds -lt 3600})                
                foreach($clear in $ClearList)
                {
                   $Clear_Client=(split-path -path $clear.FullName -Parent)
                   $Clear_Client=(split-path -path $Clear_Client -Leaf)

                   $clearClientList+=@($Clear_Client)
                }               
                

                if((-not $clearClientList.Contains($Computer_Name))-and $Status -match "resume")
                {
                    $ClientList+=$Computer_Name
                }

                
           }
           else
           {continue}            
            
        }
        else
        {
            #Get the content of heartbeat.ini If it is correct. If the content match ClientStatus, then we call it good
            $bFind=$false
            $HeartbeatContent=([string](Get-Content -Path $HeartBeat.FullName))
            
            if($HeartbeatContent -match $ClientStatus)
            {
                $bFind=$true
            }
            if($bFind)
            {
                $ClientList+=$Computer_Name
            }
        }
    }
    return $ClientList|Sort-Object -Unique

}



Function checkFileName([Parameter(Mandatory=$True)][string]$family, [Parameter(Mandatory=$True)][string]$fileName="", [Parameter(Mandatory=$false)][string]$previous =""){
# function created by Trevor Merrill. Modified by Jason Zhao
#Set to Try to print out Version, Media, and Submedia values for new and last media
write-host "File name = $fileName; Previous name = $previous; Family name = $family"
$DEBUG = $true
$newVersion = ""
$newMedia = ""
$newSubMedia = ""
try
{
#If fileName is less than 10 characters it is assumed invalid
if( $fileName.Length -lt 10)
{
    return $false
}

$family = $family.ToLower()
$previous =$previous.ToLower()
$fileName = $fileName.ToLower()

#Track whether the old and the new file name contain a dot to ensure that when
#they are converted to floats, they are of the same magnitude
$currentContainsPeriod = $true
$previousContainsPeriod = $true


    
    $fileName = $fileName.Replace("uploading","")
    $fileName = $fileName.Replace("upload","")
    while($fileName.StartsWith(".")){
        $fileName = $fileName.Substring(1)
    }
    while($fileName.StartsWith(" ")){
        $fileName = $fileName.Substring(1)
    }

    $regexMedia = [regex]"[^v,^V,0-9][0-9]{1,}[a-z]{0,1}\."
    [string]$newMedia = $fileName.subString(($regexMedia.Match($fileName)).Index +1, $fileName.LastIndexOfAny(".")-($regexMedia.Match($fileName)).Index-1)
    
    #Version Number may appear with or without the Dot. Here are the two regular expressions to capture it.
    $regexVersionDot = [regex]"[v,V][0-9]{1,3}\.[0-9]{1,}"
    $regexVersionNoDot = [regex]"[v,V][1-9][1-9]{0,3}"
    
    $regex = $regexVersionDot
    #Check to see if version is in format similar to V86 
    if( -not $regex.Match($fileName).Success)
    {
        $currentContainsPeriod = $false
        $regex = $regexVersionNoDot
        if( -not $regex.Match($fileName).Success )
        {
            write-host "Unable to determine version number For Previous File"
            return
        }
    }
    
    [string]$newVersion = $fileName.subString(($regex.Match($fileName)).Index, ($regex.Match($fileName)).Length+1)
  
   
    #$true;
    # return these values for further use:
    if($newVersion.StartsWith("v")){
        $newVersion = $newVersion.Substring(1)
    }
    
     #Need to adjust the values of converted version variables if the version formats were different
    if( -not $currentContainsPeriod )
    {
        
        $newVersion = $newVersion;
    }

   


#Check by Family if the formatting is correct
switch($family)
{
    
    
    "psc" {
           if( !($fileName -match "^PSCFamilySuiteV[0-9]{1,}\.[0-9]{1,}_.*\.exe$") `
           -and !($fileName -match "^PSCFamilySuiteV[0-9]{1,}\.[0-9]{1,}_.*\.iso$") `
           -and !($fileName -match "^PSCFamilySuiteV[0-9]{1,}_.*\.exe$") -and !($fileName -match "^PSCFamilySuiteV[0-9]{1,}_.*\.zip$")
           )
           {$false
           $newVersion
            $newMedia
            $newSubMedia
            return}   
          }

    "aes" {
           if( !($fileName -match "^AES_V[0-9]{1,}\.[0-9]{1,}_MEDIA_[0-9]{1,3}.*\.7z$") `
           -and !($fileName -match "^AES_V[0-9]{1,}\.[0-9]{1,}_MEDIA_[0-9]{1,3}.*\.iso$")`
           -and !($fileName -match "^aspenONEV[0-9]{1,3}ENG_MEDIA_[0-9]{1,3}.*\.iso$") -and !($fileName -match "^aspenONEV[0-9]{1,3}ENG_MEDIA_[0-9]{1,3}.*\.zip$"))
           {$false
           $newVersion
            $newMedia
            $newSubMedia
            return}   
          }

    "scf" {
           if( !($fileName -match "^AspenSCFSuiteV[0-9]{1,}\.[0-9]{1,}_Media.*\.zip$") `
           -and !($fileName -match "^AspenSCFSuiteV[0-9]{1,}\.[0-9]{1,}_Media.*\.iso$") -and !($fileName -match "^V[0-9]{1,}\.[0-9]{1,}_MSCT_Media.*\.iso$"))
           {$false
           $newVersion
            $newMedia
            $newSubMedia
            return}   
          }
    "mbo" {
           if( !($fileName -match "^PSCFamilySuiteV[0-9]{1,}\.[0-9]{1,}_B.*\.zip$") `
           -and !($fileName -match "^^PSCFamilySuiteV[0-9]{1,}\.[0-9]{1,}_B.*\.iso$") -and !($fileName -match "^^PSCFamilySuiteV[0-9]{1,}\.[0-9]{1,}_B.*\.zip$"))
           {$false
           $newVersion
            $newMedia
            $newSubMedia
            return}   
          }

    "ams" {
    if( !($fileName -match "^AMS_SUITE_v[0-9]{1,}\.{0,1}[0-9]{0,}T{0,}_MEDIA_.*\.zip$")    )
    {$false
    $newVersion
    $newMedia
    $newSubMedia
    return}
    }
    "apc" {
    if( !($fileName -match "^APC_V[0-9]{1,}\.{0,1}[0-9]{0,}T{0,}_Media.*\.zip$")    )
    {$false
    $newVersion
    $newMedia
    $newSubMedia
    return}  
    }
    "analytics"
    {
        if( !($fileName -match "^V[0-9]{1,2}\.[0-9]{0,1}_APM_Suite_[0-9]{1,4}.*\.ISO$") -and  !($fileName -match "^V[0-9]{1,}\.[0-9]{0,1}Nov_Analytics_Suite_[0-9]{1,4}.*\.ISO$") -and  !($fileName -match "^V[0-9]{1,}\.[0-9]{0,1}Nov_APM_Suite_[0-9]{1,4}.*\.ISO$")  )
        {$false
        $newVersion
        $newMedia
        $newSubMedia
        return}  
        
    }
    "msc"
    {
        #V10.0_MSCP_Media141
        if( !($fileName -match "^V[0-9]{1,2}\.[0-9]{0,1}_MSC\w_Media[0-9]{1,4}.*\.ISO$") -and  !($fileName -match "^V[0-9]{1,}\.[0-9]{0,1}Nov_Analytics_Suite_[0-9]{1,4}.*\.ISO$") -and  !($fileName -match "^V[0-9]{1,}\.[0-9]{0,1}Nov_APM_Suite_[0-9]{1,4}.*\.ISO$")  )
        {$false
        $newVersion
        $newMedia
        $newSubMedia
        return}  
        
    }
    "mtell"
    {
        #Aspen Mtell V10.0 CP2 RC04.zip
        if( !($fileName -match "^Aspen Mtell V[0-9]{1,2}\.[0-9]{0,1} CP\w RC[0-9]{1,4}.*\.zip$") )
        {$false
        $newVersion
        $newMedia
        $newSubMedia
        return}  
        
    }
    "ams_cp"
    {
        #Aspen_MES_v10.1_Patch1_RC20.zip
        if( !($fileName -match "^Aspen_MES_v[0-9]{1,2}\.[0-9]{0,1}_Patch[0-9]_RC[0-9]{1,4}.*\.zip$") )
        {$false
        $newVersion
        $newMedia
        $newSubMedia
        return}  
    }
    "psc_cp"
    {
        #SchedulingV10.0_CP1_Build06.zip
        if( !($fileName -match "^SchedulingV[0-9]{1,2}\.[0-9]{0,1}_CP[0-9]_Build[0-9]{1,4}.*\.zip$") )
        {$false
        $newVersion
        $newMedia
        $newSubMedia
        return}  
    }
  default {write-host "ERROR: Product Family >>>> $family <<<< Was Not Recognized"
            {$false
           $newVersion
            $newMedia
            $newSubMedia
            return}
            }
}

    #$regex = [regex]"[^v,0-9][0-9]{1,}[a-z]{0,1}\."
    #[string]$newMedia = $fileName.subString(($regex.Match($fileName)).Index +1, $fileName.LastIndexOfAny(".")-($regex.Match($fileName)).Index-1)
    #$regex = [regex]"v[0-9]{1,2}\.[0-9]{1,}"
    #[string]$newVersion = $fileName.subString(($regex.Match($fileName)).Index, ($regex.Match($fileName)).Length)


    # if there is no previous media given, then simply proceed with the new media
    if($previous -eq "")
    {
    $true; 
    # return these values for further use:
    $newVersion
    $newMedia
    $newSubMedia
    return
    } 



   
    #Determine the version and media number for the last media and new file name.
    
    [string]$lastMedia = $previous.subString(($regexMedia.Match($previous)).Index +1, $previous.LastIndexOfAny(".")-($regexMedia.Match($previous)).Index-1)
    
    $regex = $regexVersionDot
    #Check to see if version is in format similar to V86 
    if( -not $regex.Match($previous).Success)
    {
        $previousContainsPeriod = $false
        $regex = $regexVersionNoDot
        if( -not $regex.Match($previous).Success )
        {
            write-host "Unable to determine version number for Previous File"
            return
        }
    }


    [string]$lastVersion = $previous.subString(($regex.Match($previous)).Index, ($regex.Match($previous)).Length)
    
    
     #check if there is a subversion in the previous media file name
    if( $lastMedia -match "[a-z]" )
    {
        $lastSubMedia = $lastMedia.Substring($lastMedia.Length-1);
         [single]$lastMedia = $lastMedia.SubString(0, $lastMedia.Length-1)
    }
    else
    {
        $lastSubMedia = $null;
        [single]$lastMedia = $lastMedia
    }


    if($lastVersion.StartsWith("v")){
        $lastVersion = $lastVersion.Substring(1)
    }

    #convert version decimal format by removing "V" from start of name

    [single]$newVersion = $newVersion
    [single]$lastVersion = $lastVersion
    
   

    #Need to adjust the values of converted version variables if the version formats were different
    if( -not $previousContainsPeriod )
    {
        $lastVersion = $lastVersion/10.0;
    }



    #check if the criteria is met for a new media file
    

    if( ($newVersion -gt $lastVersion) -or
    (($newVersion -eq $lastVersion) -and 
    (($newMedia -gt $lastMedia) -or
    (($newMedia -eq $lastMedia) -and( (($lastSubMedia -ne $null) -and ($newSubMedia -ne $null) -and ($newSubMedia.CompareTo($lastSubMedia) -gt 0) )  -or 
    ( ($lastSubMedia -eq $null) -and ($newSubMedia -ne $null)))))))  
    {

        $true;
    }
    else
    {
        $false;
    }

    # return these values for further use:
    $newVersion
    $newMedia
    $newSubMedia
    $lastVersion
    $lastMedia
    $lastSubMedia
    return
}
catch
{
  write-host "ERROR: Exception when trying to determine version and media number"
  appendTestLog "$(logTime)newly created file has illegal name: $filename" "$logName"
  $false;
  # return these values for further use:

    $newVersion
    $newMedia
    $newSubMedia
  }
}  

Function Execute-ParallelPowershell([array]$ScriptBlocks,[int]$iTimeOut=600)
{
    #Make sure that the parallel powershell will not exit before
    [array]$WatchList=@()
    $bFinish=$true
    $iTime=0

    #Clean up the threading that is not in use
    Get-ChildItem -Path $sParentFolder -Filter Threading*|Remove-Item -Force

    #Output the threading file
    foreach($Script in $ScriptBlocks)
    {
        for($i=0;$i -le 65535;$i++)
        {
            if ((Test-Path -Path (Join-Path -Path $sParentFolder -ChildPath Threading$i.ps1)) -eq $false)
            {
                $WatchList+=@("Threading$i")
                $Script+=@("$([char]13)")
                $Script+=@("'done'|Out-File -FilePath (Join-Path -Path $sParentFolder -ChildPath Threading$i)")
                $Script|Out-File -FilePath (Join-Path -Path $sParentFolder -ChildPath Threading$i.ps1)
                Start-Process powershell.exe -ArgumentList ("$(Join-Path -Path $sParentFolder -ChildPath Threading$i.ps1)")
                break
            }
            
        }
    }

    #Wait till the execution is finished
    while($iTime -le $iTimeOut)
    {
        $bFinish=$true
        foreach($Watch in $WatchList)
        {
            if ((Test-Path -Path (Join-Path -Path $sParentFolder -ChildPath $Watch)) -eq $false)
            {
                $bFinish=$false
                break
            }
        }
        if($bFinish -eq $false)
        {
            Start-Sleep -Seconds 1
            $iTime++
        }
        else
        {
            Write-Host("The Muti-threading execution finish successfully")
            return $true
            break
        }
    }
    if($iTime -gt $iTimeOut)
    {
        Write-Host("The execution failed to finish within the $iTimeOut s")
        return $false
    }

}


Function Convert-P4LocationToWinLocation([string]$P4Location,[string]$P4_Work_Space_Folder="c:\p4\")
{
    $Out=$P4Location.Replace("//depot/","")
    $Out=Join-Path -Path $P4_Work_Space_Folder -ChildPath $Out
    $Out=$Out.Replace("/","\")
    return $Out
}

Function Execute-RemoteCommandV2([string]$IP,[string]$username="localhost\Administrator",[string]$password="Aspen100",[string[]]$command,[int]$iTimeOut=150)
{
    
    $spassWord=ConvertTo-SecureString -String $password -AsPlainText -Force    
    $Cred=New-Object -TypeName System.Management.Automation.PSCredential -ArgumentList $username,$spassWord    
    $session=$null
    $session=New-PSSession -ComputerName $IP -Credential $Cred
    if($session -ne $null)
    {
        #iTimeOut=$iTimeOut/($command.count)
        foreach($sLine in $command)
        {
            $timeStamp1=Get-Date        
            $job=Invoke-Command -Session $session -ScriptBlock ([scriptblock]::Create($sLine)) -AsJob
            $iTimePassed=0
            while($iTimePassed -lt $iTimeOut)
            {
                $iTimePassed=((Get-Date)-$timeStamp1).TotalSeconds
                if($job.state -eq "Failed")
                {
                    Write-Warning -Message "Command $sLine failed in $IP"
                    
                    break
                }
            
                if($job.State -eq "Completed")
                {
                    
                    break
                }
            
            }

            if($iTimePassed -ge $iTimeOut)
            {
                Write-Warning -Message "It takes more than $iTimeOut s to execute command $command in $IP machine"
            }
        }

        Remove-PSSession -Session $session
    }
    else
    {
        
        $ART_Server=LoadValueFromSetting -Path $sCenterControlINI -sValue "ART_Server"

        $sTempShareFolderPath=Join-Path -Path $ART_Server -ChildPath "Temp"
        #Create new directory
        if((Test-Path -Path $sTempShareFolderPath)-eq $false)
        {
            New-Item -Path $sTempShareFolderPath -ItemType Directory
        }
         
         Execute-RemotePowershell -SharedLocation $sTempShareFolderPath -ScriptBlock $command -IP $IP -username $username -password $password -iTimeOut $iTimeOut
        
        
 
        
    }
    
    
}
function unknownschedulefunction()
{
        foreach($sItem in $command)
        {
            #Replace all ' with \\\"
            #First \\ is a replacement for \
            $sLine=$sItem.replace("'","\\\`"")
            #If no powershell is appeared, then replace that with 
            if($sLine -notmatch "^powershell")
            {
                $sLine="powershell \`"$sLine\`""
            }
            
            #due to the limiataion of 256 cha for schtasks...we have to use work around.
            #we append string into c:\wwwPSTemp.bat, run it and delete it..
            

            
            $iSegment=250
            if($sLine.Length -lt $iSegment)
            {
                Execute-RemoteCommand -IP $IP -username $username -password $password -command $sLine -iTimeOut $iTimeOut
            }
            else
            {
                Write-Host -Object "Current command exceed maximum length, divide it up"
                $iSegment=100
                #Delete c:\wwwPSTemp.bat if any
                Execute-RemoteCommand -IP $IP -username $username -password $password -command "cmd /c del /f c:\wwwPSTemp.bat" -iTimeOut $iTimeOut

                #Construct c:\wwwPSTemp.bat
                $lsSegments=Get-StringIntoParts -iSegment $iSegment -sLine $sLine
                foreach($item in $lsSegments)
                {
                    $sSegment= "[System.IO.File]::AppendAllText('c:\wwwPSTemp.bat', '$item', [System.Text.Encoding]::Unicode)"
                    Execute-RemoteCommandV2 -IP $IP -username $username -password $password -command $sSegment -iTimeOut $iTimeOut
                }
                #Execute c:\wwwPSTemp.bat
                Execute-RemoteCommand -IP $IP -username $username -password $password -command "c:\wwwPSTemp.bat" -iTimeOut $iTimeOut

            }
            



            

            
        }
}
Function Get-StringIntoParts([int]$iSegment,[string]$sLine)
{
    
    
    #due to the limiataion of 256 cha for schtasks...we have to use work around.
    #we append string into c:\wwwPSTemp.bat, run it and delete it..
                        
    #divide charatters into group of 50
        
    $sTempStr=$sLine
    $lsSegments=@()
    while($true)
    {
        if($sTempStr.Length -ge $iSegment)
        {
            #If segment is greater than count of segment, keep dividing until it reachs its end
            $sPart=$sTempStr.Substring(0,$iSegment)
            $lsSegments+=@($sPart)
            $sTempStr=$sTempStr.Substring($iSegment)
        }
        else
        {
            $lsSegments+=@($sTempStr)
            break
        }
    }
    
    return $lsSegments

}


Function Execute-RemoteCommand([string]$IP,[string]$username,[string]$password="Aspen100",[string]$command,[int]$iTimeOut=150)
{
    #When iTimeOut=0, then the execution will go without waiting till the task is running or not.
    $i=0    
    $iTime=0
    $bTaskFinish=$false
    $IPTemp=Get-IPAddress -MachineName $IP
    if($IPTemp -ne "Fail to Find IP Address")
    {
        $IP=$IPTemp
    }
    if($username -eq $null)
    {
        $username="Admin"
    }    
    
    do
    {
        $i++
        &schtasks /s $IP /u $username /p $password /create /sc MONTHLY /D 1 /ST 01:01 /TR $command /TN ("RemoteTask"+$i) /f 
        
        $str="schtasks /s $IP /u $username /p $password /run /tn "+("RemoteTask"+$i)
        write-host -Object "$str"
        $lsResult=Invoke-Expression $str
        
        
        
        Write-Host($lsResult)
        
        
    }
    while($lsResult -match "is currently running" -or $i>15)

    if($iTimeOut -eq 0){$bTaskFinish=$true}

    $str="schtasks /s $IP /u $username /p $password /tn "+("RemoteTask"+$i)
    while($iTime -le $iTimeOut -and $bTaskFinish -eq $false -and $bTaskFinish -ne $true -and $bTaskFinish -ne $null)
    {
        $lsResult=Invoke-Expression $str
        foreach($sResult in $lsResult)
        {
            if ($sResult -match "Ready" -and $sResult -match ("RemoteTask"+$i))
            {
                $bTaskFinish=$true
                break
            }
        }
        Start-Sleep -Seconds 1
        $iTime++
    }

    if ($bTaskFinish -eq $true)
    {
        Write-Host("$command finish finish successfully")
    }
    else
    {
        Write-Host("$command failed to be finish within "+($iTimeOut)+" s")
        
    }

    &schtasks /s $IP /u $username /p $password /Delete /tn ("RemoteTask"+$i) /f
    write-host
    

}

Function Execute-RemotePowershell([string]$SharedLocation="\\nhqa-w81-q10\v6\project\Test",$ScriptBlock,[string]$IP,[string]$username,[string]$password="Aspen100",[int]$iTimeOut=150)
{
    #use shared machine's IP address instead of machine name because our DNS sucks
    $sNetDrive=(Split-NetPath -NetPath $SharedLocation -Type root)
    $sSharedMachineName=$sNetDrive.Replace("`\`\","")
    $sLocalIP=Get-IPAddress -MachineName $sSharedMachineName
    $IPDrive="`\`\$sLocalIP"
    $SharedLocation=$SharedLocation.Replace($sNetDrive,$IPDrive)

    $fileName=((Get-Date).ToFileTimeUtc()+(Get-Random -Maximum 65535 -Minimum 0)).ToString()+".ps1"
    
    $filePath=(Join-Path -Path $SharedLocation -ChildPath $fileName)
    $ScriptBlock=[array]($ScriptBlock)
    #This line served as a transaction indicator, which will change file modification time
    $ScriptBlock=@("''|Out-File -FilePath `"$filePath`" -Append -Encoding ascii")+$ScriptBlock
    $ScriptBlock|Out-File -Width 4096 -Encoding ascii -FilePath $filePath 
    $fileObj=Get-Item -Path $filePath
    $currentAccessTime=($fileObj.LastWriteTime)
    $strCurrentAccessTime=$currentAccessTime.ToFileTimeUtc()
    
    Execute-RemoteCommand -IP $IP -username $username -password $password -command "powershell.exe -ExecutionPolicy Bypass -File $filePath" -iTimeOut $iTimeOut
    $strNewAccessTime=((Get-Item -Path $filePath).LastWriteTime).ToFileTimeUtc()
    write-host "Wait for Script Completion $filePath"
    if($iTimeOut -eq 0)
    {
        #if timeout is zero, at least we try to wait for a while....
        $iTimeOut=60
    }
    while(((Get-Date)-$currentAccessTime).TotalSeconds -lt $iTimeOut -and $strNewAccessTime -eq $strCurrentAccessTime)
    {
        $strNewAccessTime=((Get-Item -Path $filePath).LastWriteTime).ToFileTimeUtc()
        Start-Sleep -Seconds 1
        
    }
    write-host "Script Completion"
    Remove-Item -Path $filePath
    
}

$Global:bUpdateLog=$false
[datetime]$Global:dtLastSyncTime=[datetime]::Parse("03/13/2015 09:32:05")
[int]$iLatencyTolerance=500
Function Log
{
          [CmdletBinding(SupportsShouldProcess=$True)]
    param(
          [Parameter(Mandatory=$false,
          ValueFromPipeline=$true)]

          [string]$Err = "Error Info",
          [string]$ServerLocation = ""
        )

    

    #$sLastSyncTime=Load-ValueFromSetting -SettingPath (Join-Path -Path $sParentFolder -ChildPath "setting.ini") -Value "Server_Latency_Last_Sync_Time" -DefaultValue "Saturday, March 13, 2010 9:05:33 AM"
    #[datetime]$dtLastSyncTime=[datetime]::Parse($sLastSyncTime)

    $NativeLog=Join-Path -Path $sParentFolder -ChildPath "Log.txt"
    (Get-Date -f yyyy.MM.dd_hh:mm:ss)+"           "+$Err|Out-File -FilePath $NativeLog -Append
    
    #Sync up with server, if the latency is more than 500s, then we are not going to update the result to the server
    
    $CurrentTime=Get-Date
    if((($CurrentTime-$Global:dtLastSyncTime).TotalSeconds -gt 300))
    {
        
        $Servername=Get-ComputerNameFromPath -Path $ServerLocation
        $Timer1=Get-Date
        Get-IPAddress $Servername -Verifiy
        $Timer2=Get-Date
        $iLatencyToServer=($Timer2-$Timer1).TotalMilliseconds
        $Global:dtLastSyncTime=$Timer2

        if($iLatencyToServer -lt $iLatencyTolerance)
        {
            $bUpdateLog=$True
        }
        else
        {
            $bUpdateLog=$false
        }
        
        if($bUpdateLog -eq $True)
        {
            if ((Test-Path -Path $ServerLocation) -eq $false)
            {
                $bUpdateLog=$false
            }
        }

        $Global:bUpdateLog=$bUpdateLog
       #Write-ValueToSetting -Path (Join-Path -Path $sParentFolder -ChildPath "setting.ini") -Key "Server_Latency_Last_Sync_Time" -Value ($dtLastSyncTime.ToString())
       Write-Host -Object "Last sync time $dtLastSyncTime, Current Time is $CurrentTime. Current Latency to Server $iLatencyToServer, Max Latency Tolerance is $iLatencyTolerance, and Server update is $bUpdateLog" -ForegroundColor DarkGray
   
    }

    

    
    if( ($ServerLocation -ne "") -and ($bUpdateLog))
    {
        
        Write-Host($Err)
        $ServerLog=Join-Path -Path $ServerLocation -ChildPath "Log.txt"
        (Get-Date -f yyyy.MM.dd_hh:mm:ss)+"           "+$Err|Out-File -FilePath $ServerLog -Append
    }


}

Function Make-HTMLOutput($CSV,[string]$Project,[string]$Identification="",[string]$Version="",[string]$Media="",[string]$StartTime="",[string]$LastUpdateTime="N/A",[string]$OS="N/A",[HashTable]$ClientStatusList,[HashTable]$ClientExecutionHashTable)
{
    Function Change-HTMLTag([array]$HTMLCode,[string]$Tag,$TagNumber=1,[string]$Command="")
    {
        $Output=@()
        $TagToken=0
        $sTemp=""
        foreach($code in $HTMLCode)
        {

            if($code -notmatch "<"+$Tag)
            {
                $Output+=@($code)
            }
            else
            {
                $TagToken++
                if($TagToken -ne $TagNumber)
                {
                    $Output+=@($code)
                }
                else
                {
                    $sTemp=$code
                    $iTemp=$sTemp.IndexOf($Tag)
                    $sTemp=$sTemp.Insert($iTemp+$Tag.Length," "+$Command)
                    $Output+=@($sTemp)
                }
            }
        }
        return $Output
    }
    Function SubCountCal([array]$CSV)
    {
        $iTotal=0
        foreach($_ in $CSV)
        {
            $iTotal+=$_.SubTest_Count
        }
        return $iTotal
    }

    $Output=$CSV
    #$lsTBD=$Output|where{$_.Result -eq "TBD"}|Select-Object $_.id,@{Name = "Headline" ; Expression = { "{0:N1}" -f( $_.Headline) }}
    #$lsTBD|ConvertTo-Html -Fragment -As Table -PreContent "<h2>To-Be-Determined Testcases</h2>"|Out-String
    
    [array]$lsSD=$Output|where{$_.Result -eq "Suspicious defect"}
    $iSD=SubCountCal -CSV $lsSD
    foreach($_ in $lsSD)
    {
        if($_.SubTest_Count -eq $null){$_.SubTest_Count="0";}
        $_.SubTest_Count=([decimal]::Round([decimal]::Parse($_.SubTest_Count),2)).ToString()
    }
    
    #$iSD=$lsSD.Length
    
    $lsSD=Change-HTMLTag -Tag "table" -Command "class=SD" -HTMLCode($lsSD|ConvertTo-Html -Fragment -As Table -PreContent "<h2>Suspicious Defects</h2>"|Out-String)
    
    [array]$lsSMR=$Output|where{$_.Result -eq "Script Maintenance Required"}
    #$iSMR=$lsSMR.Length
    $iSMR=SubCountCal -CSV $lsSMR
    #$lsSMR|foreach{if($_.SubTest_Count -eq $null){$_.SubTest_Count="0";};$_.SubTest_Count=([decimal]::Round([decimal]::Parse($_.SubTest_Count),2)).ToString()}
    foreach($_ in $lsSMR)
    {
        if($_.SubTest_Count -eq $null){$_.SubTest_Count="0";}
        $_.SubTest_Count=([decimal]::Round([decimal]::Parse($_.SubTest_Count),2)).ToString()
    }
    $lsSMR=Change-HTMLTag -Tag "table" -Command "class=SMR" -HTMLCode($lsSMR|ConvertTo-Html -Fragment -As Table -PreContent "<h2>Script Maintenance Required</h2>"|Out-String)
    
    [array]$lsPASS=$Output|where{$_.Result -eq "pass" -or $_.Result -eq "PASS" -or $_.Result -eq "PASS"}
    #$iPASS=$lsPASS.Length
    $iPASS=SubCountCal -CSV $lsPASS
    #$lsPASS|foreach{if($_.SubTest_Count -eq $null){$_.SubTest_Count="0";};$_.SubTest_Count=([decimal]::Round([decimal]::Parse($_.SubTest_Count),2)).ToString()}
    foreach($_ in $lsPASS)
    {
        if($_.SubTest_Count -eq $null){$_.SubTest_Count="0";}
        $_.SubTest_Count=([decimal]::Round([decimal]::Parse($_.SubTest_Count),2)).ToString()
    }
    $lsPASS=Change-HTMLTag -Tag "table" -Command "class=PASS" -HTMLCode($lsPASS|ConvertTo-Html -Fragment -As Table -PreContent "<h2>PASS</h2>"|Out-String)
    
   
    [array]$lsTBD=$Output|where{$_.Result -eq "TBD"}
    $iTBD=SubCountCal -CSV $lsTBD
    #$lsTBD|foreach{if($_.SubTest_Count -eq $null){$_.SubTest_Count="0";};$_.SubTest_Count=([decimal]::Round([decimal]::Parse($_.SubTest_Count),2)).ToString()}
    foreach($_ in $lsTBD)
    {
        if($_.SubTest_Count -eq $null){$_.SubTest_Count="0";}
        $_.SubTest_Count=([decimal]::Round([decimal]::Parse($_.SubTest_Count),2)).ToString()
    }
    $lsTBD=Change-HTMLTag -Tag "table" -Command "class=TBD" -HTMLCode($lsTBD|ConvertTo-Html -Fragment -As Table -PreContent "<h2>TBD</h2>"|Out-String)

    [array]$lsPending=$Output|where{$_.Result -eq "" -or $_.Result -eq $null}
    #$iPending=$lsPending.Length
    $iPending=SubCountCal -CSV $lsPending
    $iTotal=$iPASS+$iSMR+$iTBD+$iSD
    

    $DashBoard=New-Object System.Data.DataTable "Statistics"
    $Temp=New-Object System.Data.DataColumn Type,([string])
    $DashBoard.Columns.Add($Temp)
    
    $Temp=New-Object System.Data.DataColumn Number,([string])
    $DashBoard.Columns.Add($Temp)
    
    $Temp=New-Object System.Data.DataColumn Percentage,([string])
    $DashBoard.Columns.Add($Temp)
    if($iTotal -eq 0)
    {
        $iTotal=0.00001    
    }

    $Temp=$DashBoard.NewRow()
    $Temp.Type="PASS"
    $Temp.Number=([decimal]::Round($iPASS,2)) -as [string]
    $Temp.Percentage=(($iPASS/$iTotal)*100 -as [int16] -as [string])+"%"

    $DashBoard.Rows.Add($Temp)

    $Temp=$DashBoard.NewRow()
    $Temp.Type="Suspicious Defect"
    $Temp.Number=([decimal]::Round($iSD,2)) -as [string]
    $Temp.Percentage=(($iSD/$iTotal)*100 -as [int16] -as [string])+"%"
    $DashBoard.Rows.Add($Temp)


    $Temp=$DashBoard.NewRow()
    $Temp.Type="Script Maintenance Required"
    $Temp.Number=([decimal]::Round($iSMR,2)) -as [string]
    $Temp.Percentage=(($iSMR/$iTotal)*100 -as [int16] -as [string])+"%"
    $DashBoard.Rows.Add($Temp)



    $Temp=$DashBoard.NewRow()
    $Temp.Type="TBD"
    $Temp.Number=([decimal]::Round($iTBD,2)) -as [string]
    $Temp.Percentage=(($iTBD/$iTotal)*100 -as [int16] -as [string])+"%"
    $DashBoard.Rows.Add($Temp)

    $Temp=$DashBoard.NewRow()
    $Temp.Type="Current Progress"
    $Temp.Number=(($iTotal) -as [string])+"/"+(($iTotal+$iPending) -as [string])
    $Temp.Percentage=((($iTotal)/($iTotal+$iPending))*100 -as [int16] -as [string])+"%"
    $DashBoard.Rows.Add($Temp)
    $DashBoard|Export-Csv -Path (Join-Path -Path $sParentFolder -ChildPath MakeHTMLOutputTemp.csv)
    $DashBoard=Import-Csv -Path (Join-Path -Path $sParentFolder -ChildPath MakeHTMLOutputTemp.csv)
    Remove-Item -Path (Join-Path -Path $sParentFolder -ChildPath MakeHTMLOutputTemp.csv)
    $DashBoard=$DashBoard|ConvertTo-Html -Fragment -As Table -PreContent "<h2></h2>"|Out-String|Out-File -FilePath (Join-Path -Path $sParentFolder -ChildPath temp.txt)
    $DashBoard=Get-Content -Path (Join-Path -Path $sParentFolder -ChildPath temp.txt)
    Remove-Item -Path (Join-Path -Path $sParentFolder -ChildPath temp.txt) -Force
    
    $DashBoard=Change-HTMLTag -HTMLCode $DashBoard -Tag "tr" -TagNumber 1 -Command "bgcolor='#DDA0DD'"
    $DashBoard=Change-HTMLTag -HTMLCode $DashBoard -Tag "tr" -TagNumber 2 -Command "bgcolor='#90EE90'"
    $DashBoard=Change-HTMLTag -HTMLCode $DashBoard -Tag "tr" -TagNumber 3 -Command "bgcolor='#F08080'"
    $DashBoard=Change-HTMLTag -HTMLCode $DashBoard -Tag "tr" -TagNumber 4 -Command "bgcolor='#FFE4B5'"
    $DashBoard=Change-HTMLTag -HTMLCode $DashBoard -Tag "tr" -TagNumber 5 -Command "bgcolor='#B0E0E6'"
    $DashBoard=Change-HTMLTag -HTMLCode $DashBoard -Tag "tr" -TagNumber 6 -Command "bgcolor='#DDA0DD'"
    
    $DashBoard=$DashBoard|Out-String
          
    $Css='<style>table{margin:auto; width:98%}
            Body{background-color:rgb(247, 255, 214); Text-align:Center;}
            .PASS th{background-color:#1B7718; color:white;Text-align:left;}
            .PASS td{background-color:rgb(214, 224, 108); color:Black; Text-align:left;}
            .SD th{background-color:rgb(227, 62, 62); color:white; Text-align:left;}
            .SD td{background-color:rgb(245, 206, 206); color:Black; Text-align:left;}
            .SMR th{background-color:rgb(255, 153, 0); color:white; Text-align:left;}
            .SMR td{background-color:rgb(255, 201, 121); color:Black; Text-align:left;}
            .TBD th{background-color:rgb(0, 183, 255); color:white; Text-align:left;}
            .TBD td{background-color:rgb(198, 204, 255); color:Black; Text-align:left;}
     </style>'
    
    if($Version -ne "")
    {
        $Identification+=" Version:"+$Version
    }
    if($Media -ne "")
    {
        $Identification+=" Media:"+$Media
    }

    if($StartTime -ne "")
    {
        $StartTime="This execution started:"+$StartTime+" "
    }
    $LastUpdateTime="Last Update:"+$LastUpdateTime

    if($ClientStatusList -ne $null)
    {
        try
        {
            $iPercentage=(($iTotal)/($iTotal+$iPending))
        }
        catch
        {
            $iPercentage=0
        }
        $ClientStatusDashboard=Convertto-ProgressBar -MachineStatusList $ClientStatusList -Progress $iPercentage -ClientExecutionHashTable $ClientExecutionHashTable
    }
    $Report = ConvertTo-Html -Title $Project `
                         -Head "<meta http-equiv='refresh' content='30'><h1>Automatic Regression Test System</h1><h3>$Project<br></h3>$Identification<br>The Client OS: Office 2013 Update 2 with $OS Update1<br>$StartTime<br>EST $LastUpdateTime" `
                         -Body "<p><a href='MasterExecutionResult.csv'>Download</a><br><a href='../'>HOME</a></p> $ClientStatusDashboard $DashBoard $lsPASS $lsSD $lsSMR $lsTBD $Css"
    
    return $Report
}


Function CombineCSV([array]$lsClientDirectory)
{
    
    $Output=$null
    foreach($sClientDirectory in $lsClientDirectory)
    {
        $sCurrentFile=$null
        if (Test-Path -Path (Join-Path -Path $sClientDirectory -ChildPath ExecutionResult.csv))
        {
            $sCurrentFile=(Join-Path -Path $sClientDirectory -ChildPath ExecutionResult.csv)
        }
        elseif (Test-Path -Path (Join-Path -Path $sClientDirectory -ChildPath Progress.csv))
        {$sCurrentFile=(Join-Path -Path $sClientDirectory -ChildPath Progress.csv)}
        if($sCurrentFile -ne $null)
        {
            $Output+=Import-Csv -Path $sCurrentFile
        }
    }


    return $Output
}

Function Wait-PipelineFree([string]$Pipelinename,$iTimeout=600)
{
    $pipe=$null
    $iTime=0
    
    while($pipe -eq $null -and $iTime -lt $iTimeout)
    {
        
        [gc]::Collect()
        try
        {
            $pipe=new-object System.IO.Pipes.NamedPipeServerStream($Pipelinename) -ErrorAction SilentlyContinue;
            $iTime=0
        }
        catch
        {
            $Error.Clear()
            Write-Host "Please wait for $Pipelinename become available. Current Wait time is $iTime" -ForegroundColor DarkRed
        }
        
        Start-Sleep -Seconds 1
        $iTime++        
    }

    return $pipe
}

Function Add-ItemToGloablAllSettings([string]$Path,[string]$Key,$Value)
{
    $bSettingMissing=$true
    foreach($setting in $Global:AllSettings)
    {
        if($setting.FileName -eq $Path -and $Key -eq $Key)
        {
            $setting.Value=$Value
            $setting.TimeStamp=(Get-Date).ToString()
            $bSettingMissing=$false
            break

        }
        
        
    }
    if($bSettingMissing)
    {
        $setting=SettingClass -FileName $Path -Key $Key -Value $Value
        $Global:AllSettings+=@($setting)
    }
}

Function Write-ValueToSetting([string]$Path,[string]$Key,$Value,[switch]$SQLOnly)
{
    

    $iMaxTrial=0

    
    while($iMaxTrial -lt 20)
    {
    
        
        $bValueFind=$false
    
        if($Value -match "&")
        {
            $Value="`""+$Value+"`""
        }

        if($Path -notmatch "ini")
        {
            $Path=Join-Path -Path $Path -ChildPath "setting.ini"
        }
        if((Test-Path -Path $Path) -eq $false)
        {
            ""|Out-File $Path
        }
        
        #write result into sql database
        if($iMaxTrial -eq 0)
        {
    
            #generate sql friendly table name
            $sqlTable=Split-Path -Path $Path -Leaf
            #special senario for centercontrol.ini. this file has been formateed as project, in this way, we set project flag global
            if($Key -match ($Global:Project+"_"))
            {
                $project=$Global:Project
                $ModifiedKey=$key.Replace(($Global:Project+"_"),"")
            }
            else
            {
                $project="Global"
                $ModifiedKey=$Key
            }
            #$result=Write-ValueToSql -tableName $sqlTable -key $ModifiedKey -project $project -value $Value

            if($SQLOnly.IsPresent)
            {
                return
            }
            
        }



        if((Test-Path -Path $Path) -eq $false)
        {
            ""|Out-File -FilePath $Path -Encoding ascii
        }
        $file=Get-Item -Path $Path
        $pipe=Wait-PipelineFree -Pipelinename ("ARTWriteValue"+$file.fullname.Replace(":","").Replace(" ","_")) -iTimeout 7200
        $File=Get-ChildItem -Path $Path
            
        
        $lsInput=Get-Content -Path $Path
        $lsOutput=@()
        foreach($sInput in $lsInput)
        {
            if ($Input -match "#")
                {continue}

            $data=($sInput -as [string]).Split("=")
            if ($data[0] -ne $Key)
            {
                $lsOutput+=$sInput
            }
            else
            {
                $bValueFind=$true
                $lsOutput+=@($Key+"="+$Value)       
            }
        }
        if($bValueFind -eq $false){$lsOutput+=@($Key+"="+$Value)}
        $lsOutput|Out-File -FilePath $Path -Encoding ascii -Width 1024 -Force
        
        
        #Check if the entry has been written successfully or not 
        $content=@()
        $content=[array](Get-Content -Path $Path)
        if($content.Contains($Key+"="+$Value) )
        {
            $pipe.Dispose()
            break
        }
        else
        {
            Start-Sleep -Seconds 1
            $iMaxTrial++
            $pipe.Dispose()
        }

        

    }
    

}

Function Get-LatestMediaInFolder($family,$sFolderPath)
{
    function newMediaObj($IsMedia,$Version,$media,$item)
    {
        $obj=New-Object PSObject
        $Obj|Add-Member -MemberType NoteProperty -Name "IsMedia" -Value $IsMedia
        $Obj|Add-Member -MemberType NoteProperty -Name "Version" -Value $Version
        $Obj|Add-Member -MemberType NoteProperty -Name "media" -Value $media
        $Obj|Add-Member -MemberType NoteProperty -Name "item" -Value $item         
        return $Obj
    }
    
    $files=[array](Get-ChildItem -Path $sFolderPath)
    $currentOldestMedia=0
    $latestMedia=$null
    foreach($item in $files)
    {
        #won't check folder
        if($item.PSIsContainer){continue}
        #won't check file that is doing upload
        if($item.name -match "upload") {continue}
        $currentItem=checkFileName -family $family -fileName $item.name
        if($currentItem -eq $null){continue}
        if($currentItem[0] -eq $true -and [int]::Parse($currentItem[2]) -gt $currentOldestMedia)
        {
            $currentOldestMedia=[int]::Parse($currentItem[2])
            $latestMedia=newMediaObj -IsMedia $currentItem[0] -Version $currentItem[1] -media $currentItem[2] -item $item            
        }
    }
    return $latestMedia
}

Function Wait-FileAvailable([int]$TimeOut=20*60,$Path,$Action="")
{
    #Wait for 10 minutes till the file become available
    #Action will be taken after the execution finish
    #Lock will return the filestream
    
    
    $CanRead=$false
                    
    $iCanReadTimeOut=0 

    $mode = [System.IO.FileMode]::Open
    $access = [System.IO.FileAccess]::Read
    $sharing = [IO.FileShare]::Read
    $lsOutput=@()

    # If it is read only or does not exit, then quit the loop becuase we don't want to test read-only file


    
    
    if(Test-Path -Path $Path)
    {
        $bReadOnly=(Get-ItemProperty -Path $Path).IsReadOnly;
        if($bReadOnly)
        {
            cls
            Write-Host -Object "$Path is read only. We are going to continue in 60s"
            Start-Sleep -Seconds 60
        
            return 0
        }

    }
    # create the FileStream and StreamWriter objects
        
    
    
    while($CanRead -eq $false)
    {
        if((Test-Path -Path $Path) -eq $false)
        {
            return 0
        }

        try
        {
            $FileObject=(New-Object System.IO.FileStream ($Path),$mode,$access,$sharing -ErrorAction Ignore)
            $CanRead=$FileObject.CanRead
        }
        catch
        {
            [gc]::Collect()
            $CanRead=$false
        }
        if($CanRead)
        {
            #return boolean value if the action is not lock
            if($Action.tolower() -eq "lock")
            {
                return $FileObject
            }
            else
            {
                $FileObject.Close()
                return 1
            }
        }
        else
        {
            if($FileObject -ne $null)
            {
                $FileObject.Dispose()
            }
            Start-Sleep -Seconds 15
            $iCanReadTimeOut=$iCanReadTimeOut+15
            Write-Host -Object ("Waiting for $Path become available. Current waiting time is $iCanReadTimeOut") -ForegroundColor Red            
            #Maximum waiting time is 10 minute per file
            if($iCanReadTimeOut -gt $TimeOut)
            {
                $FileObject.Close()
                return 0
            }
        }
        
    }

    $FileObject.Close()
}

Function Load-ValueFromSetting([string]$SettingPath,[string]$Value,$DefaultValue,$Seperator=",",[switch]$PlainTextOnly)
{
    if($PlainTextOnly.IsPresent)
    {
        $PlainTextOnly=$true   
    }
    else
    {
        $PlainTextOnly=$false
    }
    return LoadValueFromSetting -Path $SettingPath -sValue $Value -DefaultValue $DefaultValue -Seperator $Seperator -PlainTextOnly $PlainTextOnly
}
Function LoadValueFromSetting([string]$Path,[string]$sValue,$DefaultValue,$Seperator=",",$reload=0,$PlainTextOnly,[switch]$Express)
{
    


    $iMaxLoad=2
    $bValueFind=$false
    if ($Path -notmatch ".ini")
    {
        $Path=Join-Path -Path $Path -ChildPath "setting.ini"
    }

    
    if($reload -eq 0 -and !$PlainTextOnly)
    {
        #generate sql friendly table name
        $sqlTable=Split-Path -Path $Path -Leaf
        

        #$result=Load-ValueFromSql -tableName $sqlTable -key $sValue -project "GLOBAL"
        $result=$null
        if($result -eq $null)
        {
            $result=$null
            #$result=Load-ValueFromSql -tableName $sqlTable -key $sValue -project $Global:Project
            
        }
        if($result -ne $null)
        {
            $data=@("","")
            $data[1]=$result
            $bValueFind=$true
        }

    }
    
    


    if(!$bValueFind)
    {
        
        if (Test-Path ($Path))
        {
            $file=Get-Item -Path $Path

            $arInput=$null
            while($arInput -eq $null -and $file.Length -ne 0)
            {
                if($Express.IsPresent)
                {
                    $arInput=Get-Content -Path $Path
                }
                else
                {
                    $pipe=Wait-PipelineFree -Pipelinename ("ARTLoadValue"+$file.fullname.Replace(":","").Replace(" ","_")) -iTimeout 3000
                    $arInput=Get-Content -Path $Path
                    $pipe.Dispose()
                }
                
            }
            foreach($Input in $arInput)
            {
                if ($Input -match "#"){continue}
                $data=($Input -as [string]).Split("=")
                if ($data[0].ToUpper() -eq $sValue.ToUpper())
                {
                    $bValueFind=$true
                    if(!$PlainTextOnly)
                    {
                        #[void](Write-ValueToSql -tableName $sqlTable -key $sValue -value $data[1] -project $project)
                    }
                    
                    break
                }
            }
        }
        else
        {
            Write-Host("Fail to find "+$Path+", continue with the default settings")
            $bValueFind=$false
        }      
    }

    if($bValueFind -eq $false)
    {        
        if($reload -lt $iMaxLoad -and !$Express.IsPresent)
        {
            return LoadValueFromSetting -Path $Path -sValue $sValue -DefaultValue $DefaultValue -Seperator $Seperator -reload ($reload+1)
        }
       Write-Host("Fail to find "+$sValue)
       return $DefaultValue 
    }
    else
    {
        Write-Host($sValue+"="+$data[1]+" Output successfully")
        #Help to fight some unallowed charcter like &
        if($data[1][0] -eq "`"" -and $data[1][$data[1].Length-1] -eq "`"")
        {
            $data[1]=$data[1].Substring(1,$data[1].Length-2)
        }

        if($data[1] -match $Seperator)
        {
            return $data[1].tostring().Split($Seperator)|where{$_ -ne "" -and $_ -ne $null}
        }
        else
        {
            return $data[1]
        }
    }

    
}

Function ChangeRegistry([string]$sRegistry,[string]$Name,$sValue)
{
    if (Test-Path -Path $sRegistry)
    {
        Set-ItemProperty -Path $sRegistry -Name $Name -Value $sValue
    }
    else
    {
        New-ItemProperty -Path $sRegistry -Name $Name -Value $sValue
    }
}

Function GeneratePlanFile([string]$sScriptLocation,[string]$sTestCase)
{        
        $lsPlan=@()      
        $sTemp="[ ] script: "+$sScriptLocation
        $lsPlan+=@($sTemp)
        $sTemp="[+] Testcase "+$sTestCase+"()"
        $lsPlan+=@($sTemp)
        $sTemp="	[ ] testcase: "+$sTestCase
        $lsPlan+=@($sTemp)
        return $lsPlan
}

Function ResultDetailGenerator([string]$RexLine)
{
    #Initialization
    $sStepInfoMark="==="

    #Extract the result txt/rex file locaion from plan location
    $sOutput=@()
    $lsTemp=$RexLine.Split(",")
    $sTemp=$lsTemp[0] -replace [char]34,""
    $sTxtLocation=$sTemp -replace ".pln",".txt"
    $sRexLocation=$sTemp -replace ".pln",".rex"

    $sTxt=Get-Content -Path $sTxtLocation
    #Analyze .rex file and figure out whether it passed or not
    $sCQ=($lsTemp[2] -replace [char]34,"")

    if($lsTemp[4] -eq "0")
    {
        $sResult="PASS"
    }
    else
    {
        #$sErrInfo=$lsTemp[5] -replace [char]34,""
        $sErrInfo=$lsTemp[5].Split("*")
        foreach ($v in $sErrInfo)
        {
            $sErrInfo1+=$v
        }
        $sErrInfo=$sErrInfo1.ToString() -replace [char]34,""
        $sResult=[char]247+$sErrInfo
    }
    
    #Try to locate the step in the .txt file
    $sReadMode=$false
    $sStep=""
    if ($sResult -ne  "PASS")
    {
        $sResult+="[$($env:COMPUTERNAME)][$(Split-Path -Path $sTxtLocation -Leaf)]"
        foreach($sLine in $sTxt)
        {

            $sLine1=$sLine -replace("\\","//")
            $sErrInfo1=$sErrInfo -replace("\\","//")
            if ($sLine1 -match $sCQ)
            {
                $sReadMode=$true
            }
        
            if ($sReadMode -eq $false)        
            {
                continue
            }

            if ($sLine1 -match $sErrInfo1)
            {
                $sResult=$sStep+$sResult
                
                break
            }
            else
            {
                if ($sLine1 -match $sStepInfoMark)
                {
                    $sStep=$sLine
                }
            }
        }
    }
    
    $sOutput+=@($sCQ)
    $sOutput+=@($lsTemp[4])    
    $sOutput+=@($sResult)

    return $sOutput
}

Function DetailAnalyzer([string]$sDetail)
{
    #iClass Error
    # 0     TBD
    # 1     Script Maintenance Required
    # 2     Suspicious defect
    # 3     Other
    $iClass=0
    [array]$lsSMR=@()
    $lsSMR+=@("The handle for this object has been invalidated")
    $lsSMR+=@("Failed to resolve object")
    $lsSMR+=@("Could not find object")
    $lsSMR+=@("Open file*in*seconds")
    $lsSMR+=@("Save as dialog didn't pop up")
    $lsSMR+=@("xxx*launch")
    $lsSMR+=@("Index value*exceeds list size")
    $lsSMR+=@("Error executing")
    $lsSMR+=@("The object is not ready for user interaction because it is not enabled.")
    $lsSMR+=@("ror: Index value of * exceeds list size")
    $lsSMR+=@("Failed to start application")
    $lsSMR+=@("Window '[DialogBox]Aspen Olefins Scheduler' was not found")
    $lsSMR+=@("[SwfDialogBox]Aspen Olefins Regression Calculator  - aspenONE' was not foun")

    [array]$lsSD=@()
    $lsSD+=@("tolerance")
    $lsSD+=@("does not  exist")
    $lsSD+=@("should have")
    $lsSD+=@("different")
    $lsSD+=@("expected")
    $lsSD+=@("desired")
    $lsSD+=@("unable")
    $lsSD+=@("converge")
    $lsSD+=@("converged")
    $lsSD+=@("crash")
    $lsSD+=@("has failed")
    $lsSD+=@("expect*actual")


    [array]$lsO=@()
    $lsO+=@("Agent")
    $lsO+=@("compile errors")
    $lsO+=@("Bitmap failed to stabilize")
    $lsO+=@("Bitmaps are different")
    $lsO+=@("Agent")
    $lsO+=@("Manual")


    foreach($_ in $lsSMR)
    {
        if ($sDetail.ToLower() -match$_.ToLower())
        {
            return "Script Maintenance Required"
        }
    }

    foreach($_ in $lsO)
    {
        if ($sDetail.ToLower() -match$_.ToLower())
        {
            return "TBD"
        }
    }

    foreach($_ in $lsSD)
    {
        if ($sDetail.ToLower()-match $_.ToLower())
        {
            return "Suspicious defect"
        }
    }
    return "TBD"    
}

Function Consolidate-CSV($CSV)
{
    $CSV|Export-Csv -Path (Join-Path -Path $sParentFolder -ChildPath temp.csv)
    return (Import-Csv -Path (Join-Path -Path $sParentFolder -ChildPath temp.csv))
}

Function MergeCSV([array]$MasterCSV,[array]$MergeCSV,[string]$Mode="NewIteration")
{
    #CSV Merge Mode
    # NewIteration - The result is based upon the masterCSV
    # Update - The new result will update the result in the masterCSV
    #Add new input from mergeCSV to MasterCSV. The criteria is whether Sub_Testcase is the same
    $MergeCSVCount=0
    $MasterCSVComparisionCount=0
    
    foreach($Merge in $MergeCSV)
    {
        $bSame=$false
        $MergeCSVCount++
        $MergeTotalCount=$MergeCSV.Count
        #If the merge is not within masterCSV, then add that merge into the master csv
        $MasterCSVComparisionCount=0
        foreach($Master in $MasterCSV)
        {
            $MasterCSVComparisionCount++
            #Write-Progress -Activity "Merge Progress" -Status " $MergeCSVCount / $MergeTotalCount" -PercentComplete ($MasterCSVComparisionCount/($MasterCSV.Count)*100)
            if($Master.Sub_TestCase -eq $Merge.Sub_TestCase -and $Master.Execution_Batch -eq $Merge.Execution_Batch)
            {

                $bSame=$true
                if($Master.Result -eq "")
                {

                    $Master.Result=$Merge.Result
                    $Master.Detail=$Merge.Detail
                }
                #Write-Progress -Activity "Merge Progress" -Status " $MergeCSVCount / $MergeTotalCount" -PercentComplete (100)
                break
            }
        }
        if ($bSame -eq $false)
        {
            $MasterCSV+=$Merge
            #$MasterCSV=Consolidate-CSV -CSV $MasterCSV
        }

        if($Mode.ToUpper() -eq "UPDATE")
        {
            if($Merge.Result -ne "" -and $Merge.Result -ne $null)
            {
                $MasterQuery=$MasterCSV|where{$Merge.Sub_TestCase -eq $_.Sub_TestCase -and $Merge.Execution_Batch -eq $_.Execution_Batch}
                if ($MasterQuery -ne "" -and $MasterQuery -ne $null)
                {
                               
                    $MasterCSV=$MasterCSV|where{$_ -ne $MasterQuery}
                               
                    $MasterCSV+=$Merge

                    #$MasterCSV=Consolidate-CSV -CSV $MasterCSV
                }
            }
        }

            
    }
   
    return $MasterCSV
}
<#PiviotType About to Archieve
Function PiviotType([string]$Columns,$CSV,[array]$CurrentOutput=@())
{
    [array]$Criterias=$Columns.Split(",")|where{$_ -ne ""}
    $NewCriteria=""
    [array]$Uniques=$CSV.($Criterias[0] -as [string])|select -Unique
    if($Criterias.Length -le 1)
    {        
        $CurrentOutput=$Uniques        
    }
    else
    {
        foreach($Criteria in $Criterias)
        {
            if($Criteria -ne $Criterias[0])
            {
                $NewCriteria+=$Criteria+","
            }
        }
        $OTemps=PiviotType -Columns $NewCriteria -CSV $CSV -CurrentOuput $CurrentOutput            
        $CurrentOutput=@()
        foreach($Unique in $Uniques)
        {
            
            foreach($OTemp in $OTemps)
            {
                $sTemp=$Unique+","+$OTemp
                $CurrentOutput+=$sTemp
            }
        }
    }

    return $CurrentOutput
}
#>

Function PiviotType($CSV,[string]$Columns)
{
    $Output=@()
    $CSVQuery=$CSV|select $Columns.Split(",")
    foreach($Query in $CSVQuery)
    {
        $sTemp=""
        foreach($Column in $Columns.Split(","))
        {
            $sTemp+=$Query.($Column -as [string])+","
        }
        $Output+=@($sTemp)
    }
    $Output=$Output|Select -Unique
    return $Output
    
}

Function PiviotData($CSV,[array]$PiviotTypes,[string]$Columns)
{
    $Output=@()
    [array]$Col=$Columns.Split(",")|where{$_ -ne ""}
    foreach($Type in $PiviotTypes)
    {
        $Temp=$CSV
        For($i=0;$i -lt $Col.Length;$i++)
        {
            $Temp=$Temp|where{$_.($Col[$i] -as [string]) -eq $Type.Split(",")[$i]}
            $Output+=,@($Temp)
        }    
    }

    return $Output   
}




Function Out-HistoricalData($CSV,[string]$Columns,[string]$Project,[string]$OutFolder)
{
    Function MatchColumnAndPiviotType([string]$Column,[array]$PiviotType)
    {
        [array]$Col=$Column.Split(",")|where{$_ -ne ""}
        $Output=@()
        foreach($Type in $PiviotType)
        {
            [array]$lsTemp=$Type.split(",")|where{$_ -ne ""}
            $sTemp=""
            for($i=0;$i -lt $Col.Length;$i++)
            {                
                $sTemp+=$Col[$i]+":"+$lsTemp[$i]+" | "
            }

            $Output+=@($sTemp)
        }
        return $Output

    }
    #Generate Historical Data
    $Output+="<p><a href='$($Project)ExecutionReport.html'>Current Execution</p>"
    $PiviotType=PiviotType -CSV $CSV -Columns $Columns
    $PiviotData=PiviotData -CSV $CSV -Columns $Columns -PiviotTypes $PiviotType
    $i=0
    for($i=0;$i -lt $PiviotType.Length;$i++)
    {
        [array]$MatchColumnAndPiviotType=MatchColumnAndPiviotType -Column $Columns -PiviotType $PiviotType
        Make-HTMLOutput -Identification ($MatchColumnAndPiviotType[$i]) -CSV $PiviotData[$i] -Project ($Project+"_"+$PiviotType[$i])|Out-File -FilePath (Join-Path -Path $OutFolder -ChildPath ($Project+$i+".html"))
        $Output+="<p><a href='$($Project+$i).html'>$($MatchColumnAndPiviotType[$i])</p>"
    }
    
    $IndexContent=$Output
    #Create an Index Page for historical Data
        $Css='<style>table{margin:auto; width:98%}
            Body{background-color:rgb(247, 255, 214); Text-align:Center;}

     </style>'


    $Report = ConvertTo-Html -Title ($Project+" Project Historical Execution Report") `
                    -Head "<h1>$Project Project Historical Execution Report</h1><br>This report was ran: $(Get-Date)" `
                    -Body "$IndexContent $Css"

    $Report|Out-File (Join-Path -Path $OutFolder -ChildPath ("Index.html"))                 
}

Function Update-CQ($ResultInput="\\Nhqa-w2k12-q16.dev.aspentech.com\ART\HYSYS\MasterExecutionResult.csv",$Version="9.0",$Build="123",$ClientOS="Windows 8 - 64bit",$Submitter_Email="weiwei.wu@aspentech.com")
{    
    $ResultFolder=Split-Path -Path $ResultInput -Parent
    $lsRecord=Import-Csv -Path $ResultInput
    $lsPassed=($lsRecord|Where-Object{$_.Result -eq "PASS"}).id
    $lsOutput=@()



    foreach($sPassed in $lsPassed)
    {
        $lsOutput+=@("Testcase $sPassed()")
        $lsOutput+=@("Machine: (local)")
        $lsOutput+=@("Started: 04:28:24PM on 15-Mar-2014")
        $lsOutput+=@("Elapsed: 0:04:39")
        $lsOutput+=@("Totals:  0 errors, 0 warnings")
        $lsOutput+=@("Out Folder: C:\p4_hqperforce21666_W8X64-BLANK\qe\dev\AUTOMATION\HYSYS\V8.6\AspenHysys\data\dataout\CQ00220113 ")
        $lsOutput+=@("")
    }
    $lsOutput|Out-File -FilePath (Join-Path -Path $ResultFolder -ChildPath ExecutionOutput.txt)

    $lsOutput1=@("Submitter_Email: $Submitter_Email")
    $lsOutput1+=@("Version: V$Version")
    $lsOutput1+=@("Build: $Build")
    $lsOutput1+=@("Server_OS: Windows Server 2012")
    $lsOutput1+=@("Server_Config: Hyper-V Server")
    $lsOutput1+=@("Client_OS: $ClientOS")
    $lsOutput1+=@("Client_Config: Virtual Machine")
    $lsOutput1+=@("Virtual_Environment: Hyper-V")

    $lsOutput1|Out-File -FilePath (Join-Path -Path $ResultFolder -ChildPath ExecutionOutput.loginfo)
}




if($Function.ToUpper() -eq "FILEWATCHER")
{

    $Global:Project=$FileWatcherName
    $EventProjectName=$FileWatcherName  
    $EventParentFolder=$OutputFolder   
    #Read Value from Input
    
    $sPublishServer=Load-ValueFromSetting -SettingPath (Join-Path -Path $sParentFolder -ChildPath CenterControl.ini) -Value Publish_Server
    $Execution_Batch=Load-ValueFromSetting -SettingPath (Join-Path -Path $sParentFolder -ChildPath CenterControl.ini) -Value ($FileWatcherName+"_Execution_Batch")
    $Base_Batch=Load-ValueFromSetting -SettingPath (Join-Path -Path $sParentFolder -ChildPath CenterControl.ini) -Value ($FileWatcherName+"_Base_Batch")
    $Result_Merge_Mode=Load-ValueFromSetting -SettingPath (Join-Path -Path $sParentFolder -ChildPath CenterControl.ini) -Value ($FileWatcherName+"_Result_Merge_Mode")
    $VERSION=Load-ValueFromSetting -SettingPath (Join-Path -Path $sParentFolder -ChildPath CenterControl.ini) -Value ($FileWatcherName+"_VERSION")
    $MEDIA=Load-ValueFromSetting -SettingPath (Join-Path -Path $sParentFolder -ChildPath CenterControl.ini) -Value ($FileWatcherName+"_MEDIA")
    $StartTime=Load-ValueFromSetting -SettingPath (Join-Path -Path $sParentFolder -ChildPath CenterControl.ini) -Value ($FileWatcherName+"_Execution_Start_Time")
    $ND_User=Load-ValueFromSetting -SettingPath (Join-Path -Path $sParentFolder -ChildPath CenterControl.ini) -Value "ND_User"
    $ND_Pass=Load-ValueFromSetting -SettingPath (Join-Path -Path $sParentFolder -ChildPath CenterControl.ini) -Value "ND_Pass"
    $ClientOS=Load-ValueFromSetting -SettingPath (Join-Path -Path $sParentFolder -ChildPath CenterControl.ini) -Value ($FileWatcherName+"_ClientOS")
    $Execution_Mode=Load-ValueFromSetting -SettingPath (Join-Path -Path $sParentFolder -ChildPath CenterControl.ini) -Value ($FileWatcherName+"_Execution_Mode")
    $Installation_File=Load-ValueFromSetting -SettingPath (Join-Path -Path $sParentFolder -ChildPath CenterControl.ini) -Value ($FileWatcherName+"_Installation_File")

    #MySQL
    $MySQLAdminUserName=Load-ValueFromSetting -SettingPath (Join-Path -Path $sParentFolder -ChildPath CenterControl.ini) -Value "MySQLAdminUserName"
    $MySQLAdminPassword=Load-ValueFromSetting -SettingPath (Join-Path -Path $sParentFolder -ChildPath CenterControl.ini) -Value "MySQLAdminPassword"
    $MySQLDatabase=Load-ValueFromSetting -SettingPath (Join-Path -Path $sParentFolder -ChildPath CenterControl.ini) -Value "MySQLDatabase"
    $MySQLHost=Load-ValueFromSetting -SettingPath (Join-Path -Path $sParentFolder -ChildPath CenterControl.ini) -Value "MySQLHost"
    $Checkpoint=Load-ValueFromSetting -SettingPath (Join-Path -Path $sParentFolder -ChildPath CenterControl.ini) -Value ($FileWatcherName+"_Checkpoint")
    $SMTP_Server=Load-ValueFromSetting -SettingPath (Join-Path -Path $sParentFolder -ChildPath CenterControl.ini) -Value "SMTP_Server"
    $Email_List=Load-ValueFromSetting -SettingPath (Join-Path -Path $sParentFolder -ChildPath CenterControl.ini) -Value $FileWatcherName"_Email_List"

    #CHECKPOINT
    $SCVMM_Username=$SCVMM_Usernamea
    $SCVMM_Password=$SCVMM_Passworda
    $SCVMM_Server=Load-ValueFromSetting -SettingPath (Join-Path -Path $sParentFolder -ChildPath CenterControl.ini) -Value ("SCVMM_Server")
    $SCVMM_Port=Load-ValueFromSetting -SettingPath (Join-Path -Path $sParentFolder -ChildPath CenterControl.ini) -Value ("SCVMM_Port")

    $NumberARTCheckPointRemain=Load-ValueFromSetting -SettingPath (Join-Path -Path $sParentFolder -ChildPath CenterControl.ini) -Value ($FileWatcherName+"_NumberARTCheckPointRemain")
    $Cleanup_MemorySizeMin=Load-ValueFromSetting -SettingPath (Join-Path -Path $sParentFolder -ChildPath CenterControl.ini) -Value ($FileWatcherName+"_Cleanup_MemorySizeMin")
    
    $Execution_Start_Time=[datetime]::Parse($StartTime).ToString("yyyy-MM-dd HH:mm:ss")

    $Push_Receiver_Mode=Load-ValueFromSetting -SettingPath (Join-Path -Path $sParentFolder -ChildPath CenterControl.ini) -Value ($FileWatcherName+"_Push_Receiver_Mode") -DefaultValue ""

    
    $Query="
    INSERT INTO execution_batch 
    (Name,Product,Version,Media,Base_Batch,Installation_File)
    VALUES
    (`"$($Execution_Batch)`",`"$FileWatcherName`",`"$($VERSION)`",`"$($MEDIA)`",`"$Base_Batch`",`"$Installation_File`");
    "
    
    $Info=Query-Database -Query $Query -MySQLAdminUserName $MySQLAdminUserName -MySQLAdminPassword $MySQLAdminPassword -MySQLDatabase $MySQLDatabase -MySQLHost $MySQLHost
    
    #Update Client OS/Launch Time Info to the databank
    $Query="
        UPDATE execution_batch SET ClientOS=`"$ClientOS`",Date=`"$Execution_Start_Time`" where Name=`"$Execution_Batch`"
    "
    Query-Database -Query $Query -MySQLAdminUserName $MySQLAdminUserName -MySQLAdminPassword $MySQLAdminPassword -MySQLDatabase $MySQLDatabase -MySQLHost $MySQLHost
    #Make a list of machine list
    Write-Host("Direcotry to watch")
    $List=$FileWatcherDirectoryInput.Split(",")
    [array]$FileWatcherDirectoryList=$List|where{$_ -ne ""}

    foreach($_ in $FileWatcherDirectoryList)
    {
        Write-Host($_)   
    }
    Write-Host($FileWatcherDirectoryList.Length)
    $SourceIdentifier=$FileWatcherName
    (Get-Process|where{$_.MainWindowTitle -eq ($FileWatcherName+" FileWatcher")})|where{$_.ProcessName -ne "powershell_ise"}|Stop-Process -Force
    $Host.UI.RawUI.WindowTitle = ($FileWatcherName+" FileWatcher")

    $LastUpdate=Get-Date
    $iFirstTimeFinish=0
    [hashtable]$ClientStatusHashTable=@{}
    [hashtable]$ClientExecutionHashTable=@{}
    $VERSION=Load-ValueFromSetting -SettingPath (Join-Path -Path $sParentFolder -ChildPath CenterControl.ini) -Value ($FileWatcherName+"_VERSION")
    $MEDIA=Load-ValueFromSetting -SettingPath (Join-Path -Path $sParentFolder -ChildPath CenterControl.ini) -Value ($FileWatcherName+"_MEDIA")
    $StartTime=Load-ValueFromSetting -SettingPath (Join-Path -Path $sParentFolder -ChildPath CenterControl.ini) -Value ($FileWatcherName+"_Execution_Start_Time")
    $Client_Username=Load-ValueFromSetting -SettingPath (Join-Path -Path $sParentFolder -ChildPath CenterControl.ini) -Value ($FileWatcherName+"_Client_Username")
    $Client_Password=Load-ValueFromSetting -SettingPath (Join-Path -Path $sParentFolder -ChildPath CenterControl.ini) -Value ($FileWatcherName+"_Client_Password")
    $ClientUserName=Load-ValueFromSetting -SettingPath (Join-Path -Path $sParentFolder -ChildPath CenterControl.ini) -Value ($FileWatcherName+"_Client_Username")
    $Redirect_Email_Tunnel=Load-ValueFromSetting -SettingPath (Join-Path -Path $sParentFolder -ChildPath CenterControl.ini) -Value ("Redirect_Email_Tunnel") -DefaultValue $null
    $OldClientStatus=""
    while($true)
    {
        

        #Write-Host "iFirstTimeFinish= $iFirstTimeFinish"
            

        
        
        $ExecutionFinish=$true
        foreach($sClientDirectory in $FileWatcherDirectoryList)
        {
            
            #Get the latest heartbeat status
            if(Test-Path -Path (Join-Path -Path $sClientDirectory -ChildPath HeartBeat.ini))
            {
                $CurrentClientName=(Split-Path -Path $sClientDirectory -Leaf)
                $Progress_Stuck_List=[array](Update-ClientInfo -ProjectRoot (Split-Path -Path $sClientDirectory -Parent) -ClientStatus "execution_stop")
                $ClientStatus=(Get-Content -Path (Join-Path -Path $sClientDirectory -ChildPath HeartBeat.ini))
                #Build the HashTable
                if($ClientStatusHashTable.ContainsKey($CurrentClientName))
                {
                    if($ClientStatusHashTable[$CurrentClientName] -ne $ClientStatus)
                    {
                        Log-Server -sServerLog "$CurrentClientName status change from $ClientStatusHashTable[$CurrentClientName] to $ClientStatus"
                    }
                    $ClientStatusHashTable[$CurrentClientName]=$ClientStatus
                }
                else
                {
                    Log-Server -sServerLog "$CurrentClientName status is $ClientStatus"
                    $ClientStatusHashTable.Add($CurrentClientName,$ClientStatus)
                }

                if($SelectedOutput -eq $null)
                {
                    
                    Make-HTMLOutput -OS $ClientOS -Project $EventProjectName -Media $MEDIA -Version $VERSION -StartTime $StartTime -LastUpdateTime ($LastUpdate.ToString()) -Identification $Execution_Batch -ClientStatusList $ClientStatusHashTable -ClientExecutionHashTable $ClientExecutionHashTable|Out-File -FilePath (Join-Path -Path $EventParentFolder -ChildPath ($EventProjectName+"ExecutionReport.html"))

                    Copy-Item -Path (Join-Path -Path $EventParentFolder -ChildPath ($EventProjectName+"ExecutionReport.html")) -Destination (Join-Path -Path $sPublishServer -ChildPath $FileWatcherName) -Force -ErrorAction Ignore
                }

                
                

                if($Progress_Stuck_List -eq $null)
                {
                    Write-Host -Object "All the Client are running." -ForegroundColor Green
                }
                elseif($Progress_Stuck_List.Contains($CurrentClientName) -and $iFirstTimeFinish -eq 0)
                {                    
                    Write-Host -Object ("The latest client status for "+(Split-Path -Path $sClientDirectory -Leaf)+" is stuck") -ForegroundColor Red -BackgroundColor Black
                    $ClientStatusHashTable[$CurrentClientName]="Stuck"
                }
                else
                {
                    Write-Host -Object ("The latest client status for "+(Split-Path -Path $sClientDirectory -Leaf)+" is "+$ClientStatus) -ForegroundColor Green -BackgroundColor Gray
                }
                
            }

            if($ClientStatus -eq "Resume" -or $ClientStatus -eq "Idle" -or $ClientStatus -eq "MiniMVT" -or $OldClientStatus -eq "HYTEST")
            {
                
                
                
                $sCurrentFile=$null
                #Decide which file to use. ExecutionResult/Progress.  If we can find executionresult.csv in all the folder, it means that current execution is finished   
                if (Test-Path -Path (Join-Path -Path $sClientDirectory -ChildPath ExecutionResult.csv))
                {
                    $sCurrentFile=(Join-Path -Path $sClientDirectory -ChildPath ExecutionResult.csv)
                }
                elseif (Test-Path -Path (Join-Path -Path $sClientDirectory -ChildPath Progress.csv))
                {
                
                    $sCurrentFile=(Join-Path -Path $sClientDirectory -ChildPath Progress.csv)
                    $ExecutionFinish=$false

                    #If the execution is on progress, then check whether powershell is alive or not
                    [array]$ExecutingList=Update-ClientInfo -ProjectRoot $sParentFolder -ClientStatus ("")
                    $CurrentClient=Split-Path -Path $sClientDirectory -Leaf
                    $bInExecutingList=$false
                    $ExecutingList|foreach{if($_ -eq $CurrentClient){$bInExecutingList=$true}}
                    if($bInExecutingList)
                    {
                        #start of suspicious memory leak reg
                        Write-Host "The powershell in the client $((Split-Path -Path $sClientDirectory -Leaf)) is up and running"
                    }
                    else
                    {
                        $ClientName=(Split-Path -Path $sClientDirectory -Leaf)
                        $ClientIP=Load-ValueFromSetting -SettingPath (Join-Path -Path $sParentFolder -ChildPath CenterControl.ini) -Value ($ClientName+"_IP")
                        $ClientPASS=Load-ValueFromSetting -SettingPath (Join-Path -Path $sParentFolder -ChildPath CenterControl.ini) -Value ($FileWatcherName+"_Client_Password")
                        #Execute-RemoteCommand -IP $ClientIP -username ($ClientName+"\"+$ClientUserName) -password $ClientPASS -command "shutdown -f -r" -iTimeOut 0
                        Log-Server -sServerLog "[$ClientName]The powershell in current client is not running while the execution status is resume. A restart will be performed to resolve this problem"
                        Write-Host("Current Client is not in execution")
                        Start-Sleep -Seconds 600
                    }

                }
                else
                {
                    $ExecutionFinish=$false
                }

                #Input Performance.csv into the database
                

                $sPerfLocation=Join-Path -Path $sClientDirectory -ChildPath Performance.csv
                if(Test-Path -Path $sPerfLocation)
                {
                    $PerfClientCSV=[array](Import-Csv -Path $sPerfLocation)
                    if((Wait-FileAvailable -TimeOut 15 -Path $sPerfLocation) -eq 1)
                    {


                    
                        $PerfClientCSV=$PerfClientCSV|where{$_ -ne $PerfClientCSV[0]} -ErrorAction Ignore
                        $PerfClientCSV[$PerfClientCSV.Length-1]|Export-Csv -Path $sPerfLocation
                        $Query="
                            select * 
                            from performance join execution_batch 
                            on performance.Execution_Batch_Index=execution_batch.Index
                            where Name='$Execution_Batch';
                        "

                        #$Info=Query-Database -Query $Query -MySQLAdminUserName $MySQLAdminUserName -MySQLAdminPassword $MySQLAdminPassword -MySQLDatabase $MySQLDatabase -MySQLHost $MySQLHost


                        #Log Performance Result into SQL database
                        foreach($Record in $PerfClientCSV)
                        {
                                    
                    
                            $bNewRecord=$true

                    
                            if($bNewRecord)
                            {
                                if ($Record.TimeStamp -like "*\*")
                                {
                                    $Record.TimeStamp=$Record.TimeStamp.Replace("`\","`\`\")
                                }
    
                        
                                $Query="select execution_batch.index from execution_batch where Name=`"$Execution_Batch`";"
                                $Execution_Batch_Index=((Query-Database -Query $Query -MySQLAdminUserName $MySQLAdminUserName -MySQLAdminPassword $MySQLAdminPassword -MySQLDatabase $MySQLDatabase -MySQLHost $MySQLHost).index).Tostring()
                                $Query="
                                INSERT INTO performance 
                                (Testcase,Step,Result,Tag,TimeStamp,Execution_Batch_Index)
                                VALUES
                                (`"$($Record.Testcase)`",`"$($Record.Step)`",`"$($Record.Result)`",`"$($Record.Tag)`",`"$($Record.TimeStamp)`",$Execution_Batch_Index);
                                "
                                Query-Database -Query $Query -MySQLAdminUserName $MySQLAdminUserName -MySQLAdminPassword $MySQLAdminPassword -MySQLDatabase $MySQLDatabase -MySQLHost $MySQLHost
                        
                            }
                        }

                    }
                    $PerfClientCSV=[array]($PerfClientCSV)
                    
                    #Get the testcase that is currently under execution
                    $CurrentExecution=$PerfClientCSV[$PerfClientCSV.Count-1].Testcase
                    
                    if($ClientExecutionHashTable.ContainsKey($CurrentClientName))
                    {
                        if($ClientExecutionHashTable[$CurrentClientName] -ne $CurrentExecution)
                        {
                            Log-Server -sServerLog "$CurrentClientName start executing $CurrentExecution"
                        }
                        $ClientExecutionHashTable[$CurrentClientName]=$CurrentExecution
                    }
                    else
                    {
                        Log-Server -sServerLog "$CurrentClientName is executing: $CurrentExecution"
                        $ClientExecutionHashTable.Add($CurrentClientName,$CurrentExecution)
                    }
                    
                    $PerfClientCSV.Clear()

                }

                #When the first result csv is generated, it will combine all the csv it can find and merge the csv according to the mode
                if($sCurrentFile -ne $null)
                {

                        
                        
                    
                    if($sCurrentFile.ToLower() -match "executionresult.csv")
                    {
                        Write-Host -Object ("The latest client status for "+(Split-Path -Path $sClientDirectory -Leaf)+" finish execution") -ForegroundColor Green -BackgroundColor Black
                    }


                    $CurrentFileWriteTime=(Get-ItemProperty -Path $sCurrentFile).LastWriteTime
                    if ($LastUpdate -lt $CurrentFileWriteTime)
                    {
                        $LastUpdate=$CurrentFileWriteTime
                    }
                    $EventParentFolder=$OutputFolder                
                    $EventProjectName=$FileWatcherName                
                    $CombinedCSV=CombineCSV $FileWatcherDirectoryList
                    $CombinedCSV|Export-Csv -Path (Join-Path -Path $EventParentFolder -ChildPath ExecutionResult.csv)
                
                    #Input the value into the database
                
                    #Join execution_batch and main table together to find the execution_batch info
                    $Query="
                        select Sub_TestCase 
                        from master join execution_batch 
                        on master.Execution_Batch_Index=execution_batch.Index
                        where Name='$Execution_Batch';
                    "
                    $Info=Query-Database -Query $Query -MySQLAdminUserName $MySQLAdminUserName -MySQLAdminPassword $MySQLAdminPassword -MySQLDatabase $MySQLDatabase -MySQLHost $MySQLHost

                    #Log Result into SQL database
                    foreach($Record in ([array]($CombinedCSV|where{$_.Result -ne "" -and $_.Result -ne $null})))
                    {
                    
                    
                        $bNewRecord=$true
                        foreach($_ in ([array]$Info.Sub_TestCase))
                        {
                            if($_ -eq $Record.Sub_TestCase)
                            {
                                $bNewRecord=$false
                                break
                            }
                        }

                        if($bNewRecord)
                        {
                            if ($Record.Headline -match "`"")
                            {
                                $Record.Headline=$Record.Headline.Replace("`"","`\`"")
                            }
                            if ($Record.Detail -match "`"")
                            {
                                $Record.Detail=$Record.Detail.Replace("`"","`\`"")
                            }
                            if($Record.Iteration -eq "")
                            {
                                $Record.Iteration=0
                            }
                        
                            $Query="select execution_batch.index from execution_batch where Name=`"$Execution_Batch`";"
                            $Execution_Batch_Index=((Query-Database -Query $Query -MySQLAdminUserName $MySQLAdminUserName -MySQLAdminPassword $MySQLAdminPassword -MySQLDatabase $MySQLDatabase -MySQLHost $MySQLHost).index).Tostring()
                            $Query="
                            INSERT INTO master 
                            (id,Headline,Product,Area,fullname,Script_Name,Automated,Automation_Tools,TestCase_Type,Script_Accepted_Date,SubTest_Count,Execution_Batch_Index,Find_In_Script,Sub_TestCase,Result,Detail,Iteration)
                            VALUES
                            (`"$($Record.id)`",`"$($Record.Headline)`",`"$($Record.Product)`",`"$($Record.Area)`",`"$($Record.fullname)`",`"$($Record.Script_Name)`",`"$($Record.Automated)`",`"$($Record.Automation_Tools)`",`"$($Record.TestCase_Type)`",`"$($Record.Script_Accepted_Date)`",`"$($Record.SubTest_Count)`",$Execution_Batch_Index,`"$($Record.Find_In_Script)`",`"$($Record.Sub_TestCase)`",`"$($Record.Result)`",`"$($Record.Detail)`",`"$($Record.Iteration)`");
                            "
                            Query-Database -Query $Query -MySQLAdminUserName $MySQLAdminUserName -MySQLAdminPassword $MySQLAdminPassword -MySQLDatabase $MySQLDatabase -MySQLHost $MySQLHost

                        }
                    }
                    $Info=@()
                    #Scan through the sequence and TBD the sequence
                                
                
                    foreach($Entry in ($CombinedCSV|where{$_.Sequence -ne "" -and $_.Sequence -ne $null}))
                    {
                        #To which point will we start
                        $Sequence=$Entry.Sequence
                        $SequenceIndex=[int]($Sequence.Split("_")[0])
                        #List of sequence                                       
                        $lsSequence=$Sequence.Split("_")[1].Split(",")|where{$_ -ne "" -and $_ -ne $null}

                        #Log TBD for the file that is after current one if the current result if fail
                        if($Entry.Result -ne "" -and $Entry.Result -ne $null -and $Entry.Result -ne "PASS")
                        {
                            for($iSequence=$SequenceIndex;$iSequence -lt $lsSequence.Length;$iSequence++)
                            {
                                if (($CombinedCSV|where{$_.Sub_TestCase -eq $lsSequence[$iSequence]}) -ne $null)
                                {
                                    ($CombinedCSV|where{$_.Sub_TestCase -eq $lsSequence[$iSequence]}).Result="TBD"
                                    ($CombinedCSV|where{$_.Sub_TestCase -eq $lsSequence[$iSequence]}).Detail="$($Entry.Sub_TestCase) Fail. This block rest of the file in the sequence"
                                }
                            }
                        }

                    }
             
                
                    #if there is no masterexecutionresult, then generate one,else merge the file we have
                    if (Test-Path -Path (Join-Path -Path $EventParentFolder -ChildPath MasterExecutionResult.csv))
                    {
                        $MasterExecutionResult=Import-Csv -Path (Join-Path -Path $EventParentFolder -ChildPath MasterExecutionResult.csv)
                        $CombinedCSV=MergeCSV -MasterCSV $MasterExecutionResult -MergeCSV $CombinedCSV -Mode $Result_Merge_Mode
                        $CombinedCSV|Export-Csv -Path (Join-Path -Path $EventParentFolder -ChildPath MasterExecutionResult.csv)
                    }
                    else
                    {
                        $CombinedCSV|Export-Csv -Path (Join-Path -Path $EventParentFolder -ChildPath MasterExecutionResult.csv)
                    }
                
                    $SelectedOutput=$($CombinedCSV|where{$_.Execution_Batch -eq $Execution_Batch}|Select-Object id,Product,Area,Headline,SubTest_Count,Result)
                    #update reuslt into P4
                    Make-HTMLOutput -OS $ClientOS -CSV $SelectedOutput -Project $EventProjectName -Media $MEDIA -Version $VERSION -StartTime $StartTime -LastUpdateTime ($LastUpdate.ToString()) -Identification $Execution_Batch -ClientStatusList $ClientStatusHashTable -ClientExecutionHashTable $ClientExecutionHashTable|Out-File -FilePath (Join-Path -Path $EventParentFolder -ChildPath ($EventProjectName+"ExecutionReport.html"))
                    Copy-Item -Path (Join-Path -Path $EventParentFolder -ChildPath ($EventProjectName+"ExecutionReport.html")) -Destination (Join-Path -Path $sPublishServer -ChildPath $FileWatcherName) -Force -ErrorAction Ignore
                    
                    #Get the DURATION of current execution
                    $Duration=(New-TimeSpan -Start ([datetime]::Parse($StartTime)) -End ($LastUpdate)).TotalHours.ToString()
                    $Query="UPDATE execution_batch SET Duration=$Duration where Name=`"$Execution_Batch`""
                    Query-Database -Query $Query -MySQLAdminUserName $MySQLAdminUserName -MySQLAdminPassword $MySQLAdminPassword -MySQLDatabase $MySQLDatabase -MySQLHost $MySQLHost
                    #Publish the CQ automatic login file
                    if($FileWatcherName -ne "HYTEST")
                    {
                        AutoUpdate -sProduct $FileWatcherName
                    }
                    

                    #end fo suspicious memory leak region

                    #Publish Result file into the publish server
                                     
                
                    if(Test-Path $sPublishServer)
                    {
                        Copy-Item -Path (Join-Path -Path $EventParentFolder -ChildPath ("MasterExecutionResult.csv")) -Destination (Join-Path -Path $sPublishServer -ChildPath $FileWatcherName)
                        Copy-Item -Path (Join-Path -Path $EventParentFolder -ChildPath ($EventProjectName+"ExecutionReport.html")) -Destination (Join-Path -Path $sPublishServer -ChildPath $FileWatcherName)
             
                        Write-Host((Get-Date -Format "yyyy/mm/dd hh:mm:ss"))
                        #Write-Host("External File Watcher <"+$SourceIdentifier+"> is outputing file into "+(Join-Path -Path $EventParentFolder -ChildPath ($EventProjectName+"ExecutionReport.html")))
                    }
                    else
                    {
                        try
                        {
                            New-Item -ItemType directory -Path (Join-Path -Path $sPublishServer -ChildPath $FileWatcherName)
                        }
                        catch
                        {
                            cls
                            Write-Host -Object "Please make sure you have access to $(Join-Path -Path $sPublishServer -ChildPath $FileWatcherName)"
                            Start-Sleep -Seconds 60                        

                        }
                    }

                }
            #End of resume
            }
            else
            {
                $ExecutionFinish=$false
            }
            
            #If Push_Receiver_Switch is "", then it means that it is single machine mode. We are just going to perform simple copy
            if($Push_Receiver_Mode -eq "")
            {
                Check-ServerPushReceiver -sClientDirectory $sClientDirectory -SMTP_Server $SMTP_Server -sPublishServer $sPublishServer -FileWatcherName $FileWatcherName -SCVMM_Username $SCVMM_Username -SCVMM_Password $SCVMM_Password -SCVMM_Server $SCVMM_Server -SCVMM_Port $SCVMM_Port -NumberARTCheckPointRemain $NumberARTCheckPointRemain -VERSION $VERSION -MEDIA $MEDIA -Client_Email_List $Email_List -MySQLAdminUserName $MySQLAdminUserName -MySQLAdminPassword $MySQLAdminPassword -MySQLDatabase $MySQLDatabase -MySQLHost $MySQLHost
            }


        }

        if($ExecutionFinish -eq $true)
        {
            
            $iFirstTimeFinish++
            if($iFirstTimeFinish -eq 1)
            {
                Log-Server -sServerLog "Execution Finish"
                #Update the result to CQ
                if($FileWatcherName -ne "HYTEST")
                {
                    AutoUpdate -sProduct $FileWatcherName -CQUpdate
                }
                
                
                #Create the checkpoint and change the memory storage
                if($Checkpoint.ToLower() -ne "no")
                {
                    foreach($ClientEntry in $FileWatcherDirectoryList)
                    {
                        $Client=Split-Path -Path $ClientEntry -Leaf
                        Log-Server -sServerLog "Creating VM checkpoint"
                        Create-SnapshotwithNLatest -Username $SCVMM_Username -Password $SCVMM_Password -Server $SCVMM_Server -PORT $SCVMM_Port -VMName $Client -NumberCheckpointRemain $NumberARTCheckPointRemain -CheckpointName ("Version="+$VERSION+"Media="+$MEDIA) -MinMemorySize $Cleanup_MemorySizeMin
                    }
                   
                }
                #End of Create the checkpoint and change the memory storage

                #Send different email according to the execution mode
                $Automation_Engineer_Email="Weiwei.Wu@aspentech.com"
                if($Execution_Mode.tolower() -eq "mvt" -or $Execution_Mode.tolower() -eq "minimvt" -or $Execution_Mode -match "Resume")
                {
                        
                    $htmlInfo = generateHTMLfromCSV -media $Installation_File -clientConfig "Windows 10 Enterirpise" -startTime $Execution_Start_Time -endTime (Get-Date) -resultsFile (Join-Path -Path $sClientDirectory -ChildPath ExecutionResult.csv) -clientName ($(Split-Path -Path $FileWatcherDirectoryList[0] -Leaf))
                    $htmlBody = $htmlInfo[0]
                    $passRate = $htmlInfo[1]
                    $attachment=(Join-Path -Path $sClientDirectory -ChildPath ExecutionResult.csv)
                    Log-Server -sServerLog "Send out MVT Email [ $passRate % ] Pass Rate for [$FileWatcherName] $($Version) [Media: $Media] - Automated Media Verification Test"
                    $emailSubject = "[ $passRate % ] Pass Rate for [$FileWatcherName] $($Version) [Media: $Media] - Automated Media Verification Test"
                    if($Redirect_Email_Tunnel -ne $null)
                    {
                        New-PushInfo -sServerDirectory $Redirect_Email_Tunnel -uploadNow -lsContent $htmlInfo -Email_Subject $emailSubject -Email_Body_HTML_Switch -Email_To $Email_List -Email_Attachments $attachment -ClientStatus ($FileWatcherName+"_"+$Execution_Mode)
                    }
                    else
                    {
                        Send-MailMessage -From "weiwei.wu@aspentech.com" -To $Email_List -Subject $emailSubject -BodyAsHtml $htmlBody -SmtpServer $SMTP_Server -Attachments $attachment -Cc @("jason.zhao@aspentech.com","weiwei.wu@aspentech.com")                        
                        
                    }
                    
                        
                }
                elseif($Execution_Mode.ToLower() -eq "machineprestaging" -or $Execution_Mode -match "ProfessorXPrestaging")
                {
                    #Send out email
                    $Body="
                        Gentle People,
                
                            ART has finished machine preparation. You can use the machine right now
                        
                            Product: $FileWatcherName                       
                            Version: $Version
                            Media: $Media
                        
                            Tasks Performed:
                            1. Revert to base image
                            2. Download the media and perform installation
                            3. Run Automatic Testcase
                            4. Automatic testcase result analysis and report generation
                            5. Create the new checkpoint and delete out-of-date checkpoint

                            

                        Best,

                        Automation Team
                    "
                    Log-Server -sServerLog "Send out Machine Pre-staging email"
                    Send-MailMessage -From $Automation_Engineer_Email -To $Email_List -Subject "Machine Ready: $(Split-Path -Path $FileWatcherDirectoryList[0] -Leaf) $(Split-Path -Path $FileWatcherDirectoryList[1] -Leaf) $(Split-Path -Path $FileWatcherDirectoryList[2] -Leaf) $(Split-Path -Path $FileWatcherDirectoryList[3] -Leaf) $(Split-Path -Path $FileWatcherDirectoryList[4] -Leaf)" -Body $Body -SmtpServer $SMTP_Server
                    
                }
                elseif($Execution_Mode.ToLower() -eq "HYTEST")
                {
                    
                    

                    
                    
                    

                    $iTimeout = 0
                    #start of while
                    
                    
                    #end of while
                    #start of if send
                    $bSend=$true
                    if($bSend){

                        #pending here
                        #1.read email address and generate email list
                        #2.get the attachement from right folder
                        #3.get build number
                        #4.send out email
                        
                        $mailList = @("weiwei.wu@aspentech.com")

                        
                        $attachment=(Join-Path -Path $sClientDirectory -ChildPath Hytest_Results.xls)
                                                
                        $emailSubject = "[$FileWatcherName] $($Version) [Media: $Media] - Automated HYTEST"
                        #$htmlInfo = generateHTMLfromCSV -media $Installation_File -clientConfig "Windows 10 Enterirpise With Office 2013" -startTime $Execution_Start_Time -endTime (Get-Date) -resultsFile (Join-Path -Path $sClientDirectory -ChildPath ExecutionResult.csv) -clientName ($(Split-Path -Path $FileWatcherDirectoryList[0] -Leaf))
                        
                        $htmlBody=Get-Content -Path (Join-Path -Path $sClientDirectory -ChildPath hytest.html)
                        #$htmlBody += $htmlInfo[0]
                        $passRate = $htmlInfo[1]
                        
                        $htmlString="Please find execution result under \\hqfile1\Departments\QA\MVF HYSYS\ <br>"
                        $htmlBody|foreach{$htmlString+=$_}

                        Send-MailMessage -From "weiwei.wu@aspentech.com" -To $Email_List -Subject $emailSubject -BodyAsHtml $htmlString -SmtpServer $SMTP_Server -Attachments $attachment -Cc @("weiwei.wu@aspentech.com")                        
                        #Update based on bulid number
                        $mediaInfo = checkFileName "$(getVar("PRODUCT_FAMILY"))" "$(getVar("MEDIA_FILE_TO_TEST"))" "$(getVar("LAST_MEDIA_NAME_ON_DEMAND"))"
                        $mediaInfo[2]=$sBuild
                        $mediaInfo[3]=""
                        
                        #setVar "MASTER_DIRECTORY_PATH" "C:\BAF"
                        
                        
                        
                    }
                    #end of if send
                    
                }


                
                #Remove the "Run" Sign in the Scheduled_Run queue
            
                $QueryInfo=(Query-Database -Query "select * from execution_batch where execution_batch.name='$Base_Batch'" -MySQLAdminUserName $MySQLAdminUserName -MySQLAdminPassword $MySQLAdminPassword -MySQLDatabase $MySQLDatabase -MySQLHost $MySQLHost)
            
                #Clean up Run
                $Scheduled_Run=$QueryInfo.Scheduled_Run.ToString().Replace("Run","")

                #Remove first item in the queue
                if($Scheduled_Run -match ",")
                {
                    $First=(([array]($Scheduled_Run.split(",")|where{$_ -ne "" -and $_ -ne $null}))[0]).ToString()
                    $Scheduled_Run=$Scheduled_Run.Replace($First,"")
                    $Scheduled_Run=$Scheduled_Run.Replace(",,",",")
                }

                $Scheduled_Run=$Scheduled_Run.Replace("`\","`\`\")
                $Query="
                    UPDATE execution_batch SET Scheduled_Run=`"$Scheduled_Run`" where Name=`"$Base_Batch`"
                "        
                Query-Database -Query $Query -MySQLAdminUserName $MySQLAdminUserName -MySQLAdminPassword $MySQLAdminPassword -MySQLDatabase $MySQLDatabase -MySQLHost $MySQLHost

                
            
            }

            #Write a general file 

            
            

            Write-Host("All the execution finish successfully")
            
            Start-Sleep -Seconds 120
        }
        else
        {
            Start-Sleep -Seconds 60
        }

                        
                
        
    }
}




    try
    {
    $MySQLAdminUserName=LoadValueFromSetting -Path $sCenterControlINI -sValue "MySQLAdminUserName" -Express
    $MySQLAdminPassword=LoadValueFromSetting -Path $sCenterControlINI -sValue "MySQLAdminPassword" -Express
    $MySQLDatabase=LoadValueFromSetting -Path $sCenterControlINI -sValue "MySQLDatabase" -Express
    $MySQLHost=LoadValueFromSetting -Path $sCenterControlINI -sValue "MySQLHost" -Express   
    
    

    }
    catch
    {
        $Error.Clear()
    }
    