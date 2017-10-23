$sARTUri='http://mvf1:3000'
$taskName="Install_Media"
$DebugPreference="Continue"
$DebugPreference='SilentlyContinue'
iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/MediaInstallation@MediaInstallationLibrary.ps1"))
iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/Library.ps1"))
iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/CommonHeader.ps1"))
$taskName=$Task.taskInstallPatch


$lsCurrentSchedule=([array](Load-Setting -sARTServerUri $sARTUri -vision $vision -task $Task.mediaDetection -key current_schedule))
$Installation_File=$lsCurrentSchedule[$lsCurrentSchedule.Length-1]


$Local_Media_Storage='c:\p4'
if((Test-Path -Path $Local_Media_Storage) -eq $false)
{
    md $Local_Media_Storage
}
$sLocal_Media_Path=Join-Path -Path $Local_Media_Storage -ChildPath (Split-Path -Path $Installation_File -Leaf)


    
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

        
        $imageDriveName+=':'
        
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



#run each single application in the updater to update the software
$updaterPath=Join-Path -Path $imageDriveName -ChildPath "\Patches\"
$lsUpdates=Get-ChildItem -Path $imageDriveName -Recurse -File|where{$_.FullName -match ".xml" -and $_.FullName -match "Patches"}
 

foreach($item in $lsUpdates)
{
    #kill related application
    Get-Process|where{$_.Name -match "aspen" -or $_.Name -match "IP21" -or $_.Name -match "Python" -or $_.Description -match "Aspen" -or $_.Company -match "aspen"}|Stop-Process -Force
    
    #isntall media if there is any
    $executableName=$item.FullName.ToLower().Replace(".xml",".exe")
    if(Test-Path -Path $executableName)
    {
        
        Write-Host -Object "Executing $executableName"
        Start-Sleep -Seconds 5
        Get-Process|where{$_.Name -match "aspen" -or $_.Name -match "IP21" -or $_.Name -match "Python" -or $_.Description -match "Aspen" -or $_.Company -match "aspen"}|Stop-Process -Force
        $workingDirectory=Split-Path -Path $executableName -Parent
        $process=Start-Process -FilePath $executableName  -WorkingDirectory $workingDirectory -Wait
        
        
    }    
    

}




Set-NextProject -sARTServerUri $sARTUri -vision $vision -project $projectId                

