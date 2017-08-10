$sParentFolder=([System.IO.Path]::GetDirectoryName($myInvocation.MyCommand.Definition))
.(Join-Path -Path $sParentFolder -ChildPath ARTLibrary.ps1)
function Get-PendingTasks($sARTUri,$projectId){
    $projectdoc=Get-Project -sARTUri $sARTUri -projectId $projectId
    $lsResult=@()
    foreach($item in $projectdoc.pending_tasks){
        $lsResult+=@($item.task.name)
    }
    return $lsResult
    
}
function Get-HostForProject($sARTUri,$projectId){
    $projectdoc=Get-Project -sARTUri $sARTUri -projectId $projectId

    return $projectDoc.host.name
    
}
Write-Host -Object "NodeOB_Library is loaded!"