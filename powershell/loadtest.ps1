$i=0;
while($true){
    Start-Job -ScriptBlock{
        $sARTServerUri='http://mvf1:3000'        
        iex ((New-Object System.Net.WebClient).DownloadString("$sARTServerUri/api/ps/ARTLibrary.ps1"))
        Get-ProjectsInMachine
    }
    $i++
}