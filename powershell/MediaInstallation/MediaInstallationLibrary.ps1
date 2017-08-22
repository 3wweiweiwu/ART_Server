$sARTUri='http://mvf1:3000'
iex ((New-Object System.Net.WebClient).DownloadString("$sARTUri/api/ps/ARTLibrary.ps1"))
function Write-InstalledProductInfo($sARTUri,$vision,$project,$task,$Installation_File)
{
    $installed_media=Split-Path -Path $Installation_File -Leaf
    $os=$((Get-WmiObject -Class Win32_OperatingSystem).Name)
    $InstalledSoftware=[array](Get-WmiObject -Class Win32_Product)
    $lsinstalled_media=@()

    foreach($app in $InstalledSoftware){
        $lsinstalled_media+=@(@{
            name=$app.name;
            version='N/A';
            build=$app.Version
        })
    
    }

    $otherFieldInfo=@{
        created_by=$env:COMPUTERNAME;
        os=$os;    
        series=$installed_media;
        installed_products=$lsinstalled_media;
        installed_media=@{
            name=$installed_media;
        }
    
    }

    Write-Setting -sARTServerUri $sARTUri -vision $vision -project $project -task $task -key "InstalledProductInfo" -value $otherFieldInfo
}

function Load-InstalledProductInfo($sARTUri,$vision,$project,$task){
    return Load-Setting -sARTServerUri $sARTUri -vision $vision -project $project -task $task -key InstalledProductInfo
}

Write-Host -Object "Media Installation Library Loadded"


