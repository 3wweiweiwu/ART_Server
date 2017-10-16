$sARTUri='http://mvf1:3000'
$taskName="Install_Media"
$DebugPreference="Continue"
$DebugPreference='SilentlyContinue'
iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/MediaInstallation@MediaInstallationLibrary.ps1"))
iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/Library.ps1"))
iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/CommonHeader.ps1"))
$taskName=$Task.installMedia

#load setting from server for the task

    $PRODUCT_LIST=Load-Setting -sARTServerUri $sARTUri -project $blueprint -task $taskName -key 'PRODUCT_LIST'
    $Product_Folder_In_Installation_Package=Load-Setting -sARTServerUri $sARTUri -project $blueprint -task $taskName -key 'Product_Folder_In_Installation_Package'
    $Product_Verification=Load-Setting -sARTServerUri $sARTUri -project $blueprint -task $taskName -key 'Product_Verification'
    $lsCurrentSchedule=([array](Load-Setting -sARTServerUri $sARTUri -vision $vision -task $Task.mediaDetection -key current_schedule))
    $Installation_File=$lsCurrentSchedule[$lsCurrentSchedule.Length-1]
    $iEstimatedProductInstallationTimeInHour=4 #estimated installation time is 3 hours, if it takes more than 3 horus and haven't finished, then restart the machine
#test installation file, if this is 


    
#copy detected from hqfiler to drive

$Local_Media_Storage='c:\p4'
if((Test-Path -Path $Local_Media_Storage) -eq $false)
{
    md $Local_Media_Storage
}
#Copy-Item -Path $Installation_File -Destination $Local_Media_Storage -Force|Out-Host
$sLocal_Media_Path=Join-Path -Path $Local_Media_Storage -ChildPath (Split-Path -Path $Installation_File -Leaf)

#download installation script form p4
    $sInstallerPath="//depot/qe/dev/AUTOMATION/BAF/Shared Features/aspenOneInstaller/AspenOneInstaller/"
    $P4_Work_Space_Folder="c:\p4"
    Sync-FromP4 -P4_Location_List @($sInstallerPath) -P4_User wuwei -P4_Server hqperforce2:1666 -P4_PASSWORD Perforce562 -P4_Work_Space_Folder $P4_Work_Space_Folder -P4_Work_Space_Name ART
    
#deploy installation option to p4 file
    
    $sSilkInstallerFolder=Convert-P4LocationToWinLocation -P4Location $sInstallerPath -P4_Work_Space_Folder $P4_Work_Space_Folder
    $sSettingIniPath=Join-Path -Path $sSilkInstallerFolder -ChildPath setting.ini

    "PRODUCT_LIST=$PRODUCT_LIST"|Out-File -FilePath $sSettingIniPath -Force

#prepare media ready for the installation
    if($Installation_File -match "iso$")
    {
                    
        try
        {

            $isoInfo = Mount-DiskImage -ImagePath $sLocal_Media_Path -PassThru
            $imageDriveName = ($isoInfo | Get-Volume).DriveLetter
        
        }
        catch{
            &'C:\Program Files (x86)\MagicDisc\miso.exe' NULL -mnt 1 $sLocal_Media_Path|Out-Host
            $imageDriveName = 'e'
        }

        Set-Location -Path $sTemp
        $imageDriveName+=':'
        $imageDriveName=([array](Get-ChildItem -Path $imageDriveName -Directory|where{$_.Name -like $Product_Folder_In_Installation_Package}))[0].fullname
    }
    elseif("$Installation_File" -match 'exe')
    {
        #Extract the exe file    
        &$sLocal_Media_Path -o"C:\p4" -y|out-host
                        
        $imageDriveName='c:\p4'
                        
    }
    else
    {
        #Extract the zip file    
        $sRootFolder=$sParentFolder        
        $InstallationFolder="$Installation_File".Replace('.zip','')
        unzip  $sLocal_Media_Path "C:\P4"
        $imageDriveName=([array]((Get-ChildItem -Path C:\p4\ -Recurse|where{$_.Name.ToLower() -eq "setup.exe" -or $_.Name.ToLower() -eq "aspenONE Update Agent.exe"}).Directory.FullName))[0]
    }

#Invoke Silk to Install Media
    $Silk_Installer_Project_File=Join-Path -Path $sSilkInstallerFolder -ChildPath AspenOneInstaller.vtp
    $Silk_Installer_Plan_File=Join-Path -Path $sSilkInstallerFolder -ChildPath "\Plan\main.pln"
    $sMediaInstallerPath=(Join-Path -Path $imageDriveName -ChildPath setup.exe)
    $sUpdateAgentPath=(Join-Path -Path $imageDriveName -ChildPath "aspenONE Update Agent.exe")
    if(Test-Path -Path $sMediaInstallerPath)
    {
        #install media
        start-process -FilePath $sMediaInstallerPath -WorkingDirectory $imageDriveName;


    }
    elseif(Test-Path -Path $sUpdateAgentPath){
        #start update agent
        start-process -FilePath $sUpdateAgentPath -WorkingDirectory $imageDriveName;
    }
                            
    while(([array]((Get-Process).MainWindowTitle|where{$_ -like '*aspenONE*Installer*' -or $_ -like '*aspenONE Update Agent*'})).Count -eq 0)
    {
        write-host 'Waiting for aspenONE Installer or update agent to showup'
        Start-Sleep -Seconds 10
    }
    
    while($true)
    {
        #kill open agent and patner.exe
        Get-Process|where{$_.ProcessName -match 'openagent'}|Stop-Process -Force
        Get-Process|where{$_.ProcessName -match 'partner'}|Stop-Process -Force
        Start-Sleep -Seconds 10

        &partner.exe -proj $Silk_Installer_Project_File -resextract -q -r $Silk_Installer_Plan_File -quiet
                                
        #if open agent cannot be launched within 5mins, then go through this process again
        $iTime=0
        $iOpenAgentTimeOut=60*5
        $iOpenAgentRetry=0
        $bOpoenAgentTimeout=$false
        while((Get-Process|where{$_.ProcessName -match 'openagent'}) -eq $null)
        {
            Start-Sleep -Seconds 10
            $iTime=$iTime+10
            Write-Progress "Waiting for open agent to show up. Have been waiting for $iTime s"
            if($iTime -gt $iOpenAgentTimeOut)
            {
                Get-Process|where{$_.ProcessName -eq 'partner'}|Stop-Process -Force
                Write-Host -Object "ERROR while waiting for open agent"
                $bOpoenAgentTimeout=$true
                $iOpenAgentRetry++
                break
            }

        }
        #if open agent timeout for more than 5 times, then reboot the machine
        if($iOpenAgentRetry -gt 10)
        {
            Restart-Computer -Force
            Write-Progress -Activity "Restart machine because open agent has timed out for more than 10 times"
            Start-Sleep -Seconds 3600
        }
        #if open agent launch successfully, then stop quit the loop
        if(!$bOpoenAgentTimeout)
        {
            Write-Progress -Activity "Open agent is launched successfully"
            break
        }
        

    }
    #If installation take more than time limit, then restart the machine
    $silkStartTime=Get-Date
    while ((Get-Process|where{$_.ProcessName -eq 'partner'}) -ne $null)
    {
        $silkElapsedTime=(((Get-Date)-$silkStartTime).TotalHours)
        Write-Progress -Activity "Silk Installation has been ongoing for $silkElapsedTime hours "
        if($silkElapsedTime -gt $iEstimatedProductInstallationTimeInHour)
        {
            Restart-Computer -Force
            Start-Sleep -Seconds 3600
        }
        Start-Sleep -Seconds 10
    }



               

     
    $bVerified=$false

    if([string]($Product_Verification) -notmatch "none")
    {
        #Check Whether the software has been installed or not
        
        $InstalledSoftware=[array](Get-WmiObject -Class Win32_Product|where{$_.Vendor -match "AspenTech"})
        foreach($Verification in $Product_Verification)
        {
            $bVerified=$false
            if (($InstalledSoftware.Caption|where{$_ -like ("*"+$Verification.replace("(","*").replace(")","*")+"*")}).Count -gt 0)
            {
                $bVerified=$true

            }
            if($bVerified -eq $false)
            {
                Write-Host ("The installation failed becuase it cannot find $($InstalledSoftware.Caption) in installed software list")
                $InstallFail=$true
                break
            }
                    
        }

    }
    else{
        $bVerified=$true
    }
    
    
    if(!$bVerified)
    {
        Write-Progress ("The installation failed. Revert to Task Queue")
        #Fix folder problem
        Set-ItemProperty -Path HKLM:\SOFTWARE\AspenTech\Setup -Name "ASPENROOT64" -Value ""                    
        Restart-Computer -Force
        Start-Sleep -Seconds 3600
    }
    
                
    
    #created image meta info
    Write-InstalledProductInfo -sARTUri $sARTUri  -vision $vision -project $blueprint -task $taskName -Installation_File $Installation_File
                    
    Set-NextProject -sARTServerUri $sARTUri -vision $vision -project $projectId                
    Set-ItemProperty -Path HKLM:\SOFTWARE\Wow6432Node\Microsoft\Windows\CurrentVersion\RunOnce -Name ATM_Admin -Value ""
                
    
                
    Start-Sleep -Seconds 3600